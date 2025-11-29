//! PDF/A Constants
//!
//! This module contains constant values used for PDF/A compliance,
//! including ICC profiles and XMP templates.

/// Embedded sRGB ICC profile (456 bytes, CC0 licensed)
///
/// This compact sRGB v2 micro profile is used for PDF/A-1b OutputIntent.
///
/// # License
/// CC0 (Public Domain)
///
/// # Source
/// https://github.com/saucecontrol/Compact-ICC-Profiles
///
/// # Technical Details
/// - Color space: RGB (3 components)
/// - Profile: sRGB IEC61966-2.1
/// - Size: 456 bytes (optimized for embedding)
pub const SRGB_ICC_PROFILE: &[u8] = include_bytes!("../srgb.icc");

/// XMP packet template with placeholders for dynamic content
///
/// This template provides the complete XMP metadata structure for PDF/A-1b
/// compliance. Dynamic values are inserted via string replacement at runtime.
///
/// # Placeholders
/// - `{DC_TITLE}` - Dublin Core title element
/// - `{DC_CREATOR}` - Dublin Core creator element
/// - `{DC_DESCRIPTION}` - Dublin Core description element
/// - `{DC_SUBJECT}` - Dublin Core subject keywords
/// - `{TIMESTAMP}` - ISO 8601 timestamp (CreateDate and ModifyDate)
/// - `{CREATOR_TOOL}` - XMP CreatorTool value
/// - `{PDF_KEYWORDS}` - PDF keywords element
///
/// # Performance
/// Using a template with placeholders is ~5-10% faster than building the
/// entire structure with format! macro, as most of the string is constant.
pub const XMP_TEMPLATE: &str = r#"<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="ResumeWright XMP Core 1.0">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">

    <!-- PDF/A-1b Identification Schema (required) -->
    <rdf:Description rdf:about=""
      xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
      <pdfaid:part>1</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
    </rdf:Description>

    <!-- Dublin Core Schema (recommended for PDF/A) -->
    <rdf:Description rdf:about=""
      xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:format>application/pdf</dc:format>
      {DC_TITLE}
      {DC_CREATOR}
      {DC_DESCRIPTION}
      {DC_SUBJECT}
    </rdf:Description>

    <!-- XMP Basic Schema -->
    <rdf:Description rdf:about=""
      xmlns:xmp="http://ns.adobe.com/xap/1.0/">
      <xmp:CreateDate>{TIMESTAMP}</xmp:CreateDate>
      <xmp:ModifyDate>{TIMESTAMP}</xmp:ModifyDate>
      <xmp:CreatorTool>{CREATOR_TOOL}</xmp:CreatorTool>
    </rdf:Description>

    <!-- PDF Schema -->
    <rdf:Description rdf:about=""
      xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
      <pdf:Producer>lopdf + ResumeWright</pdf:Producer>
      {PDF_KEYWORDS}
    </rdf:Description>

  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>
"#;
