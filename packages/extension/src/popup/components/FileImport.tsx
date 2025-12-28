// ABOUTME: CV file upload component with drag-and-drop support and validation.
// ABOUTME: Validates file type, size, content and provides user-friendly error messages.

import { DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import { FILE_SIZE_LIMITS, validateFileExtension } from '@/shared/domain/pdf/validation';
import { getLogger } from '@/shared/infrastructure/logging/instance';
import { useEvent } from '../hooks/core/useEvent';
import { useFileReader } from '../hooks/integration/useFileReader';
import { formatFileSize } from '../utils/formatting';
import { ConfirmDialog } from './common/ConfirmDialog';
import { DragDropZone } from './import/DragDropZone';
import { ImportInfoCard } from './import/ImportInfoCard';

interface FileImportProps {
  /** Callback when file is validated - can be async */
  onFileValidated: (content: string, fileName: string, fileSize: number) => void | Promise<void>;
  onClearFile: () => void;
  importedFile?: { name: string; size: number } | null;
}

// Use constant from shared services instead of hardcoded value
const MAX_FILE_SIZE = FILE_SIZE_LIMITS.MAX_INPUT; // 1MB
const ACCEPTED_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

export function FileImport({ onFileValidated, onClearFile, importedFile }: FileImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { readAsText } = useFileReader();

  // Local validation state (React 19 pattern - component manages own state)
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Success feedback state
  const [showSuccess, setShowSuccess] = useState(false);

  // Confirm dialog state for clear file action
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Show success feedback when file is validated
  useEffect(() => {
    if (
      importedFile !== null &&
      importedFile !== undefined &&
      (validationError === null || validationError === undefined || validationError === '') &&
      !isValidating
    ) {
      // Defer setState to avoid synchronous call in effect
      queueMicrotask(() => {
        setShowSuccess(true);
      });
      const timer = setTimeout(() => {
        queueMicrotask(() => {
          setShowSuccess(false);
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [importedFile, validationError, isValidating]);

  const handleFile = async (file: File) => {
    // Helper to log validation errors to console and set local error state
    const logAndSetError = (errorMessage: string) => {
      // AC10: Console logging for validation errors
      getLogger().error('FileImport', 'Validation Error', {
        errorMessage,
        fileName: file.name,
        fileSize: file.size,
      });
      setValidationError(errorMessage);
      setIsValidating(false);
    };

    // Reset previous errors and start validation
    setValidationError(null);
    setIsValidating(true);
    // Hide success message when starting new validation
    setShowSuccess(false);

    // Validate file extension
    if (!validateFileExtension(file.name, ACCEPTED_EXTENSIONS)) {
      // P1-A11Y-001: User-friendly error message
      logAndSetError(
        `This file type isn't supported. Please select your CV file from Claude (it should end in .tsx)`,
      );
      return;
    }

    // Validate MIME type to prevent extension spoofing
    // TypeScript/TSX files should be text/plain or empty string (browser dependent)
    // Note: 'application/x-tiled-tsx' is detected by some systems for .tsx files
    const validMimeTypes = [
      'text/plain',
      'text/typescript',
      'text/tsx',
      'application/typescript',
      'application/x-tiled-tsx',
      '',
    ];
    if (!validMimeTypes.includes(file.type)) {
      logAndSetError(
        `This doesn't appear to be a valid TSX file. The file type is "${file.type || 'unknown'}". Please make sure you're selecting the correct file from Claude.`,
      );
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      // P1-A11Y-001: User-friendly error message
      logAndSetError(
        `This file is too big (${formatFileSize(file.size)}). CV files from Claude are usually under 1MB. Try simplifying your CV or exporting it again.`,
      );
      return;
    }

    // Check for empty file
    if (file.size === 0) {
      // P1-A11Y-001: User-friendly error message
      logAndSetError(
        'This file appears to be empty. Please make sure you exported your CV correctly from Claude.',
      );
      return;
    }

    try {
      // Read file content
      const content = await readAsText(file);

      // Basic content validation
      if (!content.trim()) {
        // P1-A11Y-001: User-friendly error message
        logAndSetError(
          "This file doesn't contain any content. Please try exporting your CV from Claude again.",
        );
        return;
      }

      // Content-based validation to ensure it's actually TSX/React code
      // Check for common TSX/React patterns
      const hasReactImport =
        /import(?:\s+\S.*(?:[\n\r\u2028\u2029]\s*|[\t\v\f \xA0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF])|\s{2,})from\s+['"]react['"]/i.test(
          content,
        );
      const hasJSXElements = /<[A-Z][a-z0-9]*/i.test(content); // JSX tags (component or HTML)
      const hasExportDefault = /export\s+default/.test(content); // export default pattern

      if (!hasReactImport || (!hasJSXElements && !hasExportDefault)) {
        logAndSetError(
          "This file doesn't look like a valid CV from Claude. It should contain React/TSX code. Please make sure you're importing the correct file.",
        );
        return;
      }

      // Call validation callback with content (React 19 pattern - properly await)
      try {
        await onFileValidated(content, file.name, file.size);
        setIsValidating(false);
        // Success is shown via useEffect watching importedFile
      } catch (error) {
        // Errors from onFileValidated (e.g., conversion errors)
        logAndSetError(
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred during validation.',
        );
      }
    } catch {
      // P1-A11Y-001: User-friendly error message for file reading errors
      logAndSetError(
        "We couldn't open this file. It might be corrupted or in an unexpected format. Try exporting your CV from Claude again.",
      );
    }
  };

  const handleClearFile = useEvent(() => {
    // Confirmation before clearing file
    setShowClearConfirm(true);
  });

  const handleConfirmClear = useEvent(() => {
    onClearFile();
    // Hide success message when clearing file
    setShowSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowClearConfirm(false);
  });

  const handleDismissSuccess = useEvent(() => {
    setShowSuccess(false);
  });

  return (
    <div className="space-y-4">
      <ImportInfoCard />

      {showSuccess && importedFile && (
        <output
          aria-live="polite"
          aria-atomic="true"
          className="px-3 py-1.5 bg-success/10 border border-success/30 rounded-md text-sm text-success-text flex items-center justify-between animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <span>✓</span>
            CV validated successfully
          </div>
          <button
            type="button"
            onClick={handleDismissSuccess}
            className="gap-2 hover:text-success-text focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
            aria-label="Dismiss success message"
          >
            <XMarkIcon className="w-3 h-3" aria-hidden="true" />
          </button>
        </output>
      )}

      {importedFile ? (
        <div className="border-2 border-success bg-success/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="w-8 h-8 text-success" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-success-text">{importedFile.name}</p>
                <p className="text-xs text-success-text/80">{formatFileSize(importedFile.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearFile}
              className="text-success hover:text-success/80 p-2 rounded-md hover:bg-success/20 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
              aria-label="Clear imported file"
            >
              <XMarkIcon className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : (
        <DragDropZone onFileDrop={handleFile} isValidating={isValidating} />
      )}

      {validationError !== null && validationError !== undefined && validationError !== '' && (
        <div
          role="alert"
          data-testid="validation-error"
          className="px-3 py-1.5 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive-text"
        >
          {validationError}
        </div>
      )}

      {isValidating && (
        <output
          aria-live="polite"
          className="border-2 border-info/30 bg-info/10 rounded-lg p-4 animate-pulse block"
        >
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-info/20 border-t-info"></div>

            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-info-text">Validating file...</p>
              <div className="space-y-1">
                <div className="h-2 bg-info/30 rounded-md w-3/4"></div>
                <div className="h-2 bg-info/30 rounded-md w-1/2"></div>
              </div>
            </div>
          </div>
        </output>
      )}

      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear File?"
        message="Clear this file? You can import it again if needed."
        confirmText="Clear"
        confirmVariant="warning"
        onConfirm={handleConfirmClear}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}
