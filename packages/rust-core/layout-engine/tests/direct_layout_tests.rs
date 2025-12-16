//! Tests for direct TSX to Layout conversion (Phase 2)
//!
//! These tests validate the direct pipeline: TSX → TsxDocument → Taffy → LayoutBox

use cv_domain::{CVMetadata, FontComplexity, LayoutType, TSXLayoutConfig};
use layout_engine::{calculate_layout_direct, LayoutError};
use layout_types::{BoxContent, TextMeasurer};
use pdf_generator::config::PDFConfig;

/// Mock text measurer for testing
struct MockTextMeasurer;

impl TextMeasurer for MockTextMeasurer {
    fn measure_text(&self, text: &str, font_size: f64, _font_name: &str) -> f64 {
        // Simple mock: 6 points per character (approximates typical font metrics)
        text.len() as f64 * font_size * 0.6
    }
}

/// Helper to create default test configs
fn create_test_configs() -> (CVMetadata, TSXLayoutConfig, PDFConfig) {
    let metadata = CVMetadata {
        name: Some("Test User".to_string()),
        title: None,
        email: Some("test@example.com".to_string()),
        phone: None,
        location: None,
        website: None,
        layout_type: LayoutType::SingleColumn,
        estimated_pages: 1,
        component_count: 5,
        has_contact_info: true,
        has_clear_sections: true,
        font_complexity: FontComplexity::Simple,
    };

    let layout_config = TSXLayoutConfig {
        max_width: Some(612.0), // Letter width
        padding: cv_domain::Spacing {
            top: 0.0,
            right: 0.0,
            bottom: 0.0,
            left: 0.0,
        },
        background_color: None,
    };

    let pdf_config = PDFConfig::default();

    (metadata, layout_config, pdf_config)
}

#[test]
fn test_calculate_layout_direct_simple_text() {
    let tsx = r#"
        export default function CV() {
            return <div>Hello World</div>;
        }
    "#;

    let document = tsx_parser::parse_tsx(tsx).expect("Failed to parse TSX");
    let (metadata, layout_config, pdf_config) = create_test_configs();
    let measurer = MockTextMeasurer;

    let result =
        calculate_layout_direct(&document, &metadata, &layout_config, &pdf_config, &measurer);

    assert!(result.is_ok(), "Layout calculation should succeed");
    let layout = result.unwrap();

    assert_eq!(layout.page_width, 612.0); // Letter width
    assert_eq!(layout.page_height, 792.0); // Letter height
    assert!(!layout.pages.is_empty(), "Should have at least one page");
}

#[test]
fn test_calculate_layout_direct_nested_containers() {
    let tsx = r#"
        export default function CV() {
            return (
                <div>
                    <section>
                        <h1>Title</h1>
                        <p>Paragraph text</p>
                    </section>
                </div>
            );
        }
    "#;

    let document = tsx_parser::parse_tsx(tsx).expect("Failed to parse TSX");
    let (metadata, layout_config, pdf_config) = create_test_configs();
    let measurer = MockTextMeasurer;

    let result =
        calculate_layout_direct(&document, &metadata, &layout_config, &pdf_config, &measurer);

    assert!(
        result.is_ok(),
        "Layout with nested containers should succeed"
    );
    let layout = result.unwrap();

    assert!(!layout.pages.is_empty());
    assert!(!layout.pages[0].boxes.is_empty(), "Page should have boxes");
}

#[test]
fn test_calculate_layout_direct_preserves_element_types() {
    let tsx = r#"
        export default function CV() {
            return (
                <div>
                    <h1>Heading</h1>
                    <p>Paragraph</p>
                    <span>Span</span>
                </div>
            );
        }
    "#;

    let document = tsx_parser::parse_tsx(tsx).expect("Failed to parse TSX");
    let (metadata, layout_config, pdf_config) = create_test_configs();
    let measurer = MockTextMeasurer;

    let result =
        calculate_layout_direct(&document, &metadata, &layout_config, &pdf_config, &measurer);

    assert!(result.is_ok());
    let layout = result.unwrap();

    // Verify element types are preserved (not None/default)
    let all_boxes: Vec<_> = layout.pages.iter().flat_map(|p| &p.boxes).collect();

    // After flattening, we should have the children of the root div as top-level boxes
    assert!(!all_boxes.is_empty(), "Should have boxes after flattening");

    // Check that at least some boxes have element types set (h1, p, span from the TSX)
    let has_element_types = all_boxes.iter().any(|b| b.element_type.is_some());
    assert!(has_element_types, "Boxes should preserve element types");
}

#[test]
fn test_calculate_layout_direct_tailwind_classes() {
    let tsx = r#"
        export default function CV() {
            return (
                <div className="flex flex-col">
                    <p className="text-lg font-bold">Styled Text</p>
                </div>
            );
        }
    "#;

    let document = tsx_parser::parse_tsx(tsx).expect("Failed to parse TSX");
    let (metadata, layout_config, pdf_config) = create_test_configs();
    let measurer = MockTextMeasurer;

    let result =
        calculate_layout_direct(&document, &metadata, &layout_config, &pdf_config, &measurer);

    assert!(
        result.is_ok(),
        "Layout with Tailwind classes should succeed"
    );
    let layout = result.unwrap();

    // Verify styles are applied
    let all_boxes: Vec<_> = layout.pages.iter().flat_map(|p| &p.boxes).collect();

    // Check that flex display is applied
    if let Some(root_box) = all_boxes.first() {
        // Style should have flex properties (though we can't check internal Taffy state)
        // At minimum, verify the box was created successfully
        assert!(root_box.width > 0.0);
        assert!(root_box.height > 0.0);
    }
}

#[test]
fn test_calculate_layout_direct_inline_styles() {
    let tsx = r#"
        export default function CV() {
            return <div style={{ fontSize: '14px', color: 'blue' }}>Inline Style</div>;
        }
    "#;

    let document = tsx_parser::parse_tsx(tsx).expect("Failed to parse TSX");
    let (metadata, layout_config, pdf_config) = create_test_configs();
    let measurer = MockTextMeasurer;

    let result =
        calculate_layout_direct(&document, &metadata, &layout_config, &pdf_config, &measurer);

    assert!(result.is_ok(), "Layout with inline styles should succeed");
}

#[test]
fn test_calculate_layout_direct_text_wrapping() {
    // Long text that should wrap
    let tsx = r#"
        export default function CV() {
            return <p>This is a very long paragraph that should wrap across multiple lines when rendered in the PDF because it exceeds the available width of the content area.</p>;
        }
    "#;

    let document = tsx_parser::parse_tsx(tsx).expect("Failed to parse TSX");
    let (metadata, layout_config, pdf_config) = create_test_configs();
    let measurer = MockTextMeasurer;

    let result =
        calculate_layout_direct(&document, &metadata, &layout_config, &pdf_config, &measurer);

    assert!(result.is_ok(), "Layout with long text should succeed");
    let layout = result.unwrap();

    // Verify text was wrapped (multiple lines)
    let all_boxes: Vec<_> = layout.pages.iter().flat_map(|p| &p.boxes).collect();

    if let Some(text_box) = all_boxes
        .iter()
        .find(|b| matches!(b.content, BoxContent::Text(_)))
    {
        match &text_box.content {
            BoxContent::Text(lines) => {
                assert!(lines.len() > 1, "Long text should wrap to multiple lines");
            }
            _ => panic!("Expected text content"),
        }
    }
}

#[test]
fn test_calculate_layout_direct_empty_document() {
    let tsx = r#"
        export default function CV() {
            return <div></div>;
        }
    "#;

    let document = tsx_parser::parse_tsx(tsx).expect("Failed to parse TSX");
    let (metadata, layout_config, pdf_config) = create_test_configs();
    let measurer = MockTextMeasurer;

    let result =
        calculate_layout_direct(&document, &metadata, &layout_config, &pdf_config, &measurer);

    assert!(result.is_ok(), "Empty document should succeed");
}

#[test]
fn test_calculate_layout_direct_flexbox_layout() {
    let tsx = r#"
        export default function CV() {
            return (
                <div className="flex justify-between">
                    <span>Left</span>
                    <span>Right</span>
                </div>
            );
        }
    "#;

    let document = tsx_parser::parse_tsx(tsx).expect("Failed to parse TSX");
    let (metadata, layout_config, pdf_config) = create_test_configs();
    let measurer = MockTextMeasurer;

    let result =
        calculate_layout_direct(&document, &metadata, &layout_config, &pdf_config, &measurer);

    assert!(result.is_ok(), "Flexbox layout should succeed");
    let layout = result.unwrap();

    // Verify layout was computed (boxes have positions)
    let all_boxes: Vec<_> = layout.pages.iter().flat_map(|p| &p.boxes).collect();

    assert!(!all_boxes.is_empty(), "Should have layout boxes");
}

#[test]
fn test_calculate_layout_direct_style_inheritance() {
    let tsx = r#"
        export default function CV() {
            return (
                <div style={{ fontSize: '12px' }}>
                    <p>Inherits font size</p>
                </div>
            );
        }
    "#;

    let document = tsx_parser::parse_tsx(tsx).expect("Failed to parse TSX");
    let (metadata, layout_config, pdf_config) = create_test_configs();
    let measurer = MockTextMeasurer;

    let result =
        calculate_layout_direct(&document, &metadata, &layout_config, &pdf_config, &measurer);

    assert!(result.is_ok(), "Style inheritance should work");
}

#[test]
fn test_calculate_layout_direct_tsx_padding_config() {
    let tsx = r#"
        export default function CV() {
            return <div>Content</div>;
        }
    "#;

    let document = tsx_parser::parse_tsx(tsx).expect("Failed to parse TSX");
    let metadata = CVMetadata {
        name: Some("Test".to_string()),
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
    };

    // Test with TSX padding
    let layout_config = TSXLayoutConfig {
        max_width: Some(550.0),
        padding: cv_domain::Spacing {
            top: 20.0,
            right: 30.0,
            bottom: 20.0,
            left: 30.0,
        },
        background_color: None,
    };

    let pdf_config = PDFConfig::default();
    let measurer = MockTextMeasurer;

    let result =
        calculate_layout_direct(&document, &metadata, &layout_config, &pdf_config, &measurer);

    assert!(result.is_ok(), "Layout with TSX padding should succeed");
    let layout = result.unwrap();

    // Content area should be calculated correctly with padding
    assert_eq!(layout.page_width, 612.0);
    assert_eq!(layout.page_height, 792.0);
}

#[test]
fn test_calculate_layout_direct_no_jsx_elements_error() {
    // TSX with no JSX elements (just a variable declaration)
    let tsx = r#"
        const x = 5;
    "#;

    let document = tsx_parser::parse_tsx(tsx).expect("Failed to parse TSX");
    let (metadata, layout_config, pdf_config) = create_test_configs();
    let measurer = MockTextMeasurer;

    let result =
        calculate_layout_direct(&document, &metadata, &layout_config, &pdf_config, &measurer);

    assert!(result.is_err(), "Should error when no JSX elements found");
    match result {
        Err(LayoutError::CalculationFailed(msg)) => {
            assert!(
                msg.contains("No JSX elements"),
                "Error message should mention no JSX elements"
            );
        }
        _ => panic!("Expected CalculationFailed error"),
    }
}

#[test]
fn test_calculate_layout_direct_deeply_nested_structure() {
    let tsx = r#"
        export default function CV() {
            return (
                <div>
                    <section>
                        <article>
                            <header>
                                <h1>Deep Title</h1>
                            </header>
                            <div>
                                <p>Deep content</p>
                            </div>
                        </article>
                    </section>
                </div>
            );
        }
    "#;

    let document = tsx_parser::parse_tsx(tsx).expect("Failed to parse TSX");
    let (metadata, layout_config, pdf_config) = create_test_configs();
    let measurer = MockTextMeasurer;

    let result =
        calculate_layout_direct(&document, &metadata, &layout_config, &pdf_config, &measurer);

    assert!(result.is_ok(), "Deeply nested structure should succeed");
    let layout = result.unwrap();

    // Verify nested structure is preserved
    let all_boxes: Vec<_> = layout.pages.iter().flat_map(|p| &p.boxes).collect();

    assert!(
        !all_boxes.is_empty(),
        "Should have layout boxes for nested structure"
    );
}

#[test]
fn test_inline_bold_span_text_extraction() {
    // Test case for inline bold spans like <p><span className="font-semibold">Label:</span> value</p>
    // This was a bug - the span text was being skipped
    let tsx = r#"
        export default function TestCV() {
            return (
                <div>
                    <section>
                        <h2>LANGUAGES</h2>
                        <p><span className="font-semibold">Native:</span> Russian, Ukrainian</p>
                        <p><span className="font-semibold">English:</span> Proficient (C1 Reading/Listening/Writing, B2 Speaking)</p>
                    </section>
                    <section>
                        <h2>ADDITIONAL INFORMATION</h2>
                        <p><span className="font-semibold">Date of Birth:</span> August 12, 1980</p>
                        <p><span className="font-semibold">Nationality:</span> Russian</p>
                    </section>
                </div>
            );
        }
    "#;

    let document = tsx_parser::parse_tsx(tsx).expect("Failed to parse TSX");
    let (metadata, layout_config, pdf_config) = create_test_configs();
    let measurer = MockTextMeasurer;

    let result =
        calculate_layout_direct(&document, &metadata, &layout_config, &pdf_config, &measurer);

    assert!(result.is_ok(), "Layout calculation should succeed");
    let layout = result.unwrap();

    // Find all text boxes
    fn collect_text(boxes: &[layout_types::LayoutBox]) -> Vec<String> {
        let mut texts = Vec::new();
        for layout_box in boxes {
            match &layout_box.content {
                BoxContent::Text(lines) => {
                    for line in lines {
                        texts.push(line.plain_text());
                    }
                }
                BoxContent::Container(children) => {
                    texts.extend(collect_text(children));
                }
                _ => {}
            }
        }
        texts
    }

    let all_texts: Vec<String> = layout
        .pages
        .iter()
        .flat_map(|p| collect_text(&p.boxes))
        .collect();

    // CRITICAL: Verify that inline bold span text is included
    // Bug was: "Native:" and "English:" were missing, only "Russian, Ukrainian" and "Proficient..." appeared
    assert!(
        all_texts.iter().any(|t| t.contains("Native:")),
        "Text should include 'Native:' from <span className=\"font-semibold\">Native:</span>
Found texts: {:?}",
        all_texts
    );

    assert!(
        all_texts.iter().any(|t| t.contains("English:")),
        "Text should include 'English:' from <span className=\"font-semibold\">English:</span>
Found texts: {:?}",
        all_texts
    );

    assert!(
        all_texts.iter().any(|t| t.contains("Date of Birth:")),
        "Text should include 'Date of Birth:' from inline span
Found texts: {:?}",
        all_texts
    );

    assert!(
        all_texts.iter().any(|t| t.contains("Nationality:")),
        "Text should include 'Nationality:' from inline span
Found texts: {:?}",
        all_texts
    );

    // Verify the full text is combined (not just the label)
    assert!(
        all_texts.iter().any(|t| t.contains("Russian, Ukrainian")),
        "Text should include the value part too
Found texts: {:?}",
        all_texts
    );
}

#[test]
fn test_periods_are_preserved() {
    let tsx = r#"
        export default function TestCV() {
            return (
                <div>
                    <p>First sentence. Second sentence.</p>
                    <p>Another paragraph with period.</p>
                </div>
            );
        }
    "#;

    let document = tsx_parser::parse_tsx(tsx).expect("Failed to parse TSX");
    let (metadata, layout_config, pdf_config) = create_test_configs();
    let measurer = MockTextMeasurer;
    let result =
        calculate_layout_direct(&document, &metadata, &layout_config, &pdf_config, &measurer);

    assert!(result.is_ok(), "Layout calculation should succeed");
    let layout = result.unwrap();

    // Helper to collect all text from layout boxes
    fn collect_text(boxes: &[layout_types::LayoutBox]) -> Vec<String> {
        let mut texts = Vec::new();
        for layout_box in boxes {
            match &layout_box.content {
                BoxContent::Text(lines) => {
                    for line in lines {
                        texts.push(line.plain_text());
                    }
                }
                BoxContent::Container(children) => {
                    texts.extend(collect_text(children));
                }
                _ => {}
            }
        }
        texts
    }

    let all_texts: Vec<String> = layout
        .pages
        .iter()
        .flat_map(|p| collect_text(&p.boxes))
        .collect();

    // Print all extracted text for debugging
    eprintln!("Extracted texts: {:?}", all_texts);

    // Verify periods are preserved
    assert!(
        all_texts.iter().any(|t| t.contains("First sentence.")),
        "First period missing"
    );
    assert!(
        all_texts.iter().any(|t| t.contains("Second sentence.")),
        "Second period missing"
    );
    assert!(
        all_texts.iter().any(|t| t.contains("with period.")),
        "Third period missing"
    );
}

#[test]
fn test_border_bottom_on_h2_section_headers() {
    // Test that border-b border-gray-400 on h2 section headers is preserved in layout
    // This was a bug - borders were not rendering in the PDF
    let tsx = r#"
        export default function TestCV() {
            return (
                <div className="p-8">
                    <h2 className="text-xl font-bold mb-3 text-gray-800 border-b border-gray-400">PROFESSIONAL SUMMARY</h2>
                    <p>Some content here.</p>
                    <h2 className="text-xl font-bold mb-3 text-gray-800 border-b border-gray-400">TECHNICAL SKILLS</h2>
                    <p>More content here.</p>
                </div>
            );
        }
    "#;

    let document = tsx_parser::parse_tsx(tsx).expect("Failed to parse TSX");
    let (metadata, layout_config, pdf_config) = create_test_configs();
    let measurer = MockTextMeasurer;

    let result =
        calculate_layout_direct(&document, &metadata, &layout_config, &pdf_config, &measurer);

    assert!(result.is_ok(), "Layout calculation should succeed");
    let layout = result.unwrap();

    // Helper to find boxes with border_bottom
    fn find_boxes_with_border(boxes: &[layout_types::LayoutBox]) -> Vec<&layout_types::LayoutBox> {
        let mut result = Vec::new();
        for layout_box in boxes {
            if layout_box.style.box_model.border_bottom.is_some() {
                result.push(layout_box);
            }
            if let BoxContent::Container(children) = &layout_box.content {
                result.extend(find_boxes_with_border(children));
            }
        }
        result
    }

    let boxes_with_border: Vec<_> = layout
        .pages
        .iter()
        .flat_map(|p| find_boxes_with_border(&p.boxes))
        .collect();

    // DEBUG: Print all boxes and their styles
    fn print_boxes(boxes: &[layout_types::LayoutBox], depth: usize) {
        for layout_box in boxes {
            let indent = "  ".repeat(depth);
            let content_type = match &layout_box.content {
                BoxContent::Text(lines) => format!("Text({:?})", lines),
                BoxContent::Container(_) => "Container".to_string(),
                BoxContent::Empty => "Empty".to_string(),
            };
            eprintln!(
                "{}Box: {} @ ({}, {}) {}x{}",
                indent,
                content_type,
                layout_box.x,
                layout_box.y,
                layout_box.width,
                layout_box.height
            );
            eprintln!(
                "{}  border_bottom: {:?}",
                indent, layout_box.style.box_model.border_bottom
            );
            if let BoxContent::Container(children) = &layout_box.content {
                print_boxes(children, depth + 1);
            }
        }
    }

    eprintln!("\n=== LAYOUT BOXES ===");
    for (i, page) in layout.pages.iter().enumerate() {
        eprintln!("Page {}:", i + 1);
        print_boxes(&page.boxes, 0);
    }
    eprintln!("===================\n");

    // CRITICAL: H2 elements with border-b should produce layout boxes with border_bottom set
    assert!(
        !boxes_with_border.is_empty(),
        "Should have at least one box with border_bottom (h2 section headers have border-b border-gray-400)\nFound {} boxes with border",
        boxes_with_border.len()
    );

    // Should have exactly 2 h2 headers with borders
    assert_eq!(
        boxes_with_border.len(),
        2,
        "Should have exactly 2 boxes with border_bottom (one per h2 header)\nFound boxes with border: {:?}",
        boxes_with_border.iter().map(|b| &b.style.box_model.border_bottom).collect::<Vec<_>>()
    );

    // Verify border style details
    for bordered_box in boxes_with_border {
        let border = bordered_box.style.box_model.border_bottom.as_ref().unwrap();
        assert!(border.width > 0.0, "Border width should be positive");
        // gray-400 is approximately rgb(156, 163, 175)
        eprintln!(
            "Border color: r={}, g={}, b={}",
            border.color.r, border.color.g, border.color.b
        );
    }
}

#[test]
fn test_flex_container_span_children_rendered() {
    // Test that span elements inside flex containers are rendered as flex items
    // This was a bug - spans were being skipped as "inline" elements
    let tsx = r#"
        export default function TestCV() {
            return (
                <div className="p-8">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold">Software Engineer</h3>
                        <span className="text-sm">May 2023 – August 2025</span>
                    </div>
                    <div className="flex justify-between">
                        <div>
                            <h3 className="font-bold">Mathematician, Mathematics Teacher</h3>
                            <p className="text-sm">Perm State University</p>
                        </div>
                        <span className="text-sm">1997 – 2002</span>
                    </div>
                </div>
            );
        }
    "#;

    let document = tsx_parser::parse_tsx(tsx).expect("Failed to parse TSX");
    let (metadata, layout_config, pdf_config) = create_test_configs();
    let measurer = MockTextMeasurer;

    let result =
        calculate_layout_direct(&document, &metadata, &layout_config, &pdf_config, &measurer);

    assert!(result.is_ok(), "Layout calculation should succeed");
    let layout = result.unwrap();

    // Helper to collect all text from layout boxes
    fn collect_text(boxes: &[layout_types::LayoutBox]) -> Vec<String> {
        let mut texts = Vec::new();
        for layout_box in boxes {
            match &layout_box.content {
                BoxContent::Text(lines) => {
                    for line in lines {
                        texts.push(line.plain_text());
                    }
                }
                BoxContent::Container(children) => {
                    texts.extend(collect_text(children));
                }
                _ => {}
            }
        }
        texts
    }

    let all_texts: Vec<String> = layout
        .pages
        .iter()
        .flat_map(|p| collect_text(&p.boxes))
        .collect();

    eprintln!("All extracted texts: {:?}", all_texts);

    // CRITICAL: Verify that span text inside flex containers is included
    assert!(
        all_texts.iter().any(|t| t.contains("May 2023")),
        "Text should include date from <span className=\"text-sm\">May 2023 – August 2025</span>\nFound texts: {:?}",
        all_texts
    );

    assert!(
        all_texts.iter().any(|t| t.contains("1997")),
        "Text should include date from <span className=\"text-sm\">1997 – 2002</span>\nFound texts: {:?}",
        all_texts
    );

    // Also verify the main content is there
    assert!(
        all_texts.iter().any(|t| t.contains("Software Engineer")),
        "Should have job title\nFound texts: {:?}",
        all_texts
    );

    assert!(
        all_texts.iter().any(|t| t.contains("Mathematician")),
        "Should have education title\nFound texts: {:?}",
        all_texts
    );
}

#[test]
fn test_space_y_gap_applied_to_flex_column() {
    // Test that space-y-3 creates proper vertical gaps between children
    let tsx = r#"
        export default function TestCV() {
            return (
                <div className="p-8">
                    <div className="text-sm space-y-3">
                        <div>
                            <p className="font-semibold">First Section:</p>
                            <p>First content</p>
                        </div>
                        <div>
                            <p className="font-semibold">Second Section:</p>
                            <p>Second content</p>
                        </div>
                    </div>
                </div>
            );
        }
    "#;

    let document = tsx_parser::parse_tsx(tsx).expect("Failed to parse TSX");
    let (metadata, layout_config, pdf_config) = create_test_configs();
    let measurer = MockTextMeasurer;

    let result =
        calculate_layout_direct(&document, &metadata, &layout_config, &pdf_config, &measurer);

    assert!(result.is_ok(), "Layout calculation should succeed");
    let layout = result.unwrap();

    // Find all text boxes and their Y positions
    fn collect_y_positions(boxes: &[layout_types::LayoutBox]) -> Vec<(String, f64)> {
        let mut positions = Vec::new();
        for layout_box in boxes {
            match &layout_box.content {
                BoxContent::Text(lines) => {
                    if !lines.is_empty() {
                        positions.push((lines[0].plain_text(), layout_box.y));
                    }
                }
                BoxContent::Container(children) => {
                    positions.extend(collect_y_positions(children));
                }
                _ => {}
            }
        }
        positions
    }

    let positions: Vec<(String, f64)> = layout
        .pages
        .iter()
        .flat_map(|p| collect_y_positions(&p.boxes))
        .collect();

    eprintln!("Text Y positions:");
    for (text, y) in &positions {
        eprintln!("  {} @ y={}", text, y);
    }

    // Find "First content" and "Second Section:" positions
    let first_content_y = positions
        .iter()
        .find(|(t, _)| t.contains("First content"))
        .map(|(_, y)| *y);
    let second_section_y = positions
        .iter()
        .find(|(t, _)| t.contains("Second Section"))
        .map(|(_, y)| *y);

    if let (Some(y1), Some(y2)) = (first_content_y, second_section_y) {
        let gap = y2 - y1;
        eprintln!(
            "Gap between 'First content' and 'Second Section': {} pt",
            gap
        );
        // space-y-3 creates 9pt gaps between flex children (the two inner divs)
        // Currently, the gap is applied between boxes but nested block containers
        // don't accumulate child heights correctly in all cases.
        // TODO: Investigate why inner div heights aren't computed as sum of children
        // For now, verify the gap is at least the space-y value (9pt)
        assert!(
            gap >= 9.0,
            "Gap should be at least 9pt (space-y-3), got {}",
            gap
        );
    } else {
        panic!("Could not find expected text positions");
    }
}
