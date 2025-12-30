//! Integration Tests with Real-World Fonts
//! Comprehensive tests using actual production fonts
//!
//! These tests verify font-toolkit functionality with real-world fonts (Roboto, Open Sans)
//! to ensure production readiness beyond synthetic test data.
//!
//! NOTE: Tests require the 'advanced-fonts' feature flag.
//! Run with: cargo test --package font-toolkit --features advanced-fonts
//!
//! Test fonts included:
//! - Roboto Regular (Google Fonts, Apache 2.0)
//! - Open Sans Bold (Google Fonts, Apache 2.0)
//!
//! These fonts were chosen because:
//! - Widely used in production CVs
//! - Representative of common Google Fonts
//! - Open source with permissive licenses
//! - Available in multiple formats (TTF, WOFF, WOFF2)

#![cfg(feature = "advanced-fonts")]

use font_toolkit::{decompress_woff, decompress_woff2, embed_truetype_font, subset_font_core};
use lopdf::Document;
use ttf_parser::Face;

// Test fixtures - real production fonts
const ROBOTO_REGULAR_TTF: &[u8] =
    include_bytes!("../../../../test-fixtures/fonts/Roboto-Regular.ttf");
const ROBOTO_REGULAR_WOFF: &[u8] =
    include_bytes!("../../../../test-fixtures/fonts/Roboto-Regular.woff");
const ROBOTO_REGULAR_WOFF2: &[u8] =
    include_bytes!("../../../../test-fixtures/fonts/Roboto-Regular.woff2");
const OPENSANS_BOLD_TTF: &[u8] =
    include_bytes!("../../../../test-fixtures/fonts/OpenSans-Bold.ttf");

// Realistic CV content samples for different testing scenarios
const MINIMAL_CV: &str = "John Doe\nSoftware Engineer";

const TYPICAL_CV: &str = r#"
Jane Smith
Senior Software Engineer | San Francisco, CA
jane.smith@email.com | (555) 123-4567 | linkedin.com/in/janesmith

EXPERIENCE
Senior Software Engineer, TechCorp Inc. (2020-Present)
- Led development of microservices architecture serving 1M+ users
- Implemented CI/CD pipeline reducing deployment time by 60%
- Mentored team of 5 junior engineers

Software Engineer, StartupXYZ (2018-2020)
- Built RESTful APIs using Python and FastAPI
- Designed PostgreSQL database schemas for high-traffic application
- Achieved 99.9% uptime through monitoring and optimization

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley (2014-2018)
GPA: 3.8/4.0

SKILLS
Languages: Python, JavaScript, TypeScript, Rust, Go
Frameworks: React, Node.js, Django, FastAPI
Tools: Docker, Kubernetes, AWS, PostgreSQL, Redis
"#;

const UNICODE_CV: &str = r#"
José García
Ingénieur Logiciel Sénior

Expérience:
• Développement d'applications web modernes
• Spécialiste en résolution de problèmes complexes
• Expert en TypeScript & React

Éducation:
• Master en Informatique, École Polytechnique
• Spécialisation en Intelligence Artificielle

Compétences: JavaScript, Python, C++, SQL

Références disponibles sur demande
"#;

const SPECIAL_CHARS_CV: &str = r#"
Alex O'Brien
Software Developer @ Tech-Solutions Inc.

Skills & Expertise:
- C++ & C# programming (10+ years)
- Database design: MySQL, PostgreSQL
- Cloud platforms: AWS, Azure, GCP
- DevOps: Docker, Kubernetes, CI/CD

Achievements:
★ Reduced latency by 50% through optimization
★ Deployed 100+ microservices successfully
★ 99.99% uptime SLA maintained

Contact: alex.obrien@email.com | +1-555-867-5309
"#;

// ============================================================================
// Format Detection Tests
// ============================================================================

#[test]
fn test_roboto_regular_ttf_format_detection() {
    // Verify TTF magic number
    assert_eq!(
        &ROBOTO_REGULAR_TTF[0..4],
        &[0x00, 0x01, 0x00, 0x00],
        "Roboto Regular should have valid TTF magic number"
    );

    // Verify parseable by ttf-parser
    let face =
        Face::parse(ROBOTO_REGULAR_TTF, 0).expect("Roboto Regular should be valid TrueType font");

    // Verify basic font properties
    assert!(
        face.number_of_glyphs() > 100,
        "Should have substantial glyph set"
    );
    assert!(face.ascender() > 0, "Should have positive ascender");
    assert!(face.descender() < 0, "Should have negative descender");
    assert!(face.units_per_em() == 2048, "Roboto uses 2048 UPM");
}

#[test]
fn test_opensans_bold_ttf_format_detection() {
    // Verify TTF magic number
    assert_eq!(
        &OPENSANS_BOLD_TTF[0..4],
        &[0x00, 0x01, 0x00, 0x00],
        "Open Sans Bold should have valid TTF magic number"
    );

    // Verify parseable
    let face =
        Face::parse(OPENSANS_BOLD_TTF, 0).expect("Open Sans Bold should be valid TrueType font");

    assert!(face.number_of_glyphs() > 100);
    assert!(face.ascender() > 0);
    assert!(face.descender() < 0);
}

#[test]
fn test_woff_format_detection() {
    // WOFF magic number is "wOFF" (0x774F4646)
    assert_eq!(
        &ROBOTO_REGULAR_WOFF[0..4],
        b"wOFF",
        "Should have valid WOFF signature"
    );

    // Verify decompression produces valid TTF
    let ttf_bytes =
        decompress_woff(ROBOTO_REGULAR_WOFF).expect("WOFF decompression should succeed");

    assert_eq!(&ttf_bytes[0..4], &[0x00, 0x01, 0x00, 0x00]);
}

#[test]
fn test_woff2_format_detection() {
    // WOFF2 magic number is "wOF2" (0x774F4632)
    assert_eq!(
        &ROBOTO_REGULAR_WOFF2[0..4],
        b"wOF2",
        "Should have valid WOFF2 signature"
    );

    // Verify decompression produces valid TTF
    let ttf_bytes =
        decompress_woff2(ROBOTO_REGULAR_WOFF2).expect("WOFF2 decompression should succeed");

    assert_eq!(&ttf_bytes[0..4], &[0x00, 0x01, 0x00, 0x00]);
}

// ============================================================================
// Font Subsetting Tests with Real Content
// ============================================================================

#[test]
fn test_subset_roboto_minimal_cv() {
    let face = Face::parse(ROBOTO_REGULAR_TTF, 0).unwrap();
    let original_glyphs = face.number_of_glyphs();

    let (subset_bytes, metrics) =
        subset_font_core(ROBOTO_REGULAR_TTF, Some(&face), MINIMAL_CV, true)
            .expect("Subsetting with minimal CV should succeed");
    let metrics = metrics.unwrap();

    // Verify output is valid TTF
    let subset_face = Face::parse(&subset_bytes, 0).expect("Subset should be valid font");

    // Verify metrics
    assert!(
        metrics.subset_glyphs < original_glyphs,
        "Subset should have fewer glyphs: {} < {}",
        metrics.subset_glyphs,
        original_glyphs
    );

    // For minimal CV (~20 characters), expect dramatic size reduction
    assert!(
        metrics.size_reduction_pct >= 85.0,
        "Minimal CV should achieve >85% size reduction (got {:.1}%)",
        metrics.size_reduction_pct
    );

    println!(
        "Minimal CV subsetting: {} → {} bytes ({:.1}% reduction)",
        metrics.original_size, metrics.subset_size, metrics.size_reduction_pct
    );

    // Verify font metrics preserved
    assert_eq!(face.ascender(), subset_face.ascender());
    assert_eq!(face.descender(), subset_face.descender());
    assert_eq!(face.units_per_em(), subset_face.units_per_em());
}

#[test]
fn test_subset_roboto_typical_cv() {
    let face = Face::parse(ROBOTO_REGULAR_TTF, 0).unwrap();

    let (subset_bytes, metrics) =
        subset_font_core(ROBOTO_REGULAR_TTF, Some(&face), TYPICAL_CV, true)
            .expect("Subsetting with typical CV should succeed");
    let metrics = metrics.unwrap();

    // Verify valid output
    let subset_face = Face::parse(&subset_bytes, 0).expect("Subset should be valid");

    // Typical CV has more text but still should achieve good reduction
    assert!(
        metrics.size_reduction_pct >= 60.0,
        "Typical CV should achieve >60% size reduction (got {:.1}%)",
        metrics.size_reduction_pct
    );

    // Typical CV uses more characters but not full glyph set
    assert!(
        metrics.glyph_reduction_pct >= 50.0,
        "Should reduce glyphs by at least 50% (got {:.1}%)",
        metrics.glyph_reduction_pct
    );

    println!(
        "Typical CV subsetting: {} glyphs → {} glyphs, {} → {} bytes",
        metrics.original_glyphs, metrics.subset_glyphs, metrics.original_size, metrics.subset_size
    );

    // Verify preserved metrics
    assert_eq!(face.units_per_em(), subset_face.units_per_em());
}

#[test]
fn test_subset_opensans_typical_cv() {
    let face = Face::parse(OPENSANS_BOLD_TTF, 0).unwrap();

    let (subset_bytes, metrics) =
        subset_font_core(OPENSANS_BOLD_TTF, Some(&face), TYPICAL_CV, true)
            .expect("Subsetting Open Sans Bold should succeed");
    let metrics = metrics.unwrap();

    let subset_face = Face::parse(&subset_bytes, 0).expect("Subset should be valid");

    // Verify similar performance characteristics
    assert!(metrics.size_reduction_pct >= 60.0);
    assert!(metrics.glyph_reduction_pct >= 50.0);

    println!(
        "Open Sans Bold subsetting: {:.1}% size reduction, {:.1}% glyph reduction",
        metrics.size_reduction_pct, metrics.glyph_reduction_pct
    );

    // Verify font properties preserved
    assert_eq!(face.ascender(), subset_face.ascender());
    assert_eq!(face.descender(), subset_face.descender());
}

#[test]
fn test_subset_unicode_content() {
    let face = Face::parse(ROBOTO_REGULAR_TTF, 0).unwrap();

    let (subset_bytes, metrics) =
        subset_font_core(ROBOTO_REGULAR_TTF, Some(&face), UNICODE_CV, true)
            .expect("Subsetting with Unicode content should succeed");
    let metrics = metrics.unwrap();

    let subset_face = Face::parse(&subset_bytes, 0).expect("Subset with Unicode should be valid");

    // Unicode characters (é, à, ç, etc.) should be included
    assert!(subset_face.number_of_glyphs() > 0);
    assert!(metrics.subset_glyphs > 20, "Should include Unicode glyphs");

    println!(
        "Unicode CV: {} glyphs subset from {} originals",
        metrics.subset_glyphs, metrics.original_glyphs
    );

    // Still should achieve good size reduction
    assert!(metrics.size_reduction_pct >= 50.0);
}

#[test]
fn test_subset_special_characters() {
    let face = Face::parse(ROBOTO_REGULAR_TTF, 0).unwrap();

    let (subset_bytes, _metrics) =
        subset_font_core(ROBOTO_REGULAR_TTF, Some(&face), SPECIAL_CHARS_CV, true)
            .expect("Subsetting with special characters should succeed");

    // Verify output is valid despite special characters: @, #, &, ★, +, %, etc.
    let subset_face =
        Face::parse(&subset_bytes, 0).expect("Subset with special chars should be valid");

    assert!(subset_face.number_of_glyphs() > 0);
    assert_eq!(face.units_per_em(), subset_face.units_per_em());
}

// ============================================================================
// Font Embedding Tests
// ============================================================================

#[test]
fn test_embed_roboto_regular_in_pdf() {
    let mut doc = Document::with_version("1.7");

    let embedded = embed_truetype_font(
        &mut doc,
        ROBOTO_REGULAR_TTF,
        "Roboto",
        400,   // Regular weight
        false, // Not italic
        None,  // Full font (no subsetting)
    )
    .expect("Embedding Roboto should succeed");

    // Verify embedded font metadata
    assert_eq!(embedded.family, "Roboto");
    assert_eq!(embedded.weight, 400);
    assert!(!embedded.is_italic);
    assert!(embedded.resource_name.starts_with("/F"));

    // Verify PDF objects created
    assert!(
        doc.objects.len() >= 5,
        "Should create font objects (Type0, CIDFont, FontDescriptor, FontFile2, ToUnicode)"
    );
}

#[test]
fn test_embed_opensans_bold_in_pdf() {
    let mut doc = Document::with_version("1.7");

    let embedded = embed_truetype_font(
        &mut doc,
        OPENSANS_BOLD_TTF,
        "Open Sans",
        700, // Bold weight
        false,
        None, // Full font (no subsetting)
    )
    .expect("Embedding Open Sans Bold should succeed");

    assert_eq!(embedded.family, "Open Sans");
    assert_eq!(embedded.weight, 700);
    assert!(doc.objects.len() >= 5);
}

#[test]
fn test_embed_multiple_real_fonts() {
    let mut doc = Document::with_version("1.7");

    // Embed both fonts in same document
    let roboto = embed_truetype_font(&mut doc, ROBOTO_REGULAR_TTF, "Roboto", 400, false, None)
        .expect("Embedding Roboto should succeed");

    let opensans = embed_truetype_font(&mut doc, OPENSANS_BOLD_TTF, "Open Sans", 700, false, None)
        .expect("Embedding Open Sans should succeed");

    // Verify different resource names
    assert_ne!(
        roboto.resource_name, opensans.resource_name,
        "Different fonts should get unique resource names"
    );

    // Should have objects for both fonts (5+ objects per font)
    assert!(
        doc.objects.len() >= 10,
        "Should have objects for both fonts"
    );
}

// ============================================================================
// Complete Pipeline Tests (Real-World Workflows)
// ============================================================================

#[test]
fn test_pipeline_subset_and_embed_roboto() {
    let face = Face::parse(ROBOTO_REGULAR_TTF, 0).unwrap();

    // Step 1: Subset font with realistic CV content
    let (subset_bytes, metrics) =
        subset_font_core(ROBOTO_REGULAR_TTF, Some(&face), TYPICAL_CV, true)
            .expect("Subsetting should succeed");
    let metrics = metrics.unwrap();

    println!(
        "Pipeline test: Original {} bytes → Subset {} bytes ({:.1}% reduction)",
        metrics.original_size, metrics.subset_size, metrics.size_reduction_pct
    );

    // Step 2: Embed subset font in PDF
    let mut doc = Document::with_version("1.7");
    let embedded = embed_truetype_font(&mut doc, &subset_bytes, "Roboto", 400, false, None)
        .expect("Embedding subset should succeed");

    // Verify complete pipeline
    assert!(
        metrics.size_reduction_pct >= 60.0,
        "Should achieve good reduction"
    );
    assert_eq!(embedded.family, "Roboto");
    assert!(doc.objects.len() >= 5);

    // Verify subset font is still valid
    let subset_face =
        Face::parse(&subset_bytes, 0).expect("Subset should remain valid after embedding");
    assert_eq!(face.units_per_em(), subset_face.units_per_em());
}

#[test]
fn test_pipeline_woff_to_subset_to_pdf() {
    // Step 1: Decompress WOFF to TTF
    let ttf_bytes =
        decompress_woff(ROBOTO_REGULAR_WOFF).expect("WOFF decompression should succeed");

    let face = Face::parse(&ttf_bytes, 0).expect("Decompressed TTF should be valid");

    // Step 2: Subset the TTF
    let (subset_bytes, metrics) = subset_font_core(&ttf_bytes, Some(&face), TYPICAL_CV, true)
        .expect("Subsetting should succeed");
    let metrics = metrics.unwrap();

    // Step 3: Embed in PDF
    let mut doc = Document::with_version("1.7");
    embed_truetype_font(&mut doc, &subset_bytes, "Roboto", 400, false, None)
        .expect("Embedding should succeed");

    println!(
        "WOFF pipeline: WOFF {} bytes → TTF {} bytes → Subset {} bytes",
        ROBOTO_REGULAR_WOFF.len(),
        ttf_bytes.len(),
        metrics.subset_size
    );

    // Verify successful pipeline
    assert!(metrics.size_reduction_pct > 0.0);
    assert!(doc.objects.len() >= 5);
}

#[test]
fn test_pipeline_multiple_fonts_different_content() {
    let mut doc = Document::with_version("1.7");

    // Subset and embed Roboto with English content
    let face1 = Face::parse(ROBOTO_REGULAR_TTF, 0).unwrap();
    let (subset1, _) = subset_font_core(ROBOTO_REGULAR_TTF, Some(&face1), TYPICAL_CV, true)
        .expect("Roboto subsetting should succeed");

    let embedded1 = embed_truetype_font(&mut doc, &subset1, "Roboto", 400, false, None)
        .expect("Roboto embedding should succeed");

    // Subset and embed Open Sans with Unicode content
    let face2 = Face::parse(OPENSANS_BOLD_TTF, 0).unwrap();
    let (subset2, _) = subset_font_core(OPENSANS_BOLD_TTF, Some(&face2), UNICODE_CV, true)
        .expect("Open Sans subsetting should succeed");

    let embedded2 = embed_truetype_font(&mut doc, &subset2, "Open Sans", 700, false, None)
        .expect("Open Sans embedding should succeed");

    // Verify both fonts embedded successfully with unique names
    assert_ne!(embedded1.resource_name, embedded2.resource_name);
    assert!(doc.objects.len() >= 10); // 5+ objects per font
}

// ============================================================================
// Performance and Size Tests
// ============================================================================

#[test]
fn test_subset_performance_typical_cv() {
    use std::time::Instant;

    let face = Face::parse(ROBOTO_REGULAR_TTF, 0).unwrap();

    let start = Instant::now();
    let (subset_bytes, _) = subset_font_core(ROBOTO_REGULAR_TTF, Some(&face), TYPICAL_CV, true)
        .expect("Subsetting should succeed");
    let duration = start.elapsed();

    println!(
        "Subsetting performance: {} ms for {} → {} bytes",
        duration.as_millis(),
        ROBOTO_REGULAR_TTF.len(),
        subset_bytes.len()
    );

    // Should complete quickly (<100ms target for good UX)
    assert!(
        duration.as_millis() < 500,
        "Subsetting should complete in <500ms (got {}ms)",
        duration.as_millis()
    );
}

#[test]
fn test_size_reduction_comparison() {
    let face = Face::parse(ROBOTO_REGULAR_TTF, 0).unwrap();

    // Compare size reduction across different content samples
    let samples = vec![
        ("Minimal CV", MINIMAL_CV),
        ("Typical CV", TYPICAL_CV),
        ("Unicode CV", UNICODE_CV),
        ("Special Chars", SPECIAL_CHARS_CV),
    ];

    for (name, content) in samples {
        let (_, metrics) = subset_font_core(ROBOTO_REGULAR_TTF, Some(&face), content, true)
            .expect("Subsetting should succeed");
        let metrics = metrics.unwrap();

        println!(
            "{}: {:.1}% size reduction, {:.1}% glyph reduction",
            name, metrics.size_reduction_pct, metrics.glyph_reduction_pct
        );

        // All samples should achieve meaningful reduction
        assert!(
            metrics.size_reduction_pct >= 50.0,
            "{} should achieve >=50% reduction",
            name
        );
    }
}

// ============================================================================
// Error Handling with Real Fonts
// ============================================================================

#[test]
fn test_error_corrupted_font_data() {
    // Take real font and corrupt it
    let mut corrupted = ROBOTO_REGULAR_TTF.to_vec();
    corrupted[100..200].fill(0xFF); // Corrupt some data

    let face_result = Face::parse(&corrupted, 0);

    // Should fail to parse
    assert!(face_result.is_err(), "Corrupted font should fail to parse");
}

#[test]
fn test_error_empty_text_still_works() {
    let face = Face::parse(ROBOTO_REGULAR_TTF, 0).unwrap();

    // Empty text should still produce valid subset (with mandatory glyphs)
    let (subset_bytes, metrics) = subset_font_core(ROBOTO_REGULAR_TTF, Some(&face), "", true)
        .expect("Empty text should not fail");
    let metrics = metrics.unwrap();

    let subset_face = Face::parse(&subset_bytes, 0).expect("Empty text subset should be valid");

    // Should include at least .notdef and space glyphs
    assert!(
        metrics.subset_glyphs >= 2,
        "Empty text should include mandatory glyphs"
    );
    assert!(subset_face.number_of_glyphs() >= 2);
}

#[test]
fn test_error_missing_glyphs_graceful() {
    let face = Face::parse(ROBOTO_REGULAR_TTF, 0).unwrap();

    // Use characters that likely don't exist in Roboto (e.g., Chinese)
    let text_with_missing = "Hello 你好 World";

    // Should not fail, just skip missing glyphs
    let result = subset_font_core(ROBOTO_REGULAR_TTF, Some(&face), text_with_missing, true);

    assert!(result.is_ok(), "Missing glyphs should not cause failure");

    let (subset_bytes, metrics) = result.unwrap();
    let metrics = metrics.unwrap();
    let subset_face = Face::parse(&subset_bytes, 0).expect("Subset should still be valid");

    // Should include glyphs for ASCII characters at minimum
    assert!(metrics.subset_glyphs > 0);
    assert!(subset_face.number_of_glyphs() > 0);
}
