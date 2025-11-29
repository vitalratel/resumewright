/**
 * Common Components
 * Shared UI components for the ResumeWright extension
 *
 * These components eliminate code duplication and ensure
 * consistent UI patterns and accessibility across the extension.
 */

export { TECH_TERMS } from '../../constants/techTerms';
export { getShortcutDisplay } from '../../utils/shortcuts';
export { Alert } from './Alert';
export type { AlertVariant } from './Alert';

export { Button } from './Button';

export { ConfirmDialog } from './ConfirmDialog';
export type { ConfirmDialogProps } from './ConfirmDialog';

export { KeyboardHint } from './KeyboardHint';

export { PageLayoutPreview } from './PageLayoutPreview';

export {
  Skeleton,
  SkeletonFileImport,
  SkeletonHeader,
  SkeletonQuickSettings,
  SkeletonSettings,
  SkeletonText,
} from './Skeleton';

export { Spinner } from './Spinner';
export type { SpinnerSize } from './Spinner';
export {
  ATS,
  Compatible,
  Compression,
  CV,
  DPI,
  Fallback,
  KB,
  MB,
  PDF,
  TechTerm,
  TSX,
  WASM,
} from './TechTerm';
