/**
 * FileImport Component
 *
 * Handles CV file upload with drag-and-drop support and validation.
 * Validates file type, size, and content before passing to conversion pipeline.
 *
 * Features:
 * - Drag-and-drop file upload with visual feedback
 * - File type validation (.tsx, .ts, .jsx, .js)
 * - File size validation (max 1MB)
 * - Syntax error detection with user-friendly messages
 * - Collapsible help card with auto-minimize after 3 launches
 * - Success feedback on valid file import
 *
 * @example
 * ```tsx
 * <FileImport
 *   onFileValidated={(content, name, size) => startConversion(content)}
 *   onValidationError={(error) => showError(error)}
 *   onClearFile={() => resetState()}
 *   importedFile={currentFile}
 *   validationError={error}
 *   isValidating={false}
 * />
 * ```
 *
 * @see {@link ConvertingState} for next step after validation
 */

import { DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FILE_SIZE_LIMITS, validateFileExtension } from '@/shared/domain/pdf';
import { getLogger } from '@/shared/infrastructure/logging';
import { useFileReader } from '../hooks';
import { tokens } from '../styles/tokens';
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

export const FileImport = React.memo(({
  onFileValidated,
  onClearFile,
  importedFile,
}: FileImportProps) => {
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
    if ((importedFile !== null && importedFile !== undefined) && (validationError === null || validationError === undefined || validationError === '') && !isValidating) {
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
      getLogger().error('FileImport', 'Validation Error', { errorMessage, fileName: file.name, fileSize: file.size });
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
    const validMimeTypes = ['text/plain', 'text/typescript', 'text/tsx', 'application/typescript', 'application/x-tiled-tsx', ''];
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
      logAndSetError('This file appears to be empty. Please make sure you exported your CV correctly from Claude.');
      return;
    }

    try {
      // Read file content
      const content = await readAsText(file);

      // Basic content validation
      if (!content.trim()) {
        // P1-A11Y-001: User-friendly error message
        logAndSetError('This file doesn\'t contain any content. Please try exporting your CV from Claude again.');
        return;
      }

      // Content-based validation to ensure it's actually TSX/React code
      // Check for common TSX/React patterns
      const hasReactImport = /import(?:\s+\S.*(?:[\n\r\u2028\u2029]\s*|[\t\v\f \xA0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF])|\s{2,})from\s+['"]react['"]/i.test(content);
      const hasJSXElements = /<[A-Z][a-z0-9]*/i.test(content); // JSX tags (component or HTML)
      const hasExportDefault = /export\s+default/.test(content); // export default pattern

      if (!hasReactImport || (!hasJSXElements && !hasExportDefault)) {
        logAndSetError(
          'This file doesn\'t look like a valid CV from Claude. It should contain React/TSX code. Please make sure you\'re importing the correct file.',
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
          error instanceof Error ? error.message : 'An unexpected error occurred during validation.',
        );
      }
    }
    catch {
      // P1-A11Y-001: User-friendly error message for file reading errors
      logAndSetError(
        'We couldn\'t open this file. It might be corrupted or in an unexpected format. Try exporting your CV from Claude again.',
      );
    }
  };

  const handleClearFile = useCallback(() => {
    // Confirmation before clearing file
    setShowClearConfirm(true);
  }, []);

  const handleConfirmClear = useCallback(() => {
    onClearFile();
    // Hide success message when clearing file
    setShowSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowClearConfirm(false);
  }, [onClearFile]);

  // P1-REACT-PERF: Memoize success dismiss handler
  const handleDismissSuccess = useCallback(() => {
    setShowSuccess(false);
  }, []);

  return (
    <div className={tokens.spacing.sectionGapCompact}>
      {/* Extracted to ImportInfoCard component */}
      <ImportInfoCard />

      {/* Success feedback message - Dismissible */}
      {showSuccess && importedFile && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={`${tokens.spacing.alert} ${tokens.colors.success.bg} ${tokens.colors.success.border} ${tokens.borders.default} ${tokens.borders.rounded} ${tokens.typography.small} ${tokens.colors.success.text} flex items-center justify-between ${tokens.animations.fadeIn}`}
        >
          <div className={`flex items-center ${tokens.spacing.gapSmall}`}>
            <span>✓</span>
            CV validated successfully
          </div>
          <button
            type="button"
            onClick={handleDismissSuccess}
            className={`${tokens.spacing.gapSmall} hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 ${tokens.borders.rounded}`}
            aria-label="Dismiss success message"
          >
            {/* Consistent icon sizing using tokens */}
            <XMarkIcon className={tokens.icons.xs} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* File imported state or drag-drop zone */}
      {importedFile ? (
        <div className={`border-2 ${tokens.colors.success.borderStrong} ${tokens.colors.success.bg} ${tokens.borders.roundedLg} ${tokens.spacing.card}`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${tokens.spacing.gapMedium}`}>
              <DocumentTextIcon className={`${tokens.icons.lg} ${tokens.colors.success.icon}`} aria-hidden="true" />
              <div>
                <p className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.success.textStrong}`}>{importedFile.name}</p>
                <p className={`${tokens.typography.xs} ${tokens.colors.success.text}`}>{formatFileSize(importedFile.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearFile}
              className={`${tokens.colors.success.icon} hover:text-green-700 ${tokens.buttons.iconOnly.default} ${tokens.borders.rounded} ${tokens.colors.success.hover} ${tokens.effects.focusRing.replace('focus:ring-blue-500', 'focus:ring-green-500')}`}
              aria-label="Clear imported file"
            >
              <XMarkIcon className={tokens.icons.sm} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : (
        /* Extracted to DragDropZone component */
        <DragDropZone onFileDrop={handleFile} isValidating={isValidating} />
      )}

      {/* Validation error */}
      {(validationError !== null && validationError !== undefined && validationError !== '') && (
        <div
          role="alert"
          data-testid="validation-error"
          className={`${tokens.spacing.alert} ${tokens.colors.error.bg} ${tokens.colors.error.border} ${tokens.borders.default} ${tokens.borders.rounded} ${tokens.typography.small} ${tokens.colors.error.textStrong}`}
        >
          {validationError}
        </div>
      )}

      {/* Validating state - P2: Enhanced with skeleton */}
      {isValidating && (
        <div role="status" aria-live="polite" className={`border-2 ${tokens.colors.info.border} ${tokens.colors.info.bg} ${tokens.borders.roundedLg} ${tokens.spacing.card} animate-pulse`}>
          <div className={`flex items-center ${tokens.spacing.gapMedium}`}>
            {/* Spinner */}
            <div className={`${tokens.animations.spin} ${tokens.borders.full} h-6 w-6 border-2 ${tokens.colors.loading.spinner} ${tokens.colors.loading.spinnerDark}`}></div>

            {/* Loading text and skeleton */}
            <div className={`flex-1 ${tokens.spacing.gapSmall}`}>
              <p className={`${tokens.typography.small} ${tokens.typography.medium} ${tokens.colors.info.textStrong}`}>Validating file...</p>
              <div className="space-y-1">
                <div className={`h-2 ${tokens.colors.loading.skeleton} ${tokens.borders.rounded} w-3/4`}></div>
                <div className={`h-2 ${tokens.colors.loading.skeleton} ${tokens.borders.rounded} w-1/2`}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear file confirmation dialog */}
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
});
