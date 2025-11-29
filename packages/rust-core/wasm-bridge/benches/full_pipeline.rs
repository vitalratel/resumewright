// ABOUTME: Benchmarks for the full TSX-to-PDF pipeline.
// ABOUTME: Tests performance with realistic and stress-test fixtures.

use criterion::{criterion_group, criterion_main, BenchmarkId, Criterion};
use cv_domain::{extract_metadata, extract_tsx_layout_config_from_document};
use layout_engine::calculate_layout_direct;
use pdf_generator::{PDFConfig, PDFGenerator};
use std::hint::black_box;
use std::path::{Path, PathBuf};
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

/// Convert TSX source to PDF bytes using the full pipeline.
fn tsx_to_pdf(tsx: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let document = parse_tsx(tsx)?;
    let metadata = extract_metadata(&document)?;
    let layout_config = extract_tsx_layout_config_from_document(&document);
    let config = PDFConfig::default();
    let measurer = pdf_generator::fonts::PDFTextMeasurer;
    let layout = calculate_layout_direct(&document, &metadata, &layout_config, &config, &measurer)?;

    let mut generator = PDFGenerator::new(PDFConfig::default())?;
    generator.render_layout(&layout)?;
    let pdf_bytes = generator.finalize()?;
    Ok(pdf_bytes)
}

/// Benchmark the full pipeline with performance test fixtures.
fn bench_full_pipeline(c: &mut Criterion) {
    let mut group = c.benchmark_group("full_pipeline");

    // Load fixtures once
    let large_cv = std::fs::read_to_string(fixtures_path("performance/large-cv-500-nodes.tsx"))
        .expect("Failed to read large-cv-500-nodes.tsx");
    let pathological =
        std::fs::read_to_string(fixtures_path("performance/pathological-nested-flex.tsx"))
            .expect("Failed to read pathological-nested-flex.tsx");

    // Also include a standard single-page fixture for baseline comparison
    let simple_cv = std::fs::read_to_string(fixtures_path(
        "tsx-samples/single-page/03-minimal-simple.tsx",
    ))
    .expect("Failed to read 03-minimal-simple.tsx");

    group.bench_with_input(
        BenchmarkId::new("fixture", "03-minimal-simple"),
        &simple_cv,
        |b, tsx| {
            b.iter(|| tsx_to_pdf(black_box(tsx)).expect("Pipeline should succeed"));
        },
    );

    group.bench_with_input(
        BenchmarkId::new("fixture", "large-cv-500-nodes"),
        &large_cv,
        |b, tsx| {
            b.iter(|| tsx_to_pdf(black_box(tsx)).expect("Pipeline should succeed"));
        },
    );

    group.bench_with_input(
        BenchmarkId::new("fixture", "pathological-nested-flex"),
        &pathological,
        |b, tsx| {
            b.iter(|| tsx_to_pdf(black_box(tsx)).expect("Pipeline should succeed"));
        },
    );

    group.finish();
}

/// Benchmark individual pipeline stages to identify bottlenecks.
fn bench_pipeline_stages(c: &mut Criterion) {
    let mut group = c.benchmark_group("pipeline_stages");

    let large_cv = std::fs::read_to_string(fixtures_path("performance/large-cv-500-nodes.tsx"))
        .expect("Failed to read large-cv-500-nodes.tsx");

    // Stage 1: TSX Parsing
    group.bench_function("large_cv/parsing", |b| {
        b.iter(|| parse_tsx(black_box(&large_cv)).expect("Parsing should succeed"));
    });

    // Pre-parse for subsequent stages
    let document = parse_tsx(&large_cv).expect("Parsing should succeed");

    // Stage 2: Metadata Extraction
    group.bench_function("large_cv/metadata_extraction", |b| {
        b.iter(|| extract_metadata(black_box(&document)).expect("Extraction should succeed"));
    });

    let metadata = extract_metadata(&document).expect("Extraction should succeed");
    let layout_config = extract_tsx_layout_config_from_document(&document);
    let config = PDFConfig::default();
    let measurer = pdf_generator::fonts::PDFTextMeasurer;

    // Stage 3: Layout Calculation
    group.bench_function("large_cv/layout_calculation", |b| {
        b.iter(|| {
            calculate_layout_direct(
                black_box(&document),
                black_box(&metadata),
                black_box(&layout_config),
                black_box(&config),
                black_box(&measurer),
            )
            .expect("Layout should succeed")
        });
    });

    let layout = calculate_layout_direct(&document, &metadata, &layout_config, &config, &measurer)
        .expect("Layout should succeed");

    // Stage 4: PDF Generation
    group.bench_function("large_cv/pdf_generation", |b| {
        b.iter(|| {
            let mut generator =
                PDFGenerator::new(PDFConfig::default()).expect("Generator should create");
            generator
                .render_layout(black_box(&layout))
                .expect("Render should succeed");
            generator.finalize().expect("Finalize should succeed")
        });
    });

    group.finish();
}

criterion_group!(benches, bench_full_pipeline, bench_pipeline_stages);
criterion_main!(benches);
