//! Shared test helpers for layout-engine integration tests

use cv_domain::{CVMetadata, FontComplexity, LayoutType};
use pdf_generator::config::{Margin, PDFConfig, PageSize};

/// Create a default PDF config for testing (Letter size, 1" margins)
pub fn default_test_config() -> PDFConfig {
    PDFConfig {
        page_size: PageSize::Letter,
        margin: Margin::from_inches(1.0),
        standard: pdf_generator::PDFStandard::PDF17,
        title: Some("Test CV".to_string()),
        author: Some("Test Author".to_string()),
        subject: Some("Resume".to_string()),
        keywords: None,
        creator: Some("ResumeWright Test".to_string()),
        ats_weights: None,
        compress_content_streams: false,
        generate_bookmarks: true,
    }
}

/// Create a default CVMetadata for testing
pub fn default_test_metadata() -> CVMetadata {
    CVMetadata {
        name: Some("Test User".to_string()),
        title: None,
        email: None,
        phone: None,
        location: None,
        website: None,
        layout_type: LayoutType::SingleColumn,
        estimated_pages: 1,
        component_count: 1,
        has_contact_info: false,
        has_clear_sections: false,
        font_complexity: FontComplexity::Simple,
    }
}
