use criterion::{criterion_group, criterion_main, BenchmarkId, Criterion};
use layout_types::{BoxContent, ElementType, LayoutBox, LayoutStructure, Page};
use pdf_generator::{PDFConfig, PDFGenerator, StyleDeclaration};
use std::hint::black_box;

/// Create a simple single-page layout for benchmarking
fn create_single_page_layout() -> LayoutStructure {
    let boxes = vec![
        // Header with name
        LayoutBox {
            x: 72.0,
            y: 720.0,
            width: 468.0,
            height: 30.0,
            content: BoxContent::Text(vec!["John Doe".to_string().into()]),
            style: StyleDeclaration::default(),
            element_type: Some(ElementType::Heading1),
        },
        // Contact info
        LayoutBox {
            x: 72.0,
            y: 690.0,
            width: 468.0,
            height: 15.0,
            content: BoxContent::Text(vec!["john.doe@example.com | +1-555-123-4567"
                .to_string()
                .into()]),

            style: StyleDeclaration::default(),
            element_type: Some(ElementType::Paragraph),
        },
        // Experience section
        LayoutBox {
            x: 72.0,
            y: 650.0,
            width: 468.0,
            height: 20.0,
            content: BoxContent::Text(vec!["Experience".to_string().into()]),
            style: StyleDeclaration::default(),
            element_type: Some(ElementType::Heading2),
        },
        // Job 1
        LayoutBox {
            x: 72.0,
            y: 620.0,
            width: 468.0,
            height: 80.0,
            content: BoxContent::Text(vec![
                "Senior Software Engineer\nTech Company Inc.\nJanuary 2020 - Present\n\
                Leading development of cloud-based applications using Rust and TypeScript."
                    .to_string()
                    .into(),
            ]),
            style: StyleDeclaration::default(),
            element_type: Some(ElementType::Div),
        },
        // Education section
        LayoutBox {
            x: 72.0,
            y: 520.0,
            width: 468.0,
            height: 20.0,
            content: BoxContent::Text(vec!["Education".to_string().into()]),
            style: StyleDeclaration::default(),
            element_type: Some(ElementType::Heading2),
        },
        // Degree
        LayoutBox {
            x: 72.0,
            y: 490.0,
            width: 468.0,
            height: 40.0,
            content: BoxContent::Text(vec![
                "Bachelor of Science in Computer Science\nUniversity of Technology\n2016 - 2020"
                    .to_string()
                    .into(),
            ]),
            style: StyleDeclaration::default(),
            element_type: Some(ElementType::Paragraph),
        },
    ];

    LayoutStructure {
        page_width: 612.0,  // 8.5 inches
        page_height: 792.0, // 11 inches (US Letter)
        pages: vec![Page {
            page_number: 1,
            boxes,
        }],
    }
}

/// Create a multi-page layout for benchmarking (3 pages)
fn create_multi_page_layout() -> LayoutStructure {
    let mut pages = Vec::new();

    for page_num in 1..=3 {
        let y_offset = 0.0;
        let boxes = vec![
            LayoutBox {
                x: 72.0,
                y: 720.0 - y_offset,
                width: 468.0,
                height: 30.0,
                content: BoxContent::Text(vec![format!("Page {} Content", page_num).into()]),
                style: StyleDeclaration::default(),
                element_type: Some(ElementType::Heading1),
            },
            LayoutBox {
                x: 72.0,
                y: 690.0 - y_offset,
                width: 468.0,
                height: 400.0,
                content: BoxContent::Text(vec![
                    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. \
                    Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. \
                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. \
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum."
                        .repeat(5)
                        .into(),
                ]),
                style: StyleDeclaration::default(),
                element_type: Some(ElementType::Paragraph),
            },
        ];

        pages.push(Page {
            page_number: page_num,
            boxes,
        });
    }

    LayoutStructure {
        page_width: 612.0,
        page_height: 792.0,
        pages,
    }
}

/// Benchmark single-page PDF generation
fn bench_single_page_generation(c: &mut Criterion) {
    let layout = create_single_page_layout();
    let config = PDFConfig::default();

    c.bench_function("render_single_page", |b| {
        b.iter(|| {
            let mut generator = PDFGenerator::new(config.clone()).unwrap();
            generator.render_layout(black_box(&layout)).unwrap();
            generator.finalize().unwrap()
        });
    });
}

/// Benchmark multi-page PDF generation
fn bench_multi_page_generation(c: &mut Criterion) {
    let layout = create_multi_page_layout();
    let config = PDFConfig::default();

    c.bench_function("render_multi_page_3", |b| {
        b.iter(|| {
            let mut generator = PDFGenerator::new(config.clone()).unwrap();
            generator.render_layout(black_box(&layout)).unwrap();
            generator.finalize().unwrap()
        });
    });
}

/// Benchmark PDF generation with varying page counts
fn bench_varying_page_counts(c: &mut Criterion) {
    let mut group = c.benchmark_group("varying_page_counts");

    for page_count in [1, 2, 3, 5, 10].iter() {
        let mut pages = Vec::new();
        for page_num in 1..=*page_count {
            pages.push(Page {
                page_number: page_num,
                boxes: vec![
                    LayoutBox {
                        x: 72.0,
                        y: 720.0,
                        width: 468.0,
                        height: 30.0,
                        content: BoxContent::Text(vec![format!("Page {}", page_num).into()]),
                        style: StyleDeclaration::default(),
                        element_type: Some(ElementType::Heading1),
                    },
                    LayoutBox {
                        x: 72.0,
                        y: 690.0,
                        width: 468.0,
                        height: 200.0,
                        content: BoxContent::Text(vec!["Sample content.".repeat(20).into()]),
                        style: StyleDeclaration::default(),
                        element_type: Some(ElementType::Paragraph),
                    },
                ],
            });
        }

        let layout = LayoutStructure {
            page_width: 612.0,
            page_height: 792.0,
            pages,
        };
        let config = PDFConfig::default();

        group.bench_with_input(
            BenchmarkId::from_parameter(page_count),
            page_count,
            |b, _| {
                b.iter(|| {
                    let mut generator = PDFGenerator::new(config.clone()).unwrap();
                    generator.render_layout(black_box(&layout)).unwrap();
                    generator.finalize().unwrap()
                });
            },
        );
    }

    group.finish();
}

/// Benchmark font registration with Google Fonts
/// Note: This only benchmarks the registration overhead, not actual font embedding
/// since we don't have real font bytes in the benchmark
fn bench_font_registration(c: &mut Criterion) {
    let layout = create_single_page_layout();
    let config = PDFConfig::default();

    c.bench_function("font_registration_standard14", |b| {
        b.iter(|| {
            let mut generator = PDFGenerator::new(config.clone()).unwrap();
            // Standard 14 fonts (no embedding needed)
            generator.render_layout(black_box(&layout)).unwrap();
            generator.finalize().unwrap()
        });
    });
}

/// Benchmark content stream generation (layout rendering)
fn bench_content_stream_generation(c: &mut Criterion) {
    use pdf_generator::layout_renderer::render_page_to_content;

    let layout = create_single_page_layout();
    let page = &layout.pages[0];

    c.bench_function("content_stream_single_page", |b| {
        b.iter(|| render_page_to_content(black_box(page), black_box(792.0)).unwrap());
    });
}

/// Benchmark ATS validation
fn bench_ats_validation(c: &mut Criterion) {
    use cv_domain::{CVMetadata, FontComplexity, LayoutType};
    use pdf_generator::ats::validate_ats_compatibility;

    let layout = create_single_page_layout();
    let metadata = CVMetadata {
        name: Some("John Doe".to_string()),
        title: Some("Software Engineer".to_string()),
        email: Some("john@example.com".to_string()),
        phone: Some("+1-555-1234".to_string()),
        location: None,
        website: None,
        layout_type: LayoutType::SingleColumn,
        estimated_pages: 1,
        component_count: 6,
        has_contact_info: true,
        has_clear_sections: true,
        font_complexity: FontComplexity::Simple,
    };

    c.bench_function("ats_validation", |b| {
        b.iter(|| {
            validate_ats_compatibility(
                black_box(&layout),
                black_box(&metadata),
                black_box(true),
                black_box(None),
            )
        });
    });
}

criterion_group!(
    benches,
    bench_single_page_generation,
    bench_multi_page_generation,
    bench_varying_page_counts,
    bench_font_registration,
    bench_content_stream_generation,
    bench_ats_validation
);
criterion_main!(benches);
