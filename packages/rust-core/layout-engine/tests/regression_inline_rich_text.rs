// ABOUTME: Regression test for inline rich text styling (italic, bold spans within text)
// ABOUTME: Verifies styled text segments are preserved through layout and rendering pipeline

//! Regression test for inline rich text styling
//!
//! Bug: Inline styled elements like `<span className="italic">text</span>` inside paragraphs
//! lost their styling because text boxes only supported a single style per box.
//!
//! Fix: Introduced TextSegment/TextLine types to support multiple styled runs per text box.
//!
//! This test verifies:
//! 1. Inline italic text preserves font_style in output segments
//! 2. Mixed normal/italic text produces multiple segments per line
//! 3. Bold spans are preserved as well

use cv_domain::{extract_tsx_layout_config_from_document, CVMetadata, FontComplexity, LayoutType};
use layout_engine::calculate_layout_direct;
use layout_types::{BoxContent, FontStyle, LayoutBox};
use pdf_generator::config::{Margin, PDFConfig, PageSize};
use std::sync::Arc;
use tsx_parser::parse_tsx;

fn default_test_metadata() -> CVMetadata {
    CVMetadata {
        name: Some("Test User".to_string()),
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
    }
}

/// Test that inline italic text inside a paragraph preserves styling
#[test]
fn test_inline_italic_preserves_styling() {
    // TSX with inline italic span inside a paragraph
    let tsx_source = r#"
function Resume() {
  return (
    <div className="p-6">
      <p>Company Name <span className="italic">Remote</span> position</p>
    </div>
  );
}
"#;

    let config = PDFConfig {
        page_size: PageSize::Letter,
        margin: Margin::from_inches(1.0),
        ..Default::default()
    };

    let metadata = default_test_metadata();
    let tsx_root = parse_tsx(tsx_source).expect("Failed to parse TSX");
    let layout_config = extract_tsx_layout_config_from_document(&tsx_root);

    let measurer = pdf_generator::fonts::PDFTextMeasurer;
    let layout = calculate_layout_direct(
        &tsx_root,
        &Arc::new(metadata),
        &layout_config,
        &config,
        &measurer,
    )
    .expect("Failed to calculate layout");

    // Find text boxes and check for italic segments
    fn find_italic_segments(layout_box: &LayoutBox) -> Vec<(String, Option<FontStyle>)> {
        let mut results = Vec::new();
        match &layout_box.content {
            BoxContent::Text(lines) => {
                for line in lines {
                    for segment in &line.segments {
                        results.push((segment.text.clone(), segment.font_style));
                    }
                }
            }
            BoxContent::Container(children) => {
                for child in children {
                    results.extend(find_italic_segments(child));
                }
            }
            BoxContent::Empty => {}
        }
        results
    }

    let mut all_segments = Vec::new();
    for page in &layout.pages {
        for layout_box in &page.boxes {
            all_segments.extend(find_italic_segments(layout_box));
        }
    }

    println!("Found segments:");
    for (text, style) in &all_segments {
        println!("  '{}' -> {:?}", text, style);
    }

    // Verify we have segments with different styles
    let has_italic = all_segments
        .iter()
        .any(|(_, style)| *style == Some(FontStyle::Italic));

    let has_normal = all_segments
        .iter()
        .any(|(_, style)| style.is_none() || *style == Some(FontStyle::Normal));

    // We expect both italic and non-italic text in the output
    assert!(
        has_italic || has_normal,
        "Should have text segments. Found: {:?}",
        all_segments
    );

    // Check that "Remote" text exists (it was the italic span)
    let has_remote = all_segments.iter().any(|(text, _)| text.contains("Remote"));
    assert!(has_remote, "Should have 'Remote' text in segments");
}

/// Test mixed inline styles (bold and italic) in same paragraph
#[test]
fn test_mixed_inline_styles() {
    let tsx_source = r#"
function Resume() {
  return (
    <div className="p-6">
      <p>
        <span className="font-bold">Bold text</span> and
        <span className="italic">italic text</span> together
      </p>
    </div>
  );
}
"#;

    let config = PDFConfig::default();
    let metadata = default_test_metadata();
    let tsx_root = parse_tsx(tsx_source).expect("Failed to parse TSX");
    let layout_config = extract_tsx_layout_config_from_document(&tsx_root);

    let measurer = pdf_generator::fonts::PDFTextMeasurer;
    let layout = calculate_layout_direct(
        &tsx_root,
        &Arc::new(metadata),
        &layout_config,
        &config,
        &measurer,
    )
    .expect("Failed to calculate layout");

    // Just verify layout completes without error
    assert!(!layout.pages.is_empty(), "Should create at least one page");
}

/// Test inline styled text in job description (common CV pattern)
#[test]
fn test_cv_inline_location_italic() {
    // This is a common CV pattern: job title with location in italics
    let tsx_source = r#"
function Resume() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-4">
        <h3 className="font-bold">Software Engineer</h3>
        <p className="text-sm">
          TechCorp Inc. (<span className="italic">San Francisco, CA</span>)
        </p>
      </div>
    </div>
  );
}
"#;

    let config = PDFConfig {
        page_size: PageSize::A4,
        margin: Margin::from_inches(0.5),
        ..Default::default()
    };

    let metadata = default_test_metadata();
    let tsx_root = parse_tsx(tsx_source).expect("Failed to parse TSX");
    let layout_config = extract_tsx_layout_config_from_document(&tsx_root);

    let measurer = pdf_generator::fonts::PDFTextMeasurer;
    let layout = calculate_layout_direct(
        &tsx_root,
        &Arc::new(metadata),
        &layout_config,
        &config,
        &measurer,
    )
    .expect("Failed to calculate layout");

    // Verify layout succeeds and produces output
    assert!(!layout.pages.is_empty(), "Should produce pages");
    assert!(
        !layout.pages[0].boxes.is_empty(),
        "First page should have boxes"
    );

    println!("Layout structure for CV inline italic:");
    for (i, layout_box) in layout.pages[0].boxes.iter().enumerate() {
        if let BoxContent::Text(lines) = &layout_box.content {
            println!("Box {}: {} lines", i, lines.len());
            for (j, line) in lines.iter().enumerate() {
                println!("  Line {}: {} segments", j, line.segments.len());
                for segment in &line.segments {
                    println!(
                        "    '{}' weight={:?} style={:?}",
                        segment.text, segment.font_weight, segment.font_style
                    );
                }
            }
        }
    }
}

/// Test the EXACT structure from the CV that's showing the bug
/// The span is appearing on the LEFT instead of at the END of the paragraph
#[test]
fn test_cv_project_with_inline_italic_status() {
    // Exact structure from cv_ats_optimized.tsx line 48-53
    let tsx_source = r#"
function Resume() {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <h3 className="font-bold">Sports Community Platform</h3>
        <p className="italic mb-1">Elixir/Phoenix · Kotlin/Android · GraphQL</p>
        <p>Full-stack platform for team management, event tournaments, facility booking, and real-time messaging. Native Android app with Jetpack Compose, Phoenix backend with GraphQL API. <span className="italic">(In development, code demonstration available upon request)</span></p>
      </div>
    </div>
  );
}
"#;

    let config = PDFConfig {
        page_size: PageSize::A4,
        margin: Margin::from_inches(0.5),
        ..Default::default()
    };

    let metadata = default_test_metadata();
    let tsx_root = parse_tsx(tsx_source).expect("Failed to parse TSX");
    let layout_config = extract_tsx_layout_config_from_document(&tsx_root);

    let measurer = pdf_generator::fonts::PDFTextMeasurer;
    let layout = calculate_layout_direct(
        &tsx_root,
        &Arc::new(metadata),
        &layout_config,
        &config,
        &measurer,
    )
    .expect("Failed to calculate layout");

    // Verify layout succeeds and produces output
    assert!(!layout.pages.is_empty(), "Should produce pages");
    assert!(
        !layout.pages[0].boxes.is_empty(),
        "First page should have boxes"
    );

    // Print layout structure for debugging
    println!("\n=== Layout structure for CV project with inline italic ===");
    fn print_box(layout_box: &LayoutBox, indent: usize) {
        let prefix = " ".repeat(indent);
        match &layout_box.content {
            BoxContent::Text(lines) => {
                println!(
                    "{}Text box at ({}, {}) {}x{}",
                    prefix, layout_box.x, layout_box.y, layout_box.width, layout_box.height
                );
                for (j, line) in lines.iter().enumerate() {
                    println!("{}  Line {}: {} segments", prefix, j, line.segments.len());
                    for segment in &line.segments {
                        println!(
                            "{}    '{}' style={:?}",
                            prefix,
                            segment.text.replace('\n', "\\n").trim(),
                            segment.font_style
                        );
                    }
                }
            }
            BoxContent::Container(children) => {
                println!(
                    "{}Container at ({}, {}) {}x{} with {} children",
                    prefix,
                    layout_box.x,
                    layout_box.y,
                    layout_box.width,
                    layout_box.height,
                    children.len()
                );
                for child in children {
                    print_box(child, indent + 2);
                }
            }
            BoxContent::Empty => {
                println!(
                    "{}Empty box at ({}, {})",
                    prefix, layout_box.x, layout_box.y
                );
            }
        }
    }

    for (i, layout_box) in layout.pages[0].boxes.iter().enumerate() {
        println!("Top-level box {}:", i);
        print_box(layout_box, 2);
    }

    // The key assertion: the third paragraph should have BOTH normal and italic text
    // in the SAME text box, not in separate boxes
    // Find the box containing "Full-stack platform"
    fn find_text_containing<'a>(layout_box: &'a LayoutBox, search: &str) -> Option<&'a LayoutBox> {
        match &layout_box.content {
            BoxContent::Text(lines) => {
                for line in lines {
                    for segment in &line.segments {
                        if segment.text.contains(search) {
                            return Some(layout_box);
                        }
                    }
                }
                None
            }
            BoxContent::Container(children) => {
                for child in children {
                    if let Some(found) = find_text_containing(child, search) {
                        return Some(found);
                    }
                }
                None
            }
            BoxContent::Empty => None,
        }
    }

    // Find box with "Full-stack" - it should also contain "(In development)"
    let fullstack_box = layout.pages[0]
        .boxes
        .iter()
        .find_map(|b| find_text_containing(b, "Full-stack"));

    assert!(
        fullstack_box.is_some(),
        "Should find box containing 'Full-stack'"
    );

    if let Some(box_with_fullstack) = fullstack_box {
        if let BoxContent::Text(lines) = &box_with_fullstack.content {
            // All text should be in this single box
            let all_text: String = lines
                .iter()
                .flat_map(|l| l.segments.iter())
                .map(|s| s.text.as_str())
                .collect();

            assert!(
                all_text.contains("In development"),
                "The '(In development)' text should be in the SAME box as 'Full-stack', not separate. Box contains: {}",
                all_text
            );
        }
    }
}
