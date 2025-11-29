use crate::ats::ATSWeights;
use serde::{Deserialize, Serialize};

/// Default value for generate_bookmarks field (enabled by default)
fn default_generate_bookmarks() -> bool {
    true
}

/// PDF standard conformance levels.
///
/// Different PDF standards provide varying levels of compatibility,
/// features, and archival guarantees.
///
/// # Examples
///
/// ```
/// use pdf_generator::PDFStandard;
///
/// // Regular PDF for general use
/// let standard = PDFStandard::PDF17;
///
/// // PDF/A for archival and enterprise compliance
/// let archival = PDFStandard::PDFA1b;
/// ```
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
pub enum PDFStandard {
    /// Standard PDF 1.7 (ISO 32000-1:2008)
    ///
    /// General-purpose PDF format with no archival restrictions.
    /// Supports encryption, external dependencies, and all PDF features.
    #[default]
    PDF17,

    /// PDF/A-1b (ISO 19005-1:2005) - Basic conformance
    ///
    /// Long-term archival standard ensuring:
    /// - All fonts embedded
    /// - Device-independent color (sRGB)
    /// - XMP metadata required
    /// - No encryption or passwords
    /// - No external dependencies
    /// - Visual appearance preserved
    ///
    /// Widely supported by enterprise HR systems and document management.
    PDFA1b,
}

/// Page size dimensions for PDF documents.
///
/// All dimensions are measured in points (1 point = 1/72 inch).
/// These are the most commonly used paper sizes for resumes and CVs.
///
/// # Examples
///
/// ```
/// use pdf_generator::PageSize;
///
/// let letter = PageSize::Letter;
/// let (width, height) = letter.dimensions();
/// assert_eq!(width, 612.0);  // 8.5 inches
/// assert_eq!(height, 792.0); // 11 inches
/// ```
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum PageSize {
    /// US Letter size (8.5 x 11 inches = 612 x 792 points)
    ///
    /// Most common in North America for resumes and business documents.
    Letter,

    /// ISO A4 size (210 x 297 mm = 595.276 x 841.890 points)
    ///
    /// International standard, commonly used worldwide outside North America.
    A4,

    /// US Legal size (8.5 x 14 inches = 612 x 1008 points)
    ///
    /// Longer format for legal documents and extended resumes.
    Legal,
}

impl PageSize {
    /// Returns the page dimensions as (width, height) in points.
    ///
    /// # Returns
    ///
    /// A tuple of (width, height) in points where 1 point = 1/72 inch.
    ///
    /// # Examples
    ///
    /// ```
    /// use pdf_generator::PageSize;
    ///
    /// let a4 = PageSize::A4;
    /// let (width, height) = a4.dimensions();
    /// assert_eq!(width, 595.276);  // A4 width in points
    /// assert_eq!(height, 841.890); // A4 height in points
    /// ```
    pub fn dimensions(&self) -> (f64, f64) {
        match self {
            PageSize::Letter => (612.0, 792.0),
            PageSize::A4 => (595.276, 841.890), // Exact A4 in points
            PageSize::Legal => (612.0, 1008.0),
        }
    }
}

/// Page margin configuration for PDF documents.
///
/// Margins define the whitespace around the content area of a page.
/// All values are measured in points (1 point = 1/72 inch).
///
/// # Examples
///
/// ```
/// use pdf_generator::Margin;
///
/// // Create uniform margins of 0.5 inches (36 points)
/// let margin = Margin::from_inches(0.5);
/// assert_eq!(margin.top, 36.0);
/// assert_eq!(margin.left, 36.0);
///
/// // Create custom margins
/// let custom = Margin {
///     top: 72.0,    // 1 inch
///     right: 36.0,  // 0.5 inches
///     bottom: 72.0, // 1 inch
///     left: 36.0,   // 0.5 inches
/// };
/// ```
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Margin {
    /// Top margin in points
    pub top: f64,
    /// Right margin in points
    pub right: f64,
    /// Bottom margin in points
    pub bottom: f64,
    /// Left margin in points
    pub left: f64,
}

impl Margin {
    /// Creates uniform margins from a measurement in inches.
    ///
    /// This is a convenience method that sets all four margins (top, right, bottom, left)
    /// to the same value converted from inches to points.
    ///
    /// # Arguments
    ///
    /// * `inches` - The margin size in inches (will be converted to points using 72 points/inch)
    ///
    /// # Examples
    ///
    /// ```
    /// use pdf_generator::Margin;
    ///
    /// // Standard 0.5 inch margins
    /// let margin = Margin::from_inches(0.5);
    /// assert_eq!(margin.top, 36.0);
    /// assert_eq!(margin.bottom, 36.0);
    ///
    /// // 1 inch margins
    /// let wide_margin = Margin::from_inches(1.0);
    /// assert_eq!(wide_margin.left, 72.0);
    /// ```
    pub fn from_inches(inches: f64) -> Self {
        let points = inches * 72.0;
        Self {
            top: points,
            right: points,
            bottom: points,
            left: points,
        }
    }
}

/// Configuration for PDF document generation.
///
/// This structure contains all settings for creating a PDF document,
/// including page layout, margins, and document metadata.
///
/// # Examples
///
/// ```
/// use pdf_generator::{PDFConfig, PDFStandard, PageSize, Margin};
///
/// // Use default configuration (US Letter, 0.5" margins)
/// let config = PDFConfig::default();
///
/// // Create custom configuration
/// let custom_config = PDFConfig {
///     page_size: PageSize::A4,
///     margin: Margin::from_inches(1.0),
///     standard: PDFStandard::PDF17,
///     title: Some("Software Engineer Resume".to_string()),
///     author: Some("John Doe".to_string()),
///     subject: Some("Job Application".to_string()),
///     keywords: Some("software,engineering,resume".to_string()),
///     creator: Some("ResumeWright".to_string()),
///     ..Default::default()
/// };
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PDFConfig {
    /// Page size (Letter, A4, or Legal)
    pub page_size: PageSize,

    /// Page margins in points
    pub margin: Margin,

    /// PDF standard conformance level
    ///
    /// Controls whether the generated PDF conforms to specific standards:
    /// - `PDF17`: Standard PDF 1.7 (default)
    /// - `PDFA1b`: PDF/A-1b for long-term archival
    pub standard: PDFStandard,

    /// Document title (appears in PDF metadata)
    pub title: Option<String>,

    /// Document author (appears in PDF metadata)
    pub author: Option<String>,

    /// Document subject/description (appears in PDF metadata)
    pub subject: Option<String>,

    /// Document keywords for searchability (appears in PDF metadata)
    pub keywords: Option<String>,

    /// Creator application name (appears in PDF metadata)
    pub creator: Option<String>,

    /// Custom weights for ATS scoring (optional)
    ///
    /// If not provided, uses industry-standard default weights.
    /// Allows fine-tuning of ATS compatibility scoring to match specific requirements.
    #[serde(default)]
    pub ats_weights: Option<ATSWeights>,

    /// Enable content stream compression (DEFLATE)
    ///
    /// When enabled, PDF content streams are compressed using DEFLATE algorithm,
    /// resulting in 30-50% smaller file sizes. This is standard PDF compression
    /// and is widely supported by all PDF viewers.
    ///
    /// **Default:** `false` (for backward compatibility)
    ///
    /// **Performance:** Adds minimal CPU overhead during PDF generation.
    ///
    /// # Examples
    ///
    /// ```
    /// use pdf_generator::PDFConfig;
    ///
    /// // Enable compression for smaller files
    /// let config = PDFConfig {
    ///     compress_content_streams: true,
    ///     ..Default::default()
    /// };
    /// ```
    #[serde(default)]
    pub compress_content_streams: bool,

    /// Generate PDF bookmarks/outline from section headings (default: true)
    ///
    /// When enabled, automatically creates PDF bookmarks from heading elements (h1, h2, h3)
    /// in the CV, allowing easy navigation in PDF viewers. Bookmarks link to the page
    /// where each section appears.
    ///
    /// # Examples
    ///
    /// ```
    /// use pdf_generator::PDFConfig;
    ///
    /// // Enable bookmarks (default)
    /// let config = PDFConfig::default();
    /// assert_eq!(config.generate_bookmarks, true);
    ///
    /// // Disable bookmarks
    /// let config = PDFConfig {
    ///     generate_bookmarks: false,
    ///     ..Default::default()
    /// };
    /// ```
    #[serde(default = "default_generate_bookmarks")]
    pub generate_bookmarks: bool,
}

impl Default for PDFConfig {
    fn default() -> Self {
        Self {
            page_size: PageSize::Letter,
            margin: Margin::from_inches(0.0), // TSX controls all spacing via Tailwind classes
            standard: PDFStandard::PDF17,
            title: Some("Resume".to_string()),
            author: None,
            subject: Some("Curriculum Vitae".to_string()),
            keywords: None,
            creator: Some("ResumeWright Browser Extension".to_string()),
            ats_weights: None,               // Use default weights
            compress_content_streams: false, // Disabled by default for compatibility
            generate_bookmarks: true,        // Enable bookmarks by default for better UX
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_page_size_dimensions() {
        let letter = PageSize::Letter;
        let a4 = PageSize::A4;
        let legal = PageSize::Legal;

        assert_eq!(
            letter.dimensions(),
            (612.0, 792.0),
            "Letter should be 612x792 points"
        );
        assert_eq!(
            a4.dimensions(),
            (595.276, 841.890),
            "A4 should be 595.276x841.890 points"
        );
        assert_eq!(
            legal.dimensions(),
            (612.0, 1008.0),
            "Legal should be 612x1008 points"
        );
    }

    #[test]
    fn test_margin_from_inches() {
        let margin = Margin::from_inches(0.5);

        assert_eq!(margin.top, 36.0, "0.5 inches should be 36 points");
        assert_eq!(margin.right, 36.0);
        assert_eq!(margin.bottom, 36.0);
        assert_eq!(margin.left, 36.0);
    }

    #[test]
    fn test_margin_from_inches_one_inch() {
        let margin = Margin::from_inches(1.0);

        assert_eq!(margin.top, 72.0, "1 inch should be 72 points");
        assert_eq!(margin.right, 72.0);
        assert_eq!(margin.bottom, 72.0);
        assert_eq!(margin.left, 72.0);
    }

    #[test]
    fn test_pdf_config_default_values() {
        let config = PDFConfig::default();

        match config.page_size {
            PageSize::Letter => {}
            _ => panic!("Default page size should be Letter"),
        }

        assert_eq!(
            config.margin.top, 0.0,
            "Default margin should be 0 (TSX controls spacing)"
        );
        assert_eq!(
            config.title,
            Some("Resume".to_string()),
            "Default title should be 'Resume'"
        );
        assert_eq!(config.subject, Some("Curriculum Vitae".to_string()));
    }
}
