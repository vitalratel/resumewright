//! Performance Benchmarks for Font Processing Pipeline
//! Performance benchmarks to validate <500ms target
//!
//! Performance targets:
//! - Full pipeline: <500ms (high-end), <800ms (low-end)
//! - Subsetting: <200ms
//! - WOFF2 decompression: <100ms
//! - Embedding: <50ms

use criterion::{criterion_group, criterion_main, BenchmarkId, Criterion};
use font_toolkit::{decompress_woff, embed_truetype_font, subsetter::subset_font_core};
use lopdf::Document;
use std::hint::black_box;

// Test fixtures - embedded at compile time for consistent benchmarking
const ROBOTO_TTF: &[u8] = include_bytes!("../../../../test-fixtures/fonts/Roboto-Regular.ttf");
const ROBOTO_WOFF: &[u8] = include_bytes!("../../../../test-fixtures/fonts/Roboto-Regular.woff");
const OPENSANS_TTF: &[u8] = include_bytes!("../../../../test-fixtures/fonts/OpenSans-Bold.ttf");

// Realistic CV text samples of varying sizes
const CV_TEXT_SHORT: &str = r#"John Doe
Software Engineer
john@example.com
"#;

const CV_TEXT_MEDIUM: &str = r#"John Doe
Senior Software Engineer | San Francisco, CA
john.doe@example.com | (555) 123-4567

EXPERIENCE
Senior Software Engineer, Tech Corp (2020-Present)
- Led development of microservices architecture
- Improved system performance by 40%
- Mentored team of 5 engineers

Software Engineer, StartupCo (2018-2020)
- Built scalable web applications
- Implemented CI/CD pipelines

EDUCATION
MS Computer Science, Stanford University (2018)
BS Computer Science, UC Berkeley (2016)

SKILLS
Languages: Rust, TypeScript, Python, C++
Tools: Docker, Kubernetes, AWS, Git
"#;

const CV_TEXT_LONG: &str = r#"John Doe
Senior Software Engineer | San Francisco, CA
john.doe@example.com | (555) 123-4567 | linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Results-driven Senior Software Engineer with 8+ years of experience in designing and implementing
scalable distributed systems. Expertise in Rust, TypeScript, and cloud-native architectures.
Proven track record of delivering high-performance solutions and leading cross-functional teams.

EXPERIENCE

Senior Software Engineer | Tech Corp | San Francisco, CA | 2020 - Present
- Architected and implemented microservices platform serving 10M+ daily active users
- Reduced latency by 45% through optimization of database queries and caching strategies
- Led migration from monolith to microservices, improving deployment frequency by 10x
- Mentored team of 7 engineers, conducting code reviews and technical design sessions
- Technologies: Rust, Kubernetes, PostgreSQL, Redis, gRPC, GraphQL

Software Engineer | StartupCo | Palo Alto, CA | 2018 - 2020
- Built real-time analytics platform processing 1TB+ data daily
- Implemented CI/CD pipelines reducing deployment time from hours to minutes
- Developed REST APIs serving 100K+ requests per second
- Collaborated with product team to define technical requirements
- Technologies: Python, TypeScript, React, Docker, AWS, DynamoDB

Junior Software Engineer | Enterprise Inc | San Jose, CA | 2016 - 2018
- Developed internal tools improving developer productivity by 30%
- Fixed critical bugs in production systems serving enterprise clients
- Participated in on-call rotation supporting 99.9% uptime SLA
- Technologies: Java, Spring Boot, MySQL, Jenkins

EDUCATION

Master of Science in Computer Science | Stanford University | 2018
- GPA: 3.9/4.0
- Thesis: "Optimizing Distributed Systems for Low-Latency Communication"
- Relevant Coursework: Distributed Systems, Advanced Algorithms, Machine Learning

Bachelor of Science in Computer Science | UC Berkeley | 2016
- GPA: 3.8/4.0, Magna Cum Laude
- Relevant Coursework: Data Structures, Operating Systems, Computer Networks

TECHNICAL SKILLS

Languages: Rust, TypeScript, Python, C++, Java, Go, SQL
Frameworks: React, Node.js, Express, Actix, Tokio, Spring Boot
Tools: Docker, Kubernetes, Git, GitHub Actions, Jenkins, Terraform
Databases: PostgreSQL, MySQL, Redis, MongoDB, DynamoDB
Cloud: AWS (EC2, S3, Lambda, RDS), GCP, Azure

CERTIFICATIONS

AWS Certified Solutions Architect - Professional (2023)
Certified Kubernetes Administrator (CKA) (2022)

PROJECTS

Open Source Contributions
- Core contributor to Tokio async runtime (500+ stars)
- Maintainer of popular Rust CLI tool (2K+ stars)
- Regular contributor to various Rust ecosystem crates

Personal Projects
- Built distributed key-value store in Rust with Raft consensus
- Created performance monitoring tool used by 50+ companies
- Developed WASM-based web applications with near-native performance

AWARDS & RECOGNITION

Tech Corp Innovation Award (2023) - Recognized for architectural excellence
Hackathon Winner - Best Technical Solution (2021)
Academic Excellence Award - Stanford CS Department (2018)
"#;

/// Benchmark: WOFF Decompression
/// Target: <100ms (part of overall <500ms budget)
fn bench_woff_decompression(c: &mut Criterion) {
    let mut group = c.benchmark_group("woff_decompression");

    group.bench_function("woff_to_ttf", |b| {
        b.iter(|| {
            let result = decompress_woff(black_box(ROBOTO_WOFF));
            black_box(result).expect("WOFF decompression should succeed");
        });
    });

    group.finish();
}

/// Benchmark: WOFF2 Decompression
/// Target: <100ms (more efficient than WOFF)
///
/// Note: WOFF2 test fixture is incompatible - benchmark disabled
fn bench_woff2_decompression(_c: &mut Criterion) {
    // Disabled due to incompatible test fixture
    // The WOFF2 file appears to be pre-subset and causes decompression errors
    // TODO: Generate proper WOFF2 test fixture
}

/// Benchmark: Font Subsetting with Varying Text Sizes
/// Target: <200ms for typical CV text
fn bench_font_subsetting(c: &mut Criterion) {
    let mut group = c.benchmark_group("font_subsetting");

    // Short text (minimal CV)
    group.bench_with_input(
        BenchmarkId::new("short_text", CV_TEXT_SHORT.len()),
        &CV_TEXT_SHORT,
        |b, text| {
            b.iter(|| {
                let result = subset_font_core(black_box(ROBOTO_TTF), None, black_box(text), false)
                    .map(|(bytes, _)| bytes);
                black_box(result).expect("Subsetting should succeed");
            });
        },
    );

    // Medium text (typical CV)
    group.bench_with_input(
        BenchmarkId::new("medium_text", CV_TEXT_MEDIUM.len()),
        &CV_TEXT_MEDIUM,
        |b, text| {
            b.iter(|| {
                let result = subset_font_core(black_box(ROBOTO_TTF), None, black_box(text), false)
                    .map(|(bytes, _)| bytes);
                black_box(result).expect("Subsetting should succeed");
            });
        },
    );

    // Long text (comprehensive CV)
    group.bench_with_input(
        BenchmarkId::new("long_text", CV_TEXT_LONG.len()),
        &CV_TEXT_LONG,
        |b, text| {
            b.iter(|| {
                let result = subset_font_core(black_box(ROBOTO_TTF), None, black_box(text), false)
                    .map(|(bytes, _)| bytes);
                black_box(result).expect("Subsetting should succeed");
            });
        },
    );

    // Different font (OpenSans)
    group.bench_with_input(
        BenchmarkId::new("opensans_medium", CV_TEXT_MEDIUM.len()),
        &CV_TEXT_MEDIUM,
        |b, text| {
            b.iter(|| {
                let result =
                    subset_font_core(black_box(OPENSANS_TTF), None, black_box(text), false)
                        .map(|(bytes, _)| bytes);
                black_box(result).expect("Subsetting should succeed");
            });
        },
    );

    group.finish();
}

/// Benchmark: Font Embedding
/// Target: <50ms (relatively fast operation)
fn bench_font_embedding(c: &mut Criterion) {
    // Pre-subset the font for realistic scenario
    let (subset_bytes, _) = subset_font_core(ROBOTO_TTF, None, CV_TEXT_MEDIUM, false)
        .expect("Pre-subsetting should succeed");

    let mut group = c.benchmark_group("font_embedding");

    group.bench_function("embed_subset_font", |b| {
        b.iter(|| {
            let mut doc = Document::with_version("1.7");
            let result = embed_truetype_font(
                black_box(&mut doc),
                black_box(&subset_bytes),
                black_box("Roboto"),
                black_box(400),
                black_box(false),
                None, // No CID-to-GID mapping for benchmark
            );
            black_box(result).expect("Embedding should succeed");
        });
    });

    group.bench_function("embed_multiple_variants", |b| {
        b.iter(|| {
            let mut doc = Document::with_version("1.7");

            // Embed regular
            embed_truetype_font(
                &mut doc,
                black_box(&subset_bytes),
                "Roboto",
                400,
                false,
                None,
            )
            .expect("Embedding regular should succeed");

            // Embed bold
            embed_truetype_font(
                &mut doc,
                black_box(&subset_bytes),
                "Roboto",
                700,
                false,
                None,
            )
            .expect("Embedding bold should succeed");

            // Embed italic
            embed_truetype_font(
                &mut doc,
                black_box(&subset_bytes),
                "Roboto",
                400,
                true,
                None,
            )
            .expect("Embedding italic should succeed");

            black_box(doc);
        });
    });

    group.finish();
}

/// Benchmark: Full Pipeline (End-to-End)
/// Target: <500ms (high-end devices), <800ms (low-end devices)
/// This is the critical performance metric
fn bench_full_pipeline(c: &mut Criterion) {
    let mut group = c.benchmark_group("full_pipeline");

    // Configure for longer benchmark (pipeline is more expensive)
    group.sample_size(50); // Reduce sample size for longer operations

    // Full pipeline: WOFF → TTF → Subset → Embed
    // Note: Using WOFF instead of WOFF2 due to test fixture issues
    group.bench_function("woff_to_pdf_short", |b| {
        b.iter(|| {
            // Step 1: Decompress WOFF
            let ttf_bytes =
                decompress_woff(black_box(ROBOTO_WOFF)).expect("WOFF decompression should succeed");

            // Step 2: Subset
            let (subset_bytes, _) =
                subset_font_core(black_box(&ttf_bytes), None, black_box(CV_TEXT_SHORT), false)
                    .expect("Subsetting should succeed");

            // Step 3: Embed
            let mut doc = Document::with_version("1.7");
            let result = embed_truetype_font(
                black_box(&mut doc),
                black_box(&subset_bytes),
                "Roboto",
                400,
                false,
                None,
            );
            black_box(result).expect("Embedding should succeed");
        });
    });

    group.bench_function("woff_to_pdf_medium", |b| {
        b.iter(|| {
            let ttf_bytes =
                decompress_woff(black_box(ROBOTO_WOFF)).expect("WOFF decompression should succeed");

            let (subset_bytes, _) = subset_font_core(
                black_box(&ttf_bytes),
                None,
                black_box(CV_TEXT_MEDIUM),
                false,
            )
            .expect("Subsetting should succeed");

            let mut doc = Document::with_version("1.7");
            let result = embed_truetype_font(
                black_box(&mut doc),
                black_box(&subset_bytes),
                "Roboto",
                400,
                false,
                None,
            );
            black_box(result).expect("Embedding should succeed");
        });
    });

    group.bench_function("woff_to_pdf_long", |b| {
        b.iter(|| {
            let ttf_bytes =
                decompress_woff(black_box(ROBOTO_WOFF)).expect("WOFF decompression should succeed");

            let (subset_bytes, _) =
                subset_font_core(black_box(&ttf_bytes), None, black_box(CV_TEXT_LONG), false)
                    .expect("Subsetting should succeed");

            let mut doc = Document::with_version("1.7");
            let result = embed_truetype_font(
                black_box(&mut doc),
                black_box(&subset_bytes),
                "Roboto",
                400,
                false,
                None,
            );
            black_box(result).expect("Embedding should succeed");
        });
    });

    // Alternative pipeline: Direct TTF → Subset → Embed (skip decompression)
    group.bench_function("ttf_to_pdf_medium", |b| {
        b.iter(|| {
            let (subset_bytes, _) = subset_font_core(
                black_box(ROBOTO_TTF),
                None,
                black_box(CV_TEXT_MEDIUM),
                false,
            )
            .expect("Subsetting should succeed");

            let mut doc = Document::with_version("1.7");
            let result = embed_truetype_font(
                black_box(&mut doc),
                black_box(&subset_bytes),
                "Roboto",
                400,
                false,
                None,
            );
            black_box(result).expect("Embedding should succeed");
        });
    });

    group.finish();
}

/// Benchmark: Subset-Only Pipeline (for comparison)
/// Useful to isolate subsetting performance impact
fn bench_subset_only_pipeline(c: &mut Criterion) {
    let mut group = c.benchmark_group("subset_only");

    group.bench_function("roboto_medium_cv", |b| {
        b.iter(|| {
            let result = subset_font_core(
                black_box(ROBOTO_TTF),
                None,
                black_box(CV_TEXT_MEDIUM),
                false,
            )
            .map(|(bytes, _)| bytes);
            black_box(result).expect("Subsetting should succeed");
        });
    });

    group.finish();
}

criterion_group!(
    benches,
    bench_woff_decompression,
    bench_woff2_decompression,
    bench_font_subsetting,
    bench_font_embedding,
    bench_full_pipeline,
    bench_subset_only_pipeline,
);

criterion_main!(benches);
