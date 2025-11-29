//! Performance Benchmarks for CV Domain Regex Operations
//! Regex performance benchmarks for large documents
//!
//! Performance targets:
//! - Name extraction: <1ms per field
//! - Email extraction: <1ms per field
//! - Phone extraction: <1ms per field
//! - Layout detection: <5ms per document
//! - Full metadata extraction: <10ms per document

use criterion::{criterion_group, criterion_main, BenchmarkId, Criterion};
use cv_domain::extract_metadata;
use std::hint::black_box;
use tsx_parser::parse_tsx;

// Test fixtures - embedded at compile time for consistent benchmarking
const CV_SMALL: &str =
    include_str!("../../../../test-fixtures/tsx-samples/benchmarks/cv_small.tsx");
const CV_MEDIUM: &str =
    include_str!("../../../../test-fixtures/tsx-samples/benchmarks/cv_medium.tsx");
const CV_LARGE: &str =
    include_str!("../../../../test-fixtures/tsx-samples/benchmarks/cv_large.tsx");

/// Helper to get fixture metadata for display
fn fixture_metadata(tsx: &str, name: &str) -> String {
    format!(
        "{} ({} chars, {} lines)",
        name,
        tsx.len(),
        tsx.lines().count()
    )
}

/// Benchmark: Contact Information Extraction
/// Target: <1ms per field extraction (name, email, phone)
///
/// This group benchmarks the regex patterns used to extract contact information
/// from CV text content. These operations are critical for ATS compatibility scoring.
fn bench_contact_extraction(c: &mut Criterion) {
    let mut group = c.benchmark_group("contact_extraction");

    // Parse documents once for reuse
    let doc_small = parse_tsx(CV_SMALL).expect("Small CV should parse");
    let doc_medium = parse_tsx(CV_MEDIUM).expect("Medium CV should parse");
    let doc_large = parse_tsx(CV_LARGE).expect("Large CV should parse");

    // Name extraction - uses heuristics on h1/h2 elements
    group.bench_with_input(
        BenchmarkId::new("name_extraction", fixture_metadata(CV_SMALL, "small")),
        &doc_small,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.name);
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("name_extraction", fixture_metadata(CV_MEDIUM, "medium")),
        &doc_medium,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.name);
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("name_extraction", fixture_metadata(CV_LARGE, "large")),
        &doc_large,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.name);
            });
        },
    );

    // Email extraction - uses regex pattern matching
    group.bench_with_input(
        BenchmarkId::new("email_extraction", fixture_metadata(CV_SMALL, "small")),
        &doc_small,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.email);
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("email_extraction", fixture_metadata(CV_MEDIUM, "medium")),
        &doc_medium,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.email);
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("email_extraction", fixture_metadata(CV_LARGE, "large")),
        &doc_large,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.email);
            });
        },
    );

    // Phone extraction - uses regex pattern matching
    group.bench_with_input(
        BenchmarkId::new("phone_extraction", fixture_metadata(CV_SMALL, "small")),
        &doc_small,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.phone);
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("phone_extraction", fixture_metadata(CV_MEDIUM, "medium")),
        &doc_medium,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.phone);
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("phone_extraction", fixture_metadata(CV_LARGE, "large")),
        &doc_large,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.phone);
            });
        },
    );

    // Location extraction - uses regex pattern matching
    group.bench_with_input(
        BenchmarkId::new("location_extraction", fixture_metadata(CV_SMALL, "small")),
        &doc_small,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.location);
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("location_extraction", fixture_metadata(CV_MEDIUM, "medium")),
        &doc_medium,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.location);
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("location_extraction", fixture_metadata(CV_LARGE, "large")),
        &doc_large,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.location);
            });
        },
    );

    // Website extraction - uses regex pattern matching
    group.bench_with_input(
        BenchmarkId::new("website_extraction", fixture_metadata(CV_SMALL, "small")),
        &doc_small,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.website);
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("website_extraction", fixture_metadata(CV_MEDIUM, "medium")),
        &doc_medium,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.website);
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("website_extraction", fixture_metadata(CV_LARGE, "large")),
        &doc_large,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.website);
            });
        },
    );

    group.finish();
}

/// Benchmark: Layout Detection and Analysis
/// Target: <5ms per document
///
/// This group benchmarks the heuristics used to detect CV layout types,
/// estimate page counts, detect clear sections, and analyze font complexity.
fn bench_layout_detection(c: &mut Criterion) {
    let mut group = c.benchmark_group("layout_detection");

    let doc_small = parse_tsx(CV_SMALL).expect("Small CV should parse");
    let doc_medium = parse_tsx(CV_MEDIUM).expect("Medium CV should parse");
    let doc_large = parse_tsx(CV_LARGE).expect("Large CV should parse");

    // Layout type detection - analyzes component structure
    group.bench_with_input(
        BenchmarkId::new("layout_type", fixture_metadata(CV_SMALL, "small")),
        &doc_small,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.layout_type);
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("layout_type", fixture_metadata(CV_MEDIUM, "medium")),
        &doc_medium,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.layout_type);
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("layout_type", fixture_metadata(CV_LARGE, "large")),
        &doc_large,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.layout_type);
            });
        },
    );

    // Clear sections detection - counts h2/h3 headings
    group.bench_with_input(
        BenchmarkId::new("clear_sections", fixture_metadata(CV_SMALL, "small")),
        &doc_small,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.has_clear_sections);
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("clear_sections", fixture_metadata(CV_MEDIUM, "medium")),
        &doc_medium,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.has_clear_sections);
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("clear_sections", fixture_metadata(CV_LARGE, "large")),
        &doc_large,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.has_clear_sections);
            });
        },
    );

    // Font complexity detection - uses regex to find font-family declarations
    group.bench_with_input(
        BenchmarkId::new("font_complexity", fixture_metadata(CV_SMALL, "small")),
        &doc_small,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.font_complexity);
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("font_complexity", fixture_metadata(CV_MEDIUM, "medium")),
        &doc_medium,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.font_complexity);
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("font_complexity", fixture_metadata(CV_LARGE, "large")),
        &doc_large,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.font_complexity);
            });
        },
    );

    // Page count estimation - based on content length
    group.bench_with_input(
        BenchmarkId::new("page_count", fixture_metadata(CV_SMALL, "small")),
        &doc_small,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.estimated_pages);
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("page_count", fixture_metadata(CV_MEDIUM, "medium")),
        &doc_medium,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.estimated_pages);
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("page_count", fixture_metadata(CV_LARGE, "large")),
        &doc_large,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata.estimated_pages);
            });
        },
    );

    group.finish();
}

/// Benchmark: Full Metadata Extraction
/// Target: <10ms per document
///
/// This is the critical end-to-end metric measuring complete metadata extraction
/// including all regex operations, heuristics, and ATS analysis.
fn bench_full_analysis(c: &mut Criterion) {
    let mut group = c.benchmark_group("full_analysis");

    // Configure for more accurate measurements of these critical operations
    group.sample_size(100);

    // Small CV (1 page, ~500 chars)
    group.bench_function(fixture_metadata(CV_SMALL, "small"), |b| {
        b.iter(|| {
            let document = parse_tsx(black_box(CV_SMALL)).unwrap();
            let metadata = extract_metadata(black_box(&document)).unwrap();
            black_box(metadata);
        });
    });

    // Medium CV (2-3 pages, ~2000 chars)
    group.bench_function(fixture_metadata(CV_MEDIUM, "medium"), |b| {
        b.iter(|| {
            let document = parse_tsx(black_box(CV_MEDIUM)).unwrap();
            let metadata = extract_metadata(black_box(&document)).unwrap();
            black_box(metadata);
        });
    });

    // Large CV (10+ pages, ~10000 chars)
    group.bench_function(fixture_metadata(CV_LARGE, "large"), |b| {
        b.iter(|| {
            let document = parse_tsx(black_box(CV_LARGE)).unwrap();
            let metadata = extract_metadata(black_box(&document)).unwrap();
            black_box(metadata);
        });
    });

    group.finish();
}

/// Benchmark: ATS Score Calculation
/// Target: <100μs (negligible overhead)
///
/// ATS score calculation is pure computation with no regex, but we benchmark
/// it to ensure it remains fast even as scoring logic becomes more complex.
fn bench_ats_scoring(c: &mut Criterion) {
    let mut group = c.benchmark_group("ats_scoring");

    // Pre-extract metadata for scoring benchmarks
    let doc_small = parse_tsx(CV_SMALL).expect("Small CV should parse");
    let doc_medium = parse_tsx(CV_MEDIUM).expect("Medium CV should parse");
    let doc_large = parse_tsx(CV_LARGE).expect("Large CV should parse");

    let metadata_small = extract_metadata(&doc_small).unwrap();
    let metadata_medium = extract_metadata(&doc_medium).unwrap();
    let metadata_large = extract_metadata(&doc_large).unwrap();

    // ATS score calculation
    group.bench_with_input(
        BenchmarkId::new("ats_score", "small"),
        &metadata_small,
        |b, metadata| {
            b.iter(|| {
                black_box(metadata.ats_score());
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("ats_score", "medium"),
        &metadata_medium,
        |b, metadata| {
            b.iter(|| {
                black_box(metadata.ats_score());
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("ats_score", "large"),
        &metadata_large,
        |b, metadata| {
            b.iter(|| {
                black_box(metadata.ats_score());
            });
        },
    );

    // ATS suggestions generation
    group.bench_with_input(
        BenchmarkId::new("ats_suggestions", "small"),
        &metadata_small,
        |b, metadata| {
            b.iter(|| {
                black_box(metadata.ats_suggestions());
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("ats_suggestions", "medium"),
        &metadata_medium,
        |b, metadata| {
            b.iter(|| {
                black_box(metadata.ats_suggestions());
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("ats_suggestions", "large"),
        &metadata_large,
        |b, metadata| {
            b.iter(|| {
                black_box(metadata.ats_suggestions());
            });
        },
    );

    // ATS friendly check
    group.bench_with_input(
        BenchmarkId::new("is_ats_friendly", "small"),
        &metadata_small,
        |b, metadata| {
            b.iter(|| {
                black_box(metadata.is_ats_friendly());
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("is_ats_friendly", "medium"),
        &metadata_medium,
        |b, metadata| {
            b.iter(|| {
                black_box(metadata.is_ats_friendly());
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("is_ats_friendly", "large"),
        &metadata_large,
        |b, metadata| {
            b.iter(|| {
                black_box(metadata.is_ats_friendly());
            });
        },
    );

    group.finish();
}

/// Benchmark: Parsing Only (Baseline)
///
/// This isolates tsx-parser performance from cv-domain extraction logic,
/// helping identify whether performance issues are in parsing or extraction.
fn bench_parsing_only(c: &mut Criterion) {
    let mut group = c.benchmark_group("parsing_only");

    group.bench_function(fixture_metadata(CV_SMALL, "small"), |b| {
        b.iter(|| {
            let document = parse_tsx(black_box(CV_SMALL)).unwrap();
            black_box(document);
        });
    });

    group.bench_function(fixture_metadata(CV_MEDIUM, "medium"), |b| {
        b.iter(|| {
            let document = parse_tsx(black_box(CV_MEDIUM)).unwrap();
            black_box(document);
        });
    });

    group.bench_function(fixture_metadata(CV_LARGE, "large"), |b| {
        b.iter(|| {
            let document = parse_tsx(black_box(CV_LARGE)).unwrap();
            black_box(document);
        });
    });

    group.finish();
}

/// Benchmark: Extraction Only (No Parsing)
///
/// This measures pure extraction performance by pre-parsing documents,
/// isolating cv-domain logic from tsx-parser overhead.
fn bench_extraction_only(c: &mut Criterion) {
    let mut group = c.benchmark_group("extraction_only");

    let doc_small = parse_tsx(CV_SMALL).expect("Small CV should parse");
    let doc_medium = parse_tsx(CV_MEDIUM).expect("Medium CV should parse");
    let doc_large = parse_tsx(CV_LARGE).expect("Large CV should parse");

    group.bench_with_input(
        BenchmarkId::new("extract_metadata", fixture_metadata(CV_SMALL, "small")),
        &doc_small,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata);
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("extract_metadata", fixture_metadata(CV_MEDIUM, "medium")),
        &doc_medium,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata);
            });
        },
    );

    group.bench_with_input(
        BenchmarkId::new("extract_metadata", fixture_metadata(CV_LARGE, "large")),
        &doc_large,
        |b, doc| {
            b.iter(|| {
                let metadata = extract_metadata(black_box(doc)).unwrap();
                black_box(metadata);
            });
        },
    );

    group.finish();
}

criterion_group!(
    benches,
    bench_contact_extraction,
    bench_layout_detection,
    bench_full_analysis,
    bench_ats_scoring,
    bench_parsing_only,
    bench_extraction_only,
);

criterion_main!(benches);
