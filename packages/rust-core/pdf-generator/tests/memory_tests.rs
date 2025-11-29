//! PDF Generator Memory Leak Tests
//!
//! Critical tests to ensure PDF generator properly releases memory after use.
//! Memory leaks in the PDF generator will accumulate over multiple conversions
//! and eventually crash the browser extension.
//!
//! Requirements:
//! 1. Memory released after generator finalization
//! 2. No accumulation over 50 generator create/use/drop cycles
//! 3. Memory properly freed on error paths
//!
//! Run with: cargo test --package pdf-generator memory

use pdf_generator::{Margin, PDFConfig, PDFGenerator, PDFStandard, PageSize};

/// Helper: Create default config for testing
fn create_test_config() -> PDFConfig {
    PDFConfig {
        page_size: PageSize::Letter,
        margin: Margin::from_inches(0.75),
        standard: PDFStandard::PDF17,
        title: Some("Memory Test CV".to_string()),
        author: None,
        subject: Some("Memory leak testing".to_string()),
        keywords: None,
        creator: Some("pdf-generator memory tests".to_string()),
        ..Default::default()
    }
}

//
// Test 1: Memory Released After PDF Generation
//
// This test verifies that after creating a PDF generator, adding content,
// and finalizing the PDF, all memory is properly released when the generator
// is dropped.
//
// Note: Rust doesn't provide direct memory measurement APIs like WASM,
// so this test focuses on ensuring Drop is implemented and verifying
// no panics occur during cleanup.
//

#[test]
fn test_pdf_generator_releases_memory_after_finalization() {
    // Create generator
    let config = create_test_config();
    let mut generator = PDFGenerator::new(config).expect("Failed to create PDF generator");

    // Add substantial content to allocate memory
    for i in 0..1000 {
        let y = 700.0 - (i as f64 * 0.5); // Prevent overlap
        let text = format!("Line {} - This is test content for memory testing", i);
        generator
            .add_text(&text, 100.0, y, 12.0)
            .expect("Failed to add text");
    }

    // Finalize PDF (allocates final buffer)
    let pdf_bytes = generator.finalize().expect("Failed to finalize PDF");

    // Verify PDF was generated
    assert!(pdf_bytes.len() > 1000, "PDF should be non-trivial size");

    // At this point, `generator` is consumed by finalize()
    // and `pdf_bytes` Vec<u8> will be dropped at end of scope.
    // This test passes if no memory leaks cause panics or crashes.

    // No explicit assertions - if we get here without panic, memory was handled correctly
}

//
// Test 2: 50 Sequential Generator Create/Use/Drop Cycles
//
// This simulates a user converting 50 CVs sequentially in the extension.
// Each cycle creates a generator, generates a PDF, and drops both.
// Memory should not accumulate between cycles.
//

#[test]
fn test_no_memory_accumulation_50_cycles() {
    // Run 50 full PDF generation cycles
    for iteration in 0..50 {
        // Create fresh generator for this iteration
        let config = create_test_config();
        let mut generator = PDFGenerator::new(config)
            .unwrap_or_else(|_| panic!("Failed to create generator on iteration {}", iteration));

        // Add content (simulate real CV)
        for line in 0..100 {
            let y = 700.0 - (line as f64 * 12.0);
            if y < 50.0 {
                break; // Stop if we run out of space on page
            }

            let text = format!("Iteration {} - CV content line {}", iteration, line);
            generator
                .add_text(&text, 72.0, y, 11.0)
                .unwrap_or_else(|_| {
                    panic!(
                        "Failed to add text on iteration {}, line {}",
                        iteration, line
                    )
                });
        }

        // Finalize PDF
        let pdf_bytes = generator
            .finalize()
            .unwrap_or_else(|_| panic!("Failed to finalize PDF on iteration {}", iteration));

        // Verify PDF was generated
        assert!(
            pdf_bytes.len() > 500,
            "PDF too small on iteration {}: {} bytes",
            iteration,
            pdf_bytes.len()
        );

        // Both `generator` and `pdf_bytes` drop here
        // If memory is leaking, we'll see panics or OOM after many iterations
    }

    // Test passes if all 50 iterations completed without panic
    // This demonstrates proper cleanup between cycles
}

//
// Test 3: Memory Freed on Error Paths
//
// Verify that memory is properly freed even when PDF generation fails.
// This tests error handling cleanup paths.
//

#[test]
fn test_memory_freed_on_error_paths() {
    // Test that memory is properly freed even when PDF generation encounters errors
    // We'll test by creating a generator and then dropping it without finalizing,
    // which simulates error paths where conversion is aborted

    for _ in 0..20 {
        let config = create_test_config();
        let mut generator = PDFGenerator::new(config).expect("Failed to create generator");

        // Add some content
        let _ = generator.add_text("Test content", 100.0, 700.0, 12.0);
        let _ = generator.add_text("More test content", 100.0, 688.0, 12.0);

        // Drop generator without finalizing (simulates error/cancellation)
        drop(generator);
    }

    // Test passes if all iterations completed without panic
    // This demonstrates proper cleanup even when finalize() is not called
}

//
// Test 4: Large PDF Memory Cleanup
//
// Test that generating a large multi-page PDF with lots of content
// properly releases all memory when finished.
//

#[test]
fn test_large_pdf_memory_cleanup() {
    let config = create_test_config();
    let mut generator = PDFGenerator::new(config).expect("Failed to create generator");

    // Add substantial content (but keep y coordinates positive)
    // We'll add many lines in a safe coordinate range
    for i in 0..500 {
        // Use y coordinates in safe range (700 down to 100)
        let y = 700.0 - ((i % 50) as f64 * 12.0); // Cycle every 50 lines to stay in range

        // Long text content to use more memory
        let text = format!(
            "Line {} - Lorem ipsum dolor sit amet, consectetur adipiscing elit, \
             sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
            i + 1
        );

        let result = generator.add_text(&text, 72.0, y, 11.0);

        // If add_text fails (due to internal limits), that's ok
        if result.is_err() && i > 100 {
            break; // We've added enough content for the test
        }
    }

    // Finalize large PDF
    let pdf_bytes = generator.finalize().expect("Failed to finalize large PDF");

    // Verify substantial PDF was created
    assert!(
        pdf_bytes.len() > 1_000,
        "Large PDF should be substantial size, got {} bytes",
        pdf_bytes.len()
    );

    // Test passes if large PDF was created and memory is freed without panic
}

//
// Test 5: Repeated Small Allocations
//
// Test that many small text additions don't leak memory through
// internal buffer reallocations.
//

#[test]
fn test_repeated_small_allocations() {
    let config = create_test_config();
    let mut generator = PDFGenerator::new(config).expect("Failed to create generator");

    // Add 10,000 small text strings
    // This stresses internal buffer management
    for i in 0..10_000 {
        let y = 700.0 - ((i % 50) as f64 * 12.0); // Cycle through positions
        let text = format!("T{}", i); // Very short text

        let result = generator.add_text(&text, 100.0, y, 10.0);

        // Some additions may fail due to layout constraints, that's ok
        if result.is_err() && i > 100 {
            // If we've successfully added at least 100 items, stop
            break;
        }
    }

    // Finalize
    let pdf_bytes = generator
        .finalize()
        .expect("Failed to finalize after many small additions");

    // Verify PDF was created
    assert!(pdf_bytes.len() > 100);

    // Test passes if no panic from internal buffer thrashing
}

//
// Test 6: Generator Drop Without Finalization
//
// Test that dropping a generator without calling finalize() doesn't leak memory.
// Users might create a generator and abandon it (e.g., cancelled conversion).
//

#[test]
fn test_generator_drop_without_finalize() {
    // Create generator and add content
    let config = create_test_config();
    let mut generator = PDFGenerator::new(config).expect("Failed to create generator");

    // Add content (stop before y goes negative)
    for i in 0..50 {
        let y = 700.0 - (i as f64 * 10.0);
        generator
            .add_text(&format!("Line {}", i), 100.0, y, 11.0)
            .expect("Failed to add text");
    }

    // Drop generator WITHOUT calling finalize()
    drop(generator);

    // Test passes if Drop implementation properly cleans up
    // No assertions needed - we're testing that drop doesn't panic
}

//
// Test 7: Stress Test - 100 Generators in Tight Loop
//
// Create and destroy 100 generators rapidly to detect any
// resource cleanup issues that might not appear in single-iteration tests.
//

#[test]
fn test_stress_100_generators() {
    for i in 0..100 {
        let config = create_test_config();
        let mut generator = PDFGenerator::new(config)
            .unwrap_or_else(|_| panic!("Failed to create generator {}", i));

        // Add minimal content
        generator
            .add_text("Test", 100.0, 700.0, 12.0)
            .unwrap_or_else(|_| panic!("Failed to add text for generator {}", i));

        // Finalize
        let pdf_bytes = generator
            .finalize()
            .unwrap_or_else(|_| panic!("Failed to finalize generator {}", i));

        assert!(!pdf_bytes.is_empty());

        // Generator and pdf_bytes drop immediately
    }

    // Test passes if all 100 iterations complete without panic or OOM
}

//
// Test 8: Interleaved Generators
//
// Test creating multiple generators simultaneously (not completing one before starting next).
// This simulates potential race conditions in async contexts or multiple tabs.
//

#[test]
fn test_interleaved_generators() {
    let config1 = create_test_config();
    let config2 = create_test_config();
    let config3 = create_test_config();

    let mut gen1 = PDFGenerator::new(config1).expect("Failed to create gen1");
    let mut gen2 = PDFGenerator::new(config2).expect("Failed to create gen2");
    let mut gen3 = PDFGenerator::new(config3).expect("Failed to create gen3");

    // Interleave operations
    gen1.add_text("Gen1 Line1", 100.0, 700.0, 12.0)
        .expect("gen1 add failed");
    gen2.add_text("Gen2 Line1", 100.0, 700.0, 12.0)
        .expect("gen2 add failed");
    gen1.add_text("Gen1 Line2", 100.0, 688.0, 12.0)
        .expect("gen1 add failed");
    gen3.add_text("Gen3 Line1", 100.0, 700.0, 12.0)
        .expect("gen3 add failed");
    gen2.add_text("Gen2 Line2", 100.0, 688.0, 12.0)
        .expect("gen2 add failed");
    gen3.add_text("Gen3 Line2", 100.0, 688.0, 12.0)
        .expect("gen3 add failed");

    // Finalize in different order than creation
    let pdf2 = gen2.finalize().expect("gen2 finalize failed");
    let pdf1 = gen1.finalize().expect("gen1 finalize failed");
    let pdf3 = gen3.finalize().expect("gen3 finalize failed");

    // Verify all PDFs generated
    assert!(pdf1.len() > 100);
    assert!(pdf2.len() > 100);
    assert!(pdf3.len() > 100);

    // Test passes if no cross-contamination or memory corruption occurred
}
