//! WASM Memory Leak Tests
//!
//! Critical tests to prevent memory leaks in the WASM bridge that could crash the extension.
//! Browser extensions have limited memory context, and memory leaks will crash the extension,
//! losing user work.
//!
//! Requirements:
//! 1. 100 sequential conversions without memory doubling
//! 2. Memory freed on error paths
//!
//! Run with: wasm-pack test --headless --chrome --package wasm-bridge

use js_sys::{Object, Reflect, WebAssembly};
use wasm_bindgen::prelude::*;
use wasm_bindgen_test::*;

// Import public API
use wasm_bridge::TsxToPdfConverter;

wasm_bindgen_test_configure!(run_in_browser);

/// Helper: Create minimal PDF config as JsValue
fn create_minimal_config() -> JsValue {
    let config = Object::new();
    Reflect::set(&config, &"page_size".into(), &"Letter".into()).unwrap();

    let margin = Object::new();
    Reflect::set(&margin, &"top".into(), &36.0.into()).unwrap();
    Reflect::set(&margin, &"right".into(), &36.0.into()).unwrap();
    Reflect::set(&margin, &"bottom".into(), &36.0.into()).unwrap();
    Reflect::set(&margin, &"left".into(), &36.0.into()).unwrap();
    Reflect::set(&config, &"margin".into(), &margin).unwrap();

    Reflect::set(&config, &"standard".into(), &"PDF17".into()).unwrap();
    Reflect::set(&config, &"title".into(), &"Test CV".into()).unwrap();
    Reflect::set(&config, &"author".into(), &JsValue::null()).unwrap();
    Reflect::set(&config, &"subject".into(), &"Memory Test".into()).unwrap();
    Reflect::set(&config, &"keywords".into(), &JsValue::null()).unwrap();
    Reflect::set(&config, &"creator".into(), &"Memory Test".into()).unwrap();

    config.into()
}

/// Helper: Create valid TSX code for testing
fn sample_tsx() -> &'static str {
    r#"
        const CV = () => (
            <div style="font-family: Helvetica; font-size: 12px; padding: 36px">
                <h1 style="font-size: 24px; font-weight: bold">Jane Doe</h1>
                <p style="font-size: 11px">Software Engineer</p>
                <div>
                    <h2 style="font-size: 16px; font-weight: bold; margin-top: 12px">Experience</h2>
                    <p>3+ years in software development</p>
                </div>
            </div>
        );
    "#
}

/// Helper: Create invalid TSX for error path testing
fn invalid_tsx() -> &'static str {
    "<div><h1>Unclosed tag for error testing"
}

/// Helper: Get current WASM memory size in bytes
fn get_wasm_memory_size() -> f64 {
    let memory = wasm_bindgen::memory();
    // Cast JsValue to WebAssembly::Memory
    let memory: WebAssembly::Memory = memory.unchecked_into();
    let buffer = memory.buffer();
    // Cast to ArrayBuffer to access byte_length
    let buffer: js_sys::ArrayBuffer = buffer.unchecked_into();
    buffer.byte_length() as f64
}

//
// Test 1: 100 Sequential Conversions Without Memory Doubling
//
// This is the PRIMARY memory leak test. If memory doubles after 100 conversions,
// there's a leak that will crash the extension in production.
//

#[wasm_bindgen_test]
fn test_no_memory_leak_100_sequential_conversions() {
    // Record baseline memory
    let baseline_memory = get_wasm_memory_size();
    web_sys::console::log_1(&format!("Baseline WASM memory: {} bytes", baseline_memory).into());

    let converter = TsxToPdfConverter::new();
    let config = create_minimal_config();
    let tsx = sample_tsx();

    // Run 100 conversions to detect memory leaks
    // Each conversion should clean up after itself
    for i in 0..100 {
        let result = converter.convert_tsx_to_pdf(
            tsx,
            config.clone(),
            None, // No fonts for speed
            None, // No progress callback
        );

        // Verify conversion succeeded
        assert!(
            result.is_ok(),
            "Conversion {} failed: {:?}",
            i,
            result.err()
        );

        // Log memory every 25 iterations
        if i % 25 == 0 {
            let current_memory = get_wasm_memory_size();
            let growth = current_memory - baseline_memory;
            let growth_ratio = current_memory / baseline_memory;
            web_sys::console::log_1(
                &format!(
                    "Iteration {}: Memory = {} bytes, Growth = {} bytes, Ratio = {:.2}x",
                    i, current_memory, growth, growth_ratio
                )
                .into(),
            );
        }
    }

    // Check final memory
    let final_memory = get_wasm_memory_size();
    let memory_growth = final_memory - baseline_memory;
    let growth_ratio = final_memory / baseline_memory;

    web_sys::console::log_1(
        &format!(
            "Final: Memory = {} bytes, Growth = {} bytes, Ratio = {:.2}x",
            final_memory, memory_growth, growth_ratio
        )
        .into(),
    );

    // CRITICAL: Memory should NOT double after 100 conversions
    // Some growth is expected (e.g., internal buffers, font caches),
    // but doubling indicates a leak
    assert!(
        growth_ratio < 2.0,
        "Memory leak detected: Memory doubled from {} to {} bytes (ratio: {:.2}x). \
         This indicates that resources are not being properly freed between conversions.",
        baseline_memory,
        final_memory,
        growth_ratio
    );

    // Additional check: Growth should be reasonable (< 50% of baseline)
    // Adjust threshold based on actual behavior
    let reasonable_growth_threshold = 0.5;
    if growth_ratio > (1.0 + reasonable_growth_threshold) {
        web_sys::console::warn_1(
            &format!(
                "Warning: Memory grew by {:.0}% after 100 conversions. \
             While not doubling, this may indicate inefficient memory usage.",
                (growth_ratio - 1.0) * 100.0
            )
            .into(),
        );
    }
}

//
// Test 2: Memory Freed on Parse Errors
//
// Verify that memory is properly freed when conversion fails due to parse errors.
// This is critical because error paths are easy to forget in cleanup code.
//

#[wasm_bindgen_test]
fn test_memory_freed_on_parse_error() {
    let baseline_memory = get_wasm_memory_size();
    web_sys::console::log_1(&format!("Baseline memory: {} bytes", baseline_memory).into());

    let converter = TsxToPdfConverter::new();
    let config = create_minimal_config();

    // Run 50 conversions that all fail due to parse errors
    // Memory should still be properly freed
    for i in 0..50 {
        let result = converter.convert_tsx_to_pdf(invalid_tsx(), config.clone(), None, None);

        // Verify conversion failed as expected
        assert!(
            result.is_err(),
            "Conversion {} should have failed with parse error",
            i
        );

        // Log memory every 10 iterations
        if i % 10 == 0 {
            let current_memory = get_wasm_memory_size();
            web_sys::console::log_1(
                &format!("Error iteration {}: Memory = {} bytes", i, current_memory).into(),
            );
        }
    }

    let final_memory = get_wasm_memory_size();
    let memory_growth = final_memory - baseline_memory;
    let growth_ratio = final_memory / baseline_memory;

    web_sys::console::log_1(
        &format!(
            "After 50 error conversions: Memory = {} bytes, Growth = {} bytes, Ratio = {:.2}x",
            final_memory, memory_growth, growth_ratio
        )
        .into(),
    );

    // Memory threshold for error paths (more lenient than success path)
    // Error messages and stack traces may accumulate slightly
    let error_path_threshold = 1.5; // 50% growth maximum

    assert!(
        growth_ratio < error_path_threshold,
        "Memory leak on error path: Memory grew from {} to {} bytes (ratio: {:.2}x). \
         Error handling is not properly freeing resources.",
        baseline_memory,
        final_memory,
        growth_ratio
    );
}

//
// Test 3: Memory Freed on Mixed Success/Error Patterns
//
// Real-world usage includes both successful and failed conversions.
// Verify memory is freed correctly in mixed scenarios.
//

#[wasm_bindgen_test]
fn test_memory_freed_on_mixed_conversions() {
    let baseline_memory = get_wasm_memory_size();
    web_sys::console::log_1(&format!("Baseline memory: {} bytes", baseline_memory).into());

    let converter = TsxToPdfConverter::new();
    let config = create_minimal_config();

    // Run 100 conversions alternating between success and error
    for i in 0..100 {
        let tsx = if i % 2 == 0 {
            sample_tsx() // Even iterations: success
        } else {
            invalid_tsx() // Odd iterations: error
        };

        let result = converter.convert_tsx_to_pdf(tsx, config.clone(), None, None);

        // Verify expected outcome
        if i % 2 == 0 {
            assert!(result.is_ok(), "Even iteration {} should succeed", i);
        } else {
            assert!(result.is_err(), "Odd iteration {} should fail", i);
        }

        // Log memory every 20 iterations
        if i % 20 == 0 {
            let current_memory = get_wasm_memory_size();
            web_sys::console::log_1(
                &format!("Mixed iteration {}: Memory = {} bytes", i, current_memory).into(),
            );
        }
    }

    let final_memory = get_wasm_memory_size();
    let growth_ratio = final_memory / baseline_memory;

    web_sys::console::log_1(
        &format!(
            "After 100 mixed conversions: Memory = {} bytes, Ratio = {:.2}x",
            final_memory, growth_ratio
        )
        .into(),
    );

    // Memory should not double even with mixed patterns
    assert!(
        growth_ratio < 2.0,
        "Memory leak in mixed pattern: Memory grew from {} to {} bytes (ratio: {:.2}x)",
        baseline_memory,
        final_memory,
        growth_ratio
    );
}

//
// Test 4: Large CV Memory Cleanup
//
// Test that large CVs (multi-page) also properly free memory.
// Large documents are more likely to expose memory leaks.
//

#[wasm_bindgen_test]
fn test_memory_freed_large_cv() {
    let baseline_memory = get_wasm_memory_size();
    web_sys::console::log_1(&format!("Baseline memory: {} bytes", baseline_memory).into());

    // Create a larger TSX with multiple sections
    let large_tsx = r#"
        const CV = () => (
            <div style="font-family: Helvetica; font-size: 12px; padding: 36px">
                <h1 style="font-size: 24px; font-weight: bold">John Smith</h1>
                <p style="font-size: 11px">Senior Full-Stack Engineer</p>
                <div>
                    <h2 style="font-size: 16px; font-weight: bold; margin-top: 12px">Experience</h2>
                    <div style="margin-top: 8px">
                        <h3 style="font-size: 14px; font-weight: bold">Tech Corp</h3>
                        <p>Senior Engineer | 2020-Present</p>
                        <ul>
                            <li>Led development of microservices architecture</li>
                            <li>Implemented CI/CD pipelines reducing deployment time by 70%</li>
                            <li>Mentored team of 5 junior developers</li>
                            <li>Designed and built real-time analytics dashboard</li>
                        </ul>
                    </div>
                    <div style="margin-top: 8px">
                        <h3 style="font-size: 14px; font-weight: bold">StartupCo</h3>
                        <p>Full-Stack Developer | 2018-2020</p>
                        <ul>
                            <li>Built MVP from scratch using React and Node.js</li>
                            <li>Integrated payment processing with Stripe</li>
                            <li>Implemented user authentication and authorization</li>
                        </ul>
                    </div>
                </div>
                <div>
                    <h2 style="font-size: 16px; font-weight: bold; margin-top: 12px">Skills</h2>
                    <p>JavaScript, TypeScript, Rust, React, Node.js, PostgreSQL, Redis, Docker, Kubernetes</p>
                </div>
                <div>
                    <h2 style="font-size: 16px; font-weight: bold; margin-top: 12px">Education</h2>
                    <p><strong>B.S. Computer Science</strong> - University of Technology, 2018</p>
                </div>
            </div>
        );
    "#;

    let converter = TsxToPdfConverter::new();
    let config = create_minimal_config();

    // Run 50 conversions of large CV
    for i in 0..50 {
        let result = converter.convert_tsx_to_pdf(large_tsx, config.clone(), None, None);

        assert!(result.is_ok(), "Large CV conversion {} failed", i);

        if i % 10 == 0 {
            let current_memory = get_wasm_memory_size();
            web_sys::console::log_1(
                &format!(
                    "Large CV iteration {}: Memory = {} bytes",
                    i, current_memory
                )
                .into(),
            );
        }
    }

    let final_memory = get_wasm_memory_size();
    let growth_ratio = final_memory / baseline_memory;

    web_sys::console::log_1(
        &format!(
            "After 50 large CV conversions: Memory = {} bytes, Ratio = {:.2}x",
            final_memory, growth_ratio
        )
        .into(),
    );

    // Large CVs should also not leak memory
    assert!(
        growth_ratio < 2.0,
        "Memory leak with large CVs: Memory grew from {} to {} bytes (ratio: {:.2}x)",
        baseline_memory,
        final_memory,
        growth_ratio
    );
}

//
// Test 5: Converter Instance Cleanup
//
// Test that creating/dropping multiple converter instances doesn't leak memory.
// This simulates extension popup being opened/closed multiple times.
//

#[wasm_bindgen_test]
fn test_converter_instance_cleanup() {
    let baseline_memory = get_wasm_memory_size();
    web_sys::console::log_1(&format!("Baseline memory: {} bytes", baseline_memory).into());

    let config = create_minimal_config();
    let tsx = sample_tsx();

    // Create 100 converter instances, use them once, then drop
    for i in 0..100 {
        let converter = TsxToPdfConverter::new();

        let result = converter.convert_tsx_to_pdf(tsx, config.clone(), None, None);

        assert!(result.is_ok(), "Conversion {} with new instance failed", i);

        // Converter drops here at end of iteration

        if i % 20 == 0 {
            let current_memory = get_wasm_memory_size();
            web_sys::console::log_1(
                &format!("Instance {} dropped: Memory = {} bytes", i, current_memory).into(),
            );
        }
    }

    let final_memory = get_wasm_memory_size();
    let growth_ratio = final_memory / baseline_memory;

    web_sys::console::log_1(
        &format!(
            "After 100 instance create/drop cycles: Memory = {} bytes, Ratio = {:.2}x",
            final_memory, growth_ratio
        )
        .into(),
    );

    // Converter instances should be properly dropped
    assert!(
        growth_ratio < 2.0,
        "Memory leak with converter instances: Memory grew from {} to {} bytes (ratio: {:.2}x). \
         Converter instances are not being properly cleaned up.",
        baseline_memory,
        final_memory,
        growth_ratio
    );
}
