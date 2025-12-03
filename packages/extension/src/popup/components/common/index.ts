/**
 * Common Components
 * Shared UI components for the ResumeWright extension
 *
 * These components eliminate code duplication and ensure
 * consistent UI patterns and accessibility across the extension.
 */

export { TECH_TERMS } from '../../constants/techTerms';
export { getShortcutDisplay } from '../../utils/shortcuts';
export type { AlertVariant } from './Alert';
export { Alert } from './Alert';

export { Button } from './Button';
export type { ConfirmDialogProps } from './ConfirmDialog';
export { ConfirmDialog } from './ConfirmDialog';

export {
  Skeleton,
  SkeletonExportSection,
  SkeletonFileImport,
  SkeletonHeader,
  SkeletonSettings,
} from './Skeleton';
export type { SpinnerSize } from './Spinner';
export { Spinner } from './Spinner';
export type { Tab } from './TabGroup';
export { TabGroup } from './TabGroup';
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
