/**
 * useFontUpload Hook
 * Extracted upload logic from FontUpload component
 *
 * Combines font metadata management, file validation, upload logic, and progress tracking
 */

import { useCallback, useRef, useState } from 'react';
import browser from 'webextension-polyfill';
import { CUSTOM_FONT_LIMITS } from '@/shared/domain/fonts/models/Font';
import { MessageType } from '@/shared/types/messages';

interface UseFontUploadReturn {
  // Metadata state
  fontFamily: string;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  fontFamilyError: string;

  // Upload state
  uploading: boolean;
  decompressing: boolean;
  uploadProgress: number;

  // Handlers
  setFontFamily: (value: string) => void;
  setFontWeight: (value: number) => void;
  setFontStyle: (value: 'normal' | 'italic') => void;
  setFontFamilyError: (error: string) => void;
  handleFileSelect: (file: File) => Promise<void>;
  validateFontFamily: () => boolean;
  resetForm: () => void;

  // File input ref
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

interface UseFontUploadOptions {
  onUploadSuccess: () => Promise<void>;
  onError: (error: string) => void;
}

/**
 * Custom hook for managing font upload workflow
 *
 * Handles:
 * - Font metadata state (family, weight, style)
 * - File validation (type, size, format)
 * - Upload progress tracking
 * - Error handling with recovery guidance
 * - Form reset after successful upload
 */
export function useFontUpload({
  onUploadSuccess,
  onError,
}: UseFontUploadOptions): UseFontUploadReturn {
  // Font metadata state
  const [fontFamily, setFontFamily] = useState('');
  const [fontWeight, setFontWeight] = useState<number>(400);
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>('normal');
  const [fontFamilyError, setFontFamilyError] = useState<string>('');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [decompressing, setDecompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validate font family - returns true if valid
   */
  const validateFontFamily = useCallback((): boolean => {
    if (!fontFamily.trim()) {
      setFontFamilyError('Font family name is required');
      return false;
    }
    setFontFamilyError('');
    return true;
  }, [fontFamily]);

  /**
   * Reset file input
   */
  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setFontFamily('');
    setFontWeight(400);
    setFontStyle('normal');
    setFontFamilyError('');
    resetFileInput();
  }, [resetFileInput]);

  /**
   * Validate file extension
   */
  const validateFileType = useCallback((file: File): boolean => {
    const validExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
    const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;

    if (!validExtensions.includes(ext)) {
      onError(
        `Invalid file type "${ext || 'unknown'}". Please select a TrueType (.ttf), OpenType (.otf), WOFF (.woff), or WOFF2 (.woff2) font file and try again.`,
      );
      resetFileInput();
      return false;
    }
    return true;
  }, [onError, resetFileInput]);

  /**
   * Validate file size
   */
  const validateFileSize = useCallback((file: File): boolean => {
    if (file.size > CUSTOM_FONT_LIMITS.MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
      const maxSizeMB = (CUSTOM_FONT_LIMITS.MAX_FILE_SIZE / 1024 / 1024).toFixed(1);
      onError(
        `Font file "${file.name}" is too large (${fileSizeMB}MB). Maximum file size is ${maxSizeMB}MB. Try compressing the font or use a different format (WOFF2 offers better compression).`,
      );
      resetFileInput();
      return false;
    }
    return true;
  }, [onError, resetFileInput]);

  /**
   * Get error recovery guidance based on error message
   */
  const getErrorGuidance = useCallback((errorMessage: string): string => {
    const lower = errorMessage.toLowerCase();

    if (lower.includes('storage') || lower.includes('quota')) {
      return ' Try deleting unused fonts to free up space, or choose a smaller font file.';
    }
    if (lower.includes('decompression') || lower.includes('decompress')) {
      return ' The font file may be corrupted. Try re-downloading the font or use a different format (TTF/OTF instead of WOFF/WOFF2).';
    }
    if (lower.includes('cff') || lower.includes('postscript')) {
      return ' This font uses PostScript/CFF outlines which are not supported. Please use a TrueType-based font instead.';
    }
    return ' Please check that the font file is valid and try again with a different file.';
  }, []);

  /**
   * Handle file selection and upload
   * Comprehensive validation with actionable error messages
   * Progress tracking through upload stages
   */
  const handleFileSelect = useCallback(async (file: File) => {
    // Validate metadata
    if (!validateFontFamily()) {
      return;
    }

    // Validate file type and size
    if (!validateFileType(file) || !validateFileSize(file)) {
      return;
    }

    setUploading(true);
    setDecompressing(false);
    setUploadProgress(0);
    onError(''); // Clear previous errors

    try {
      // Stage 1: Reading file (0-20%)
      setUploadProgress(10);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Stage 2: Validating (20-40%)
      setUploadProgress(30);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Stage 3: Processing/Decompressing (40-80%)
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'woff' || ext === 'woff2') {
        setDecompressing(true);
        setUploadProgress(50);
      }
      else {
        setUploadProgress(60);
      }

      // Convert file to byte array for message passing
      const arrayBuffer = await file.arrayBuffer();
      const fileBytes = Array.from(new Uint8Array(arrayBuffer));
      
      // Upload via message passing
      await browser.runtime.sendMessage({
        type: MessageType.UPLOAD_CUSTOM_FONT,
        payload: {
          fileName: file.name,
          fileBytes,
          metadata: {
            family: fontFamily.trim(),
            weight: fontWeight,
            style: fontStyle,
          },
        },
      });

      setDecompressing(false);

      // Stage 4: Finalizing (80-100%)
      setUploadProgress(90);
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadProgress(100);

      // Reset form
      resetForm();

      // Notify parent
      await onUploadSuccess();
    }
    catch (err) {
      // Actionable error messages with recovery guidance
      let errorMessage = 'Failed to upload font. ';

      if (err instanceof Error) {
        errorMessage += err.message;
        errorMessage += getErrorGuidance(err.message);
      }
      else {
        errorMessage += 'An unknown error occurred. Please try again with a different font file.';
      }

      onError(errorMessage);
      setDecompressing(false);
      setUploadProgress(0);
      resetFileInput();
    }
    finally {
      setUploading(false);
    }
  }, [
    fontFamily,
    fontWeight,
    fontStyle,
    onUploadSuccess,
    onError,
    validateFontFamily,
    validateFileType,
    validateFileSize,
    resetForm,
    resetFileInput,
    getErrorGuidance,
  ]);

  return {
    // Metadata state
    fontFamily,
    fontWeight,
    fontStyle,
    fontFamilyError,

    // Upload state
    uploading,
    decompressing,
    uploadProgress,

    // Handlers
    setFontFamily,
    setFontWeight,
    setFontStyle,
    setFontFamilyError,
    handleFileSelect,
    validateFontFamily,
    resetForm,

    // Ref
    fileInputRef,
  };
}
