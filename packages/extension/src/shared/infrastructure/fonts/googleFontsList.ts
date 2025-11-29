/**
 * Comprehensive Google Fonts List
 *
 * This list includes the most popular and widely-used Google Fonts
 * to avoid hard-coding and allow easy updates.
 *
 * Source: Based on Google Fonts popularity and usage statistics
 * Last Updated: 2025-10-29
 *
 * Note: This is a static list to maintain privacy (no API calls).
 * Update this list periodically to include new popular fonts.
 */

export const GOOGLE_FONTS_LIST = [
  // Top 50 Most Popular Google Fonts
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Oswald',
  'Source Sans Pro',
  'Raleway',
  'PT Sans',
  'Merriweather',
  'Ubuntu',
  'Playfair Display',
  'Poppins',
  'Nunito',
  'Roboto Condensed',
  'Noto Sans',
  'Fira Sans',
  'Nunito Sans',
  'Inter',
  'Rubik',
  'Work Sans',
  'Karla',
  'Mulish',
  'Quicksand',
  'Barlow',
  'DM Sans',
  'Hind',
  'Libre Franklin',
  'Manrope',
  'Oxygen',
  'Bitter',
  'Crimson Text',
  'Libre Baskerville',
  'Josefin Sans',
  'Abel',
  'Dosis',
  'Cabin',
  'Arvo',
  'Inconsolata',
  'Bebas Neue',
  'Heebo',
  'Assistant',
  'Yanone Kaffeesatz',
  'Exo 2',
  'Comfortaa',
  'Fjalla One',
  'Shadows Into Light',
  'Pacifico',
  'Dancing Script',
  'Lobster',
  'Indie Flower',

  // Additional Commonly Used Fonts
  'Noto Serif',
  'PT Serif',
  'Titillium Web',
  'IBM Plex Sans',
  'IBM Plex Serif',
  'IBM Plex Mono',
  'Fira Code',
  'Space Mono',
  'Archivo',
  'Archivo Narrow',
  'Overpass',
  'Saira',
  'Barlow Condensed',
  'Red Hat Display',
  'Red Hat Text',
  'Sora',
  'Epilogue',
  'Plus Jakarta Sans',
  'Outfit',
  'Space Grotesk',
  'Lexend',
  'Syne',
  'Jost',
  'Be Vietnam Pro',
  'Public Sans',
  'Commissioner',
  'Onest',

  // Professional Resume Fonts
  'Cormorant Garamond',
  'EB Garamond',
  'Spectral',
  'Vollkorn',
  'Alegreya',
  'Alegreya Sans',
  'Cardo',
  'Lora',
  'Gentium Book Basic',
  'Neuton',
  'Old Standard TT',
  'Sorts Mill Goudy',
  'Domine',
  'Noticia Text',
  'Artifika',

  // Additional Sans-Serif
  'Kanit',
  'Maven Pro',
  'Varela Round',
  'Asap',
  'Prompt',
  'Mukta',
  'Catamaran',
  'Questrial',
  'Muli',
  'Hind Siliguri',
  'Cairo',
  'Tajawal',
  'Amiri',

  // Monospace/Code Fonts
  'Source Code Pro',
  'Roboto Mono',
  'Ubuntu Mono',
  'Courier Prime',
  'Anonymous Pro',
  'Overpass Mono',

  // Display/Decorative (occasionally used in resumes)
  'Anton',
  'Righteous',
  'Bungee',
  'Archivo Black',
  'Alfa Slab One',
] as const;

/**
 * Set of lowercase Google Fonts for fast lookup
 */
export const GOOGLE_FONTS_SET = new Set(
  GOOGLE_FONTS_LIST.map(font => font.toLowerCase()),
);
