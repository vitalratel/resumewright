/**
 * External Links Configuration
 * Centralized configuration for all external URLs used in the extension.
 *
 * URLs point to the official ResumeWright repository.
 * If you fork this project, update these URLs to point to your repository.
 */

export const EXTERNAL_LINKS = {
  /**
   * Help/Documentation URL
   * Used in: AppFooter "Help & FAQ" button
   */
  HELP_URL: 'https://github.com/vitalratel/resumewright#readme',

  /**
   * GitHub Repository URL
   * Reserved for future use (e.g., "View Source" button)
   */
  GITHUB_REPO: 'https://github.com/vitalratel/resumewright',

  /**
   * Issues/Bug Report URL
   * Reserved for future use (e.g., "Report Bug" button)
   */
  ISSUES_URL: 'https://github.com/vitalratel/resumewright/issues',
} as const;
