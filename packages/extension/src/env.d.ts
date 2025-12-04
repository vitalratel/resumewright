/// <reference types="vite/client" />

/**
 * Environment Variables Type Definitions
 *
 * Type-safe environment variables for the extension.
 * All variables are optional and have defaults in the code.
 *
 * @see .env.example for available variables
 */

interface ImportMetaEnv {
  /**
   * Help/Documentation URL
   * @default 'https://resumewright.com/#faq'
   */
  readonly HELP_URL?: string;

  /**
   * GitHub Repository URL
   * @default 'https://github.com/vitalratel/resumewright'
   */
  readonly GITHUB_REPO?: string;

  /**
   * Issues/Bug Report URL
   * @default 'https://github.com/vitalratel/resumewright/issues'
   */
  readonly ISSUES_URL?: string;

  /**
   * Error logging endpoint (optional)
   * If set, production errors will be sent to this URL
   */
  readonly VITE_ERROR_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
