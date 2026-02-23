// ABOUTME: File import module — handles drag-drop, file input, and client-side validation.
// ABOUTME: Calls showState('ready') on valid file or shows inline error on invalid file.

import { formatFileSize } from '@/popup/utils/formatting';
import { FILE_SIZE_LIMITS, validateFileExtension } from '@/shared/domain/pdf/validation';
import { getLogger } from '@/shared/infrastructure/logging/instance';
import { sendMessage } from '@/shared/messaging';
import type { UIState } from './converter';

interface FileImportDeps {
  showState: (state: UIState) => void;
  announce: (message: string, assertive?: boolean) => void;
}

// ─── In-memory file store (read by conversion.ts) ────────────────────────────

interface ImportedFile {
  name: string;
  size: number;
  content: string;
}

let importedFile: ImportedFile | null = null;

export function getImportedFile(): ImportedFile | null {
  return importedFile;
}

export function clearImportedFile(): void {
  importedFile = null;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initFileImport(deps: FileImportDeps): void {
  const { showState, announce } = deps;

  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const dropZone = document.getElementById('drop-zone')!;
  const btnBrowse = document.getElementById('btn-browse')!;
  const btnClear = document.getElementById('btn-clear-file')!;

  // Browse Files button + drop zone click → open file picker
  btnBrowse.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('click', () => fileInput.click());

  // File input change
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) processFile(file, deps);
    fileInput.value = ''; // allow re-selecting same file
  });

  // Drag-drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-primary', 'bg-primary/10');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-primary', 'bg-primary/10');
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-primary', 'bg-primary/10');
    const file = e.dataTransfer?.files[0];
    if (file) processFile(file, deps);
  });

  // Clear file button
  btnClear.addEventListener('click', () => {
    importedFile = null;
    showState('import');
    announce('File removed');
  });
}

// ─── File processing ──────────────────────────────────────────────────────────

const ACCEPTED_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];
const VALID_MIME_TYPES = [
  'text/plain',
  'text/typescript',
  'text/tsx',
  'application/typescript',
  'application/x-tiled-tsx',
  '',
];

async function processFile(file: File, deps: FileImportDeps): Promise<void> {
  const { showState, announce } = deps;

  hideValidationError();
  announce('Validating file...');

  // Extension check
  if (!validateFileExtension(file.name, ACCEPTED_EXTENSIONS)) {
    showValidationError(
      `This file type isn't supported. Please select your CV file from Claude (it should end in .tsx)`,
    );
    return;
  }

  // MIME type check
  if (!VALID_MIME_TYPES.includes(file.type)) {
    showValidationError(
      `This doesn't appear to be a valid TSX file. The file type is "${file.type || 'unknown'}". Please make sure you're selecting the correct file from Claude.`,
    );
    return;
  }

  // Size check
  if (file.size > FILE_SIZE_LIMITS.MAX_INPUT) {
    showValidationError(
      `This file is too big (${formatFileSize(file.size)}). CV files from Claude are usually under 1MB. Try simplifying your CV or exporting it again.`,
    );
    return;
  }

  if (file.size === 0) {
    showValidationError(
      'This file appears to be empty. Please make sure you exported your CV correctly from Claude.',
    );
    return;
  }

  // Read content
  let content: string;
  try {
    content = await readAsText(file);
  } catch {
    showValidationError(
      'Unable to read this file. Please try exporting your CV from Claude again.',
    );
    return;
  }

  if (!content.trim()) {
    showValidationError(
      "This file doesn't contain any content. Please try exporting your CV from Claude again.",
    );
    return;
  }

  // Basic content check — must look like React/TSX
  const hasReactImport =
    /import(?:\s+\S.*(?:[\n\r\u2028\u2029]\s*|[\t\v\f \xA0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF])|\s{2,})from\s+['"]react['"]/i.test(
      content,
    );
  const hasJSXElements = /<[A-Z][a-z0-9]*/i.test(content);
  const hasExportDefault = /export\s+default/.test(content);

  if (!hasReactImport || (!hasJSXElements && !hasExportDefault)) {
    showValidationError(
      "This file doesn't look like a valid CV from Claude. It should contain React/TSX code. Please make sure you're importing the correct file.",
    );
    return;
  }

  // JSX tag balance check — catches unclosed elements
  if (!hasBalancedJSXTags(content)) {
    showValidationError(
      'This file has mismatched JSX tags. Please make sure your CV file from Claude is complete and unmodified.',
    );
    return;
  }

  // TSX syntax check via WASM background worker
  try {
    const result = await sendMessage('validateTsx', { tsx: content });
    if (!result.valid) {
      showValidationError(
        'This file has TSX syntax errors. Please make sure your CV file from Claude is complete and unmodified.',
      );
      return;
    }
  } catch {
    // If background isn't ready, allow through — conversion will catch it
    getLogger().warn('FileImport', 'TSX syntax check skipped (background unavailable)');
  }

  // All checks passed
  importedFile = { name: file.name, size: file.size, content };

  // Populate ready state UI
  const readyFilename = document.getElementById('ready-filename')!;
  const readyFilesize = document.getElementById('ready-filesize')!;
  readyFilename.textContent = file.name;
  readyFilesize.textContent = formatFileSize(file.size);

  showState('ready');
  announce(`File ready: ${file.name}. Click Export to PDF or press Ctrl+E.`);
  getLogger().info('FileImport', 'File validated successfully', {
    fileName: file.name,
    fileSize: file.size,
  });
}

// ─── Validation error helpers ─────────────────────────────────────────────────

function showValidationError(message: string): void {
  const container = document.getElementById('validation-error')!;
  const text = document.getElementById('validation-error-text')!;
  text.textContent = message;
  container.hidden = false;
  container.focus?.();
}

function hideValidationError(): void {
  document.getElementById('validation-error')!.hidden = true;
}

// ─── File reading ─────────────────────────────────────────────────────────────

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

// ─── JSX tag balance check ────────────────────────────────────────────────────

// Void elements never need a closing tag in HTML/JSX
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/**
 * Check that common HTML elements in JSX are properly opened and closed.
 * Returns false if a closing tag is encountered that doesn't match the
 * most-recently-opened tag — a clear sign of malformed JSX.
 */
function hasBalancedJSXTags(content: string): boolean {
  // Match only lowercase HTML element tags (not React components)
  const TAG_RE = /<(\/?)([a-z][a-z0-9]*)((?:\s[^>]*)?)(\/?)>/g;
  const stack: string[] = [];

  for (let match = TAG_RE.exec(content); match !== null; match = TAG_RE.exec(content)) {
    const [, slash, tag, , selfClose] = match;

    if (VOID_ELEMENTS.has(tag) || selfClose === '/') continue;

    if (slash === '/') {
      // Closing tag — must match top of stack
      if (stack.length === 0 || stack[stack.length - 1] !== tag) {
        return false;
      }
      stack.pop();
    } else {
      stack.push(tag);
    }
  }

  return true; // extra unclosed tags are allowed (e.g. fragments, React components)
}
