//! PDF Fixture Generator
//!
//! Generates PDF test fixtures from TSX input files.
//! Used to create integration test fixtures with known page counts.

use anyhow::{Context, Result};
use std::fs;
use std::path::Path;
use tsx_parser::parse_tsx;
use cv_domain::{extract_metadata, extract_tsx_layout_config_from_document};
use std::sync::Arc;

use layout_engine::calculate_layout_direct;
use pdf_generator::{PDFGenerator, PDFConfig, PageSize, Margin};

/// Create default PDF config
fn create_default_config() -> PDFConfig {
    PDFConfig {
        page_size: PageSize::Letter,
        margin: Margin {
            top: 36.0,
            right: 36.0,
            bottom: 36.0,
            left: 36.0,
        },
        title: Some("Test Resume".to_string()),
        author: None,
        subject: Some("Curriculum Vitae".to_string()),
        keywords: None,
        creator: Some("ResumeWright PDF Fixture Generator".to_string()),
        ..Default::default()
    }
}

/// Convert TSX file to PDF
fn generate_pdf_from_tsx(tsx_path: &Path, pdf_path: &Path) -> Result<usize> {
    println!("Reading TSX from: {}", tsx_path.display());
    let tsx_content = fs::read_to_string(tsx_path)
        .with_context(|| format!("Failed to read TSX file: {}", tsx_path.display()))?;

    println!("Parsing TSX...");
    let document = parse_tsx(&tsx_content)
        .context("Failed to parse TSX")?;

    println!("Extracting metadata...");
    let metadata = extract_metadata(&document)
        .context("Failed to extract metadata")?;

    println!("Extracting layout config...");
    let layout_config = extract_tsx_layout_config_from_document(&document);

    println!("Calculating layout directly...");
    let config = create_default_config();
    let layout = calculate_layout_direct(
        &document,
        &Arc::new(metadata),
        &Arc::new(layout_config),
        &config,
        &layout_types::EstimatedTextMeasurer
    )
        .context("Failed to calculate layout")?;
    
    println!("  Layout created with {} pages", layout.pages.len());
    for (i, page) in layout.pages.iter().enumerate() {
        println!("    Page {}: {} boxes", i + 1, page.boxes.len());
    }

    println!("Generating PDF...");
    let mut generator = PDFGenerator::new(config)
        .context("Failed to create PDF generator")?;

    // Convert layout-engine's LayoutStructure to pdf-generator's LayoutStructure
    let json = serde_json::to_string(&layout)
        .context("Failed to serialize layout")?;
    let pdf_layout: pdf_generator::layout_renderer::LayoutStructure = 
        serde_json::from_str(&json)
        .context("Failed to deserialize layout")?;

    generator.render_layout(&pdf_layout)
        .context("Failed to render layout to PDF")?;
    
    let pdf_bytes = generator.finalize()
        .context("Failed to finalize PDF")?;

    // Get page count before writing
    let page_count = count_pdf_pages(&pdf_bytes);

    println!("Writing PDF to: {}", pdf_path.display());
    fs::write(pdf_path, &pdf_bytes)
        .with_context(|| format!("Failed to write PDF file: {}", pdf_path.display()))?;

    println!("✓ Generated {} ({} pages, {} bytes)", 
             pdf_path.display(), page_count, pdf_bytes.len());

    Ok(page_count)
}

/// Count pages in PDF by looking for /Type /Page entries
fn count_pdf_pages(pdf_bytes: &[u8]) -> usize {
    let pdf_str = String::from_utf8_lossy(pdf_bytes);
    pdf_str.matches("/Type /Page\n").count()
}

fn main() -> Result<()> {
    println!("=== PDF Fixture Generator ===\n");

    let base_dir = Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap().parent().unwrap();
    let tsx_dir = base_dir.join("test-fixtures/tsx-samples/multi-page");
    let pdf_dir = base_dir.join("test-fixtures/pdf-output");

    // Ensure output directory exists
    fs::create_dir_all(&pdf_dir)
        .context("Failed to create pdf-output directory")?;

    // Define fixtures to generate
    let fixtures = vec![
        ("01-two-page-traditional.tsx", "01-two-page-traditional-integration.pdf", 2),
        ("02-three-page-academic.tsx", "02-three-page-academic-integration.pdf", 3),
        ("03-six-page-executive.tsx", "03-six-page-executive-integration.pdf", 6),
    ];

    let mut success_count = 0;
    let mut total_count = 0;

    for (tsx_file, pdf_file, expected_pages) in &fixtures {
        total_count += 1;
        let tsx_path = tsx_dir.join(tsx_file);
        let pdf_path = pdf_dir.join(pdf_file);

        println!("\n[{}/{}] Generating {}...", total_count, fixtures.len(), pdf_file);
        
        match generate_pdf_from_tsx(&tsx_path, &pdf_path) {
            Ok(page_count) => {
                if page_count == *expected_pages {
                    println!("✓ SUCCESS: Page count matches expected ({} pages)", page_count);
                    success_count += 1;
                } else {
                    println!("⚠ WARNING: Page count mismatch! Expected {} pages, got {}", 
                             expected_pages, page_count);
                }
            }
            Err(e) => {
                println!("✗ FAILED: {:#}", e);
            }
        }
    }

    println!("\n=== Summary ===");
    println!("Generated: {}/{} fixtures", success_count, total_count);
    println!("Output directory: {}", pdf_dir.display());

    if success_count == total_count {
        println!("\n✓ All fixtures generated successfully!");
        Ok(())
    } else {
        anyhow::bail!("Failed to generate some fixtures");
    }
}
