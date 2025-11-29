//! CV Metadata Extraction Bridge
//!
//! This module exposes CV metadata extraction functionality to JavaScript/TypeScript.
//! It wraps the cv_domain::CVMetadata struct with wasm_bindgen-compatible types.

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// Import from cv_domain
use cv_domain::{
    CVMetadata as DomainCVMetadata, FontComplexity as DomainFontComplexity,
    LayoutType as DomainLayoutType,
};
use tsx_parser::parse_tsx;

use crate::error::create_error;

/// Layout type detected in CV
#[wasm_bindgen]
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum LayoutType {
    SingleColumn,
    TwoColumn,
    Academic,
    Portfolio,
    Custom,
}

impl From<DomainLayoutType> for LayoutType {
    fn from(domain: DomainLayoutType) -> Self {
        match domain {
            DomainLayoutType::SingleColumn => LayoutType::SingleColumn,
            DomainLayoutType::TwoColumn => LayoutType::TwoColumn,
            DomainLayoutType::Academic => LayoutType::Academic,
            DomainLayoutType::Portfolio => LayoutType::Portfolio,
            DomainLayoutType::Custom => LayoutType::Custom,
        }
    }
}

/// Font complexity level
#[wasm_bindgen]
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum FontComplexity {
    Simple,
    Moderate,
    Complex,
}

impl From<DomainFontComplexity> for FontComplexity {
    fn from(domain: DomainFontComplexity) -> Self {
        match domain {
            DomainFontComplexity::Simple => FontComplexity::Simple,
            DomainFontComplexity::Moderate => FontComplexity::Moderate,
            DomainFontComplexity::Complex => FontComplexity::Complex,
        }
    }
}

/// CV metadata extracted from TSX content
///
/// Contains structured information parsed from the CV, including:
/// - Personal details (name, email, phone, location, website)
/// - Document characteristics (layout type, page count, component count)
/// - ATS optimization hints (contact info, clear sections, font complexity)
///
/// # TypeScript Example
/// ```typescript
/// import { extract_cv_metadata } from './wasm-bridge';
///
/// const metadata = extract_cv_metadata(tsxContent);
/// console.log(metadata.name); // "John Doe"
/// console.log(metadata.email); // "john@example.com"
/// console.log(metadata.layout_type); // "single-column"
/// ```
#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CVMetadata {
    // Personal Information
    name: Option<String>,
    title: Option<String>,
    email: Option<String>,
    phone: Option<String>,
    location: Option<String>,
    website: Option<String>,

    // Document Characteristics
    layout_type: LayoutType,
    estimated_pages: usize,
    component_count: usize,

    // ATS Optimization Hints
    has_contact_info: bool,
    has_clear_sections: bool,
    font_complexity: FontComplexity,
}

#[wasm_bindgen]
impl CVMetadata {
    // Getters for all fields (required for wasm_bindgen)

    #[wasm_bindgen(getter)]
    pub fn name(&self) -> Option<String> {
        self.name.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn title(&self) -> Option<String> {
        self.title.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn email(&self) -> Option<String> {
        self.email.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn phone(&self) -> Option<String> {
        self.phone.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn location(&self) -> Option<String> {
        self.location.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn website(&self) -> Option<String> {
        self.website.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn layout_type(&self) -> LayoutType {
        self.layout_type
    }

    #[wasm_bindgen(getter)]
    pub fn estimated_pages(&self) -> usize {
        self.estimated_pages
    }

    #[wasm_bindgen(getter)]
    pub fn component_count(&self) -> usize {
        self.component_count
    }

    #[wasm_bindgen(getter)]
    pub fn has_contact_info(&self) -> bool {
        self.has_contact_info
    }

    #[wasm_bindgen(getter)]
    pub fn has_clear_sections(&self) -> bool {
        self.has_clear_sections
    }

    #[wasm_bindgen(getter)]
    pub fn font_complexity(&self) -> FontComplexity {
        self.font_complexity
    }
}

impl From<DomainCVMetadata> for CVMetadata {
    fn from(domain: DomainCVMetadata) -> Self {
        Self {
            name: domain.name,
            title: domain.title,
            email: domain.email,
            phone: domain.phone,
            location: domain.location,
            website: domain.website,
            layout_type: domain.layout_type.into(),
            estimated_pages: domain.estimated_pages,
            component_count: domain.component_count,
            has_contact_info: domain.has_contact_info,
            has_clear_sections: domain.has_clear_sections,
            font_complexity: domain.font_complexity.into(),
        }
    }
}

/// Extract CV metadata from TSX content
///
/// Parses the TSX source and extracts structured metadata including:
/// - Name (from h1/h2 tags or styled divs)
/// - Contact information (email, phone, location, website)
/// - Document characteristics (layout, estimated pages, component count)
/// - ATS optimization hints
///
/// # Arguments
/// * `tsx` - TSX source code as a string
///
/// # Returns
/// * `Ok(CVMetadata)` - Successfully extracted metadata
/// * `Err(String)` - Parse error or extraction failure
///
/// # Example (TypeScript)
/// ```typescript
/// try {
///   const metadata = extract_cv_metadata(tsxContent);
///   if (metadata.name) {
///     console.log(`CV for: ${metadata.name}`);
///   }
/// } catch (error) {
///   console.error('Failed to extract metadata:', error);
/// }
/// ```
#[wasm_bindgen]
pub fn extract_cv_metadata(tsx: &str) -> Result<CVMetadata, JsValue> {
    // Parse TSX
    let doc = parse_tsx(tsx).map_err(|e| {
        create_error(
            "TSX_PARSE_ERROR",
            &format!("Failed to parse TSX: {}", e),
            "metadata_extraction",
            false,
        )
    })?;

    // Extract metadata using cv_domain
    let domain_metadata = cv_domain::extract_metadata(&doc).map_err(|e| {
        create_error(
            "METADATA_EXTRACTION_ERROR",
            &format!("Failed to extract metadata: {}", e),
            "metadata_extraction",
            false,
        )
    })?;

    // Convert to WASM-compatible type
    Ok(domain_metadata.into())
}

#[cfg(test)]
mod tests {
    use super::*;
    use cv_domain::{FontComplexity as DomainFontComplexity, LayoutType as DomainLayoutType};

    //
    // Enum Conversion Tests (P1-COV-METADATA_BRIDGE-003)
    //

    #[test]
    fn test_layout_type_conversion_all_variants() {
        // Test all DomainLayoutType variants convert correctly

        let single = LayoutType::from(DomainLayoutType::SingleColumn);
        assert!(matches!(single, LayoutType::SingleColumn));

        let two = LayoutType::from(DomainLayoutType::TwoColumn);
        assert!(matches!(two, LayoutType::TwoColumn));

        let academic = LayoutType::from(DomainLayoutType::Academic);
        assert!(matches!(academic, LayoutType::Academic));

        let portfolio = LayoutType::from(DomainLayoutType::Portfolio);
        assert!(matches!(portfolio, LayoutType::Portfolio));

        let custom = LayoutType::from(DomainLayoutType::Custom);
        assert!(matches!(custom, LayoutType::Custom));
    }

    #[test]
    fn test_font_complexity_conversion_all_variants() {
        // Test all DomainFontComplexity variants convert correctly

        let simple = FontComplexity::from(DomainFontComplexity::Simple);
        assert!(matches!(simple, FontComplexity::Simple));

        let moderate = FontComplexity::from(DomainFontComplexity::Moderate);
        assert!(matches!(moderate, FontComplexity::Moderate));

        let complex = FontComplexity::from(DomainFontComplexity::Complex);
        assert!(matches!(complex, FontComplexity::Complex));
    }

    #[test]
    fn test_layout_type_serialization() {
        // Test that LayoutType serializes correctly (kebab-case)

        let single = LayoutType::SingleColumn;
        let json = serde_json::to_string(&single).unwrap();
        assert_eq!(json, "\"single-column\"");

        let two = LayoutType::TwoColumn;
        let json = serde_json::to_string(&two).unwrap();
        assert_eq!(json, "\"two-column\"");

        let academic = LayoutType::Academic;
        let json = serde_json::to_string(&academic).unwrap();
        assert_eq!(json, "\"academic\"");

        let portfolio = LayoutType::Portfolio;
        let json = serde_json::to_string(&portfolio).unwrap();
        assert_eq!(json, "\"portfolio\"");

        let custom = LayoutType::Custom;
        let json = serde_json::to_string(&custom).unwrap();
        assert_eq!(json, "\"custom\"");
    }

    #[test]
    fn test_font_complexity_serialization() {
        // Test that FontComplexity serializes correctly (kebab-case)

        let simple = FontComplexity::Simple;
        let json = serde_json::to_string(&simple).unwrap();
        assert_eq!(json, "\"simple\"");

        let moderate = FontComplexity::Moderate;
        let json = serde_json::to_string(&moderate).unwrap();
        assert_eq!(json, "\"moderate\"");

        let complex = FontComplexity::Complex;
        let json = serde_json::to_string(&complex).unwrap();
        assert_eq!(json, "\"complex\"");
    }
}
