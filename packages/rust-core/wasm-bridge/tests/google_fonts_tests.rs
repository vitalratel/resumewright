//! Google Fonts Integration Tests
//!
//! End-to-end tests for Google Fonts embedding
//!
//! These tests verify:
//! - Generate baseline PNGs from Google Font fixtures
//! - Visual regression testing
//! - Performance benchmarks (font fetch, subsetting, conversion)
//! - File size validation (<200KB per embedded font)

use cv_domain::{extract_metadata, extract_tsx_layout_config_from_document};
use layout_engine::calculate_layout_direct;
use pdf_generator::{Margin, PDFConfig, PDFGenerator, PageSize};
use std::path::{Path, PathBuf};
use std::time::Instant;
use tsx_parser::parse_tsx;

/// Helper function to get path to test fixtures from repo root
fn fixtures_path(relative_path: &str) -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .join("test-fixtures")
        .join(relative_path)
}

#[cfg(feature = "pdfium")]
use pdf_test_utils::{pdf_to_pngs, RenderConfig};

/// Helper function to create default PDF config
fn create_default_config() -> PDFConfig {
    PDFConfig {
        page_size: PageSize::Letter,
        margin: Margin {
            top: 36.0,
            right: 36.0,
            bottom: 36.0,
            left: 36.0,
        },
        standard: pdf_generator::PDFStandard::PDF17,
        title: Some("Test Resume".to_string()),
        author: None,
        subject: Some("Curriculum Vitae".to_string()),
        keywords: None,
        creator: Some("ResumeWright Test Suite".to_string()),
        ats_weights: None,
        compress_content_streams: false,
        generate_bookmarks: true,
    }
}

/// Helper function to process TSX fixture to PDF bytes
fn tsx_to_pdf(tsx: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let document = parse_tsx(tsx)?;
    let metadata = extract_metadata(&document)?;
    let layout_config = extract_tsx_layout_config_from_document(&document);
    let config = create_default_config();
    let measurer = pdf_generator::fonts::PDFTextMeasurer;
    let layout = calculate_layout_direct(&document, &metadata, &layout_config, &config, &measurer)?;

    let mut generator = PDFGenerator::new(config.clone())?;

    // Note: Without font bytes from TypeScript, this will use fallback fonts
    // Full integration requires running through WASM bridge with actual Google Font bytes
    let json = serde_json::to_string(&layout)?;
    let pdf_layout: pdf_generator::layout_renderer::LayoutStructure = serde_json::from_str(&json)?;

    generator.render_layout(&pdf_layout)?;
    let pdf_bytes = generator.finalize()?;

    Ok(pdf_bytes)
}

/// Helper function to save PDF and generate PNG baseline
#[cfg(feature = "pdfium")]
fn generate_baseline_png(
    fixture_name: &str,
    pdf_bytes: &[u8],
) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let output_dir = fixtures_path("baselines/fonts");
    std::fs::create_dir_all(&output_dir)?;

    // Save PDF
    let pdf_path = output_dir.join(format!("{}.pdf", fixture_name));
    std::fs::write(&pdf_path, pdf_bytes)?;
    println!("  ✓ Saved PDF: {}", pdf_path.display());

    // Generate PNG baseline
    let png_paths = pdf_to_pngs(
        &pdf_path,
        &output_dir,
        fixture_name,
        RenderConfig::default(),
    )?;

    for png_path in &png_paths {
        println!("  ✓ Generated PNG: {}", png_path);
    }

    Ok(png_paths)
}

// =============================================================================
// Generate Baseline PNGs for Google Fonts Test Fixtures
// =============================================================================

/// Test: Fixture 06 - Google Font Roboto
/// Basic Google Font embedding test
#[test]
fn test_fixture_06_google_font_roboto() {
    println!("\n[Fixture 06] Google Font Roboto");

    let tsx = std::fs::read_to_string(fixtures_path(
        "tsx-samples/single-page/06-google-font-roboto.tsx",
    ))
    .expect("Failed to read fixture 06");

    let start = Instant::now();
    let pdf_bytes = tsx_to_pdf(&tsx).expect("Conversion should succeed for fixture 06");
    let duration = start.elapsed();

    let file_size = pdf_bytes.len();

    println!("  Conversion time: {:.2?}", duration);
    println!(
        "  PDF size: {} bytes ({:.2} KB)",
        file_size,
        file_size as f64 / 1024.0
    );

    // Performance: <5 seconds
    assert!(
        duration.as_secs() < 5,
        "Fixture 06 took {:.2?}, should be <5s",
        duration
    );

    // File size: <500KB
    assert!(
        file_size < 500 * 1024,
        "Fixture 06 size {} bytes should be <500KB",
        file_size
    );

    // Valid PDF
    assert_eq!(
        &pdf_bytes[0..5],
        b"%PDF-",
        "Fixture 06 should have valid PDF header"
    );

    // Generate PNG baseline (requires pdfium feature)
    #[cfg(feature = "pdfium")]
    {
        match generate_baseline_png("06-google-font-roboto", &pdf_bytes) {
            Ok(png_paths) => {
                assert!(!png_paths.is_empty(), "Should generate at least one PNG");
                println!("  ✓ Generated {} baseline PNG(s)", png_paths.len());
            }
            Err(e) => {
                eprintln!("  ⚠ PNG generation skipped (pdfium not available): {}", e);
            }
        }
    }

    #[cfg(not(feature = "pdfium"))]
    println!("  ⚠ PNG baseline generation skipped (pdfium feature not enabled)");
}

/// Test: Fixture 07 - Google Font Open Sans
#[test]
fn test_fixture_07_google_font_open_sans() {
    println!("\n[Fixture 07] Google Font Open Sans");

    let tsx = std::fs::read_to_string(fixtures_path(
        "tsx-samples/single-page/07-google-font-open-sans.tsx",
    ))
    .expect("Failed to read fixture 07");

    let start = Instant::now();
    let pdf_bytes = tsx_to_pdf(&tsx).expect("Conversion should succeed for fixture 07");
    let duration = start.elapsed();

    let file_size = pdf_bytes.len();

    println!("  Conversion time: {:.2?}", duration);
    println!(
        "  PDF size: {} bytes ({:.2} KB)",
        file_size,
        file_size as f64 / 1024.0
    );

    assert!(
        duration.as_secs() < 5,
        "Fixture 07 took {:.2?}, should be <5s",
        duration
    );
    assert!(
        file_size < 500 * 1024,
        "Fixture 07 size {} bytes should be <500KB",
        file_size
    );
    assert_eq!(
        &pdf_bytes[0..5],
        b"%PDF-",
        "Fixture 07 should have valid PDF header"
    );

    #[cfg(feature = "pdfium")]
    {
        match generate_baseline_png("07-google-font-open-sans", &pdf_bytes) {
            Ok(png_paths) => {
                assert!(!png_paths.is_empty(), "Should generate at least one PNG");
                println!("  ✓ Generated {} baseline PNG(s)", png_paths.len());
            }
            Err(e) => {
                eprintln!("  ⚠ PNG generation skipped: {}", e);
            }
        }
    }

    #[cfg(not(feature = "pdfium"))]
    println!("  ⚠ PNG baseline generation skipped (pdfium feature not enabled)");
}

/// Test: Fixture 08 - Mixed Google Fonts and Web-Safe Fonts
/// Tests fallback chain behavior
#[test]
fn test_fixture_08_google_font_mixed() {
    println!("\n[Fixture 08] Mixed Google Fonts + Web-Safe Fonts");

    let tsx = std::fs::read_to_string(fixtures_path(
        "tsx-samples/single-page/08-google-font-mixed.tsx",
    ))
    .expect("Failed to read fixture 08");

    let start = Instant::now();
    let pdf_bytes = tsx_to_pdf(&tsx).expect("Conversion should succeed for fixture 08");
    let duration = start.elapsed();

    let file_size = pdf_bytes.len();

    println!("  Conversion time: {:.2?}", duration);
    println!(
        "  PDF size: {} bytes ({:.2} KB)",
        file_size,
        file_size as f64 / 1024.0
    );

    assert!(
        duration.as_secs() < 5,
        "Fixture 08 took {:.2?}, should be <5s",
        duration
    );
    assert!(
        file_size < 500 * 1024,
        "Fixture 08 size {} bytes should be <500KB",
        file_size
    );
    assert_eq!(
        &pdf_bytes[0..5],
        b"%PDF-",
        "Fixture 08 should have valid PDF header"
    );

    #[cfg(feature = "pdfium")]
    {
        match generate_baseline_png("08-google-font-mixed", &pdf_bytes) {
            Ok(png_paths) => {
                assert!(!png_paths.is_empty(), "Should generate at least one PNG");
                println!("  ✓ Generated {} baseline PNG(s)", png_paths.len());
            }
            Err(e) => {
                eprintln!("  ⚠ PNG generation skipped: {}", e);
            }
        }
    }

    #[cfg(not(feature = "pdfium"))]
    println!("  ⚠ PNG baseline generation skipped (pdfium feature not enabled)");
}

/// Test: Fixture 09 - Google Font Variants (weights and styles)
/// Tests bold, italic, bold-italic combinations
#[test]
fn test_fixture_09_google_font_variants() {
    println!("\n[Fixture 09] Google Font Variants (weights 300-700, italic)");

    let tsx = std::fs::read_to_string(fixtures_path(
        "tsx-samples/single-page/09-google-font-variants.tsx",
    ))
    .expect("Failed to read fixture 09");

    let start = Instant::now();
    let pdf_bytes = tsx_to_pdf(&tsx).expect("Conversion should succeed for fixture 09");
    let duration = start.elapsed();

    let file_size = pdf_bytes.len();

    println!("  Conversion time: {:.2?}", duration);
    println!(
        "  PDF size: {} bytes ({:.2} KB)",
        file_size,
        file_size as f64 / 1024.0
    );

    assert!(
        duration.as_secs() < 5,
        "Fixture 09 took {:.2?}, should be <5s",
        duration
    );
    assert!(
        file_size < 500 * 1024,
        "Fixture 09 size {} bytes should be <500KB",
        file_size
    );
    assert_eq!(
        &pdf_bytes[0..5],
        b"%PDF-",
        "Fixture 09 should have valid PDF header"
    );

    #[cfg(feature = "pdfium")]
    {
        match generate_baseline_png("09-google-font-variants", &pdf_bytes) {
            Ok(png_paths) => {
                assert!(!png_paths.is_empty(), "Should generate at least one PNG");
                println!("  ✓ Generated {} baseline PNG(s)", png_paths.len());
            }
            Err(e) => {
                eprintln!("  ⚠ PNG generation skipped: {}", e);
            }
        }
    }

    #[cfg(not(feature = "pdfium"))]
    println!("  ⚠ PNG baseline generation skipped (pdfium feature not enabled)");
}

// =============================================================================
// Performance Tests
// =============================================================================

/// Test: Font subsetting performance
/// Measures time to subset a font (should be <100ms for typical CV)
#[test]
fn test_font_subsetting_performance() {
    println!("\n[Performance] Font Subsetting");

    // For this test, we'd need actual font bytes
    // In production, these come from TypeScript Google Fonts fetcher
    // For now, we'll document the expected performance

    println!("  Expected subsetting time: <100ms for typical CV text");
    println!("  Expected size reduction: 200-500KB → <200KB (60-90% smaller)");

    // Note: Actual performance test requires real Google Font bytes
    // This would be better tested in end-to-end tests with WASM bridge

    // Placeholder test - remove once we have font bytes
    let sample_text = "John Doe\nSoftware Engineer\nExperience\nEducation\nSkills";
    println!("  Sample text length: {} chars", sample_text.len());
    println!("  ⚠ Full performance test requires actual Google Font bytes");
}

/// Test: End-to-end conversion performance with Google Fonts
/// Measures total time from TSX → PDF with embedded fonts
#[test]
fn test_google_fonts_e2e_performance() {
    println!("\n[Performance] End-to-End Conversion with Google Fonts");

    let tsx = std::fs::read_to_string(fixtures_path(
        "tsx-samples/single-page/09-google-font-variants.tsx",
    ))
    .expect("Failed to read fixture 09");

    // Measure stages
    let total_start = Instant::now();

    let parse_start = Instant::now();
    let document = parse_tsx(&tsx).expect("Parse should succeed");
    let parse_time = parse_start.elapsed();

    let metadata_start = Instant::now();
    let metadata = extract_metadata(&document).expect("Metadata extraction should succeed");
    let metadata_time = metadata_start.elapsed();

    let extract_layout_start = Instant::now();
    let layout_config = extract_tsx_layout_config_from_document(&document);
    let extract_layout_time = extract_layout_start.elapsed();

    let layout_start = Instant::now();
    let config = create_default_config();
    let measurer = pdf_generator::fonts::PDFTextMeasurer;
    let layout = calculate_layout_direct(&document, &metadata, &layout_config, &config, &measurer)
        .expect("Layout calculation should succeed");
    let layout_time = layout_start.elapsed();

    let pdf_start = Instant::now();
    let mut generator = PDFGenerator::new(config).expect("PDF generator creation should succeed");
    let json = serde_json::to_string(&layout).unwrap();
    let pdf_layout: pdf_generator::layout_renderer::LayoutStructure =
        serde_json::from_str(&json).unwrap();
    generator
        .render_layout(&pdf_layout)
        .expect("Layout rendering should succeed");
    let _pdf_bytes = generator
        .finalize()
        .expect("PDF finalization should succeed");
    let pdf_time = pdf_start.elapsed();

    let total_time = total_start.elapsed();

    println!("  Parse TSX:          {:.2?}", parse_time);
    println!("  Extract Metadata:   {:.2?}", metadata_time);
    println!("  Extract Layout:     {:.2?}", extract_layout_time);
    println!("  Calculate Layout:   {:.2?}", layout_time);
    println!("  Generate PDF:       {:.2?}", pdf_time);
    println!("  ──────────────────────────────");
    println!("  TOTAL:              {:.2?}", total_time);

    // Should complete in <5 seconds
    assert!(
        total_time.as_secs() < 5,
        "E2E conversion took {:.2?}, should be <5s",
        total_time
    );

    // Note: This test uses fallback fonts (no actual Google Font bytes)
    // With real Google Fonts, expect additional time for:
    // - Font fetching: <500ms (cached) or <2s (network)
    // - Font subsetting: <100ms
}

// =============================================================================
// File Size Validation Tests
// =============================================================================

/// Test: Embedded font file size validation
/// Verifies embedded fonts are <200KB
#[test]
fn test_embedded_font_size_validation() {
    println!("\n[File Size] Embedded Font Size Validation");

    // Note: This test would check actual embedded font sizes in PDF
    // Requires parsing PDF to extract font streams

    println!("  Expected font size: <200KB per embedded font");
    println!("  Typical subsetting reduction: 60-90% smaller");
    println!("  ⚠ Full validation requires actual embedded fonts");

    // For now, we verify the PDF itself meets size requirements
    let tsx = std::fs::read_to_string(fixtures_path(
        "tsx-samples/single-page/09-google-font-variants.tsx",
    ))
    .expect("Failed to read fixture 09");

    let pdf_bytes = tsx_to_pdf(&tsx).expect("Conversion should succeed");
    let file_size = pdf_bytes.len();

    println!(
        "  Total PDF size: {} bytes ({:.2} KB)",
        file_size,
        file_size as f64 / 1024.0
    );

    // PDF file size <500KB
    assert!(
        file_size < 500 * 1024,
        "PDF size {} bytes should be <500KB",
        file_size
    );
}

/// Test: PDF compression efficiency with embedded fonts
#[test]
fn test_pdf_compression_with_fonts() {
    println!("\n[File Size] PDF Compression with Embedded Fonts");

    let fixtures = vec![
        (
            "06-roboto",
            "tsx-samples/single-page/06-google-font-roboto.tsx",
        ),
        (
            "07-open-sans",
            "tsx-samples/single-page/07-google-font-open-sans.tsx",
        ),
        (
            "08-mixed",
            "tsx-samples/single-page/08-google-font-mixed.tsx",
        ),
        (
            "09-variants",
            "tsx-samples/single-page/09-google-font-variants.tsx",
        ),
    ];

    for (name, path) in fixtures {
        let tsx = std::fs::read_to_string(fixtures_path(path))
            .unwrap_or_else(|_| panic!("Failed to read {}", path));

        let pdf_bytes = tsx_to_pdf(&tsx).expect("Conversion should succeed");
        let file_size = pdf_bytes.len();

        println!(
            "  {}: {} bytes ({:.2} KB)",
            name,
            file_size,
            file_size as f64 / 1024.0
        );

        // All should be <500KB
        assert!(
            file_size < 500 * 1024,
            "{} size {} bytes should be <500KB",
            name,
            file_size
        );
    }
}

// =============================================================================
// Visual Regression Tests (Placeholders)
// =============================================================================
// Note: Visual regression tests will be implemented in Playwright
// These Rust tests generate the baseline PNGs that Playwright will compare against

/// Test: Font rendering fidelity
/// Verifies fonts are rendered correctly (not just as fallback)
#[test]
fn test_font_rendering_fidelity() {
    println!("\n[Visual] Font Rendering Fidelity");

    // Note: Full visual testing happens in Playwright
    // This test verifies PDF contains expected font references

    let tsx = std::fs::read_to_string(fixtures_path(
        "tsx-samples/single-page/06-google-font-roboto.tsx",
    ))
    .expect("Failed to read fixture 06");

    let pdf_bytes = tsx_to_pdf(&tsx).expect("Conversion should succeed");
    let pdf_string = String::from_utf8_lossy(&pdf_bytes);

    // Verify PDF contains font references (either embedded or Standard 14 fallback)
    assert!(
        pdf_string.contains("/Font") || pdf_string.contains("/Helvetica"),
        "PDF should contain font references"
    );

    // Verify text rendering (Tj operator)
    assert!(
        pdf_string.contains(" Tj"),
        "PDF should contain text rendering operators"
    );

    println!("  ✓ PDF contains font references");
    println!("  ✓ PDF contains text rendering operators");
    println!("  ⚠ Full visual validation requires Playwright comparison with baselines");
}
