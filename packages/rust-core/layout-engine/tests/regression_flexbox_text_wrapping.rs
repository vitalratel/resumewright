// Regression test for flexbox text wrapping bug (fixed in commit 11248ea)
//
// Bug: Job titles and date ranges in flex containers with justify-content:space-between
// were wrapping to multiple lines even when sufficient horizontal space was available.
//
// Root cause: Taffy's flexbox algorithm measures flex items twice, causing inappropriate
// text wrapping on the second measurement pass.
//
// Fix: Skip wrapping when Definite width matches max-content width (within 0.5pt tolerance)

use cv_domain::{extract_tsx_layout_config_from_document, CVMetadata, FontComplexity, LayoutType};
use layout_engine::calculate_layout_direct;
use pdf_generator::config::{Margin, PDFConfig, PageSize};
use pdf_generator::PDFGenerator;
use std::sync::Arc;
use tsx_parser::parse_tsx;

#[test]
fn test_flexbox_justify_between_no_text_wrapping() {
    // Simplified TSX structure that mimics the "Backend Developer" section
    let tsx_source = r#"
function Resume() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* First role - works fine */}
      <div className="mb-5">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold">Software Engineer</h3>
          <span className="text-sm">May 2023 – August 2025</span>
        </div>
        <p className="text-sm italic mb-2">Robotics Ltd</p>
      </div>

      {/* Second role - overlapping text issue */}
      <div className="mb-5">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold">Backend Developer</h3>
          <span className="text-sm">February 2022 – August 2023</span>
        </div>
        <p className="text-sm italic mb-2">Master Limited</p>
      </div>
    </div>
  );
}
"#;

    let config = PDFConfig {
        page_size: PageSize::Letter,
        margin: Margin {
            top: 72.0,
            bottom: 72.0,
            left: 72.0,
            right: 72.0,
        },
        ..Default::default()
    };

    let metadata = CVMetadata {
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
    };

    // Parse TSX
    let tsx_root = parse_tsx(tsx_source).expect("Failed to parse TSX");

    // Extract layout config
    let layout_config = extract_tsx_layout_config_from_document(&tsx_root);

    // Convert TSX to layout
    let layout = calculate_layout_direct(
        &tsx_root,
        &Arc::new(metadata),
        &layout_config,
        &config,
        &layout_types::EstimatedTextMeasurer,
    )
    .expect("Failed to convert TSX to layout");

    // Generate PDF
    let mut generator = PDFGenerator::new(config.clone()).expect("Failed to create PDF generator");
    generator
        .render_layout(&layout)
        .expect("Failed to render layout");
    let pdf_bytes = generator.finalize().expect("Failed to generate PDF");

    // PDF bytes generated successfully - layout validated below
    let _ = pdf_bytes; // Ensure PDF generation completes without error

    println!("Layout structure:");
    println!("  Pages: {}", layout.pages.len());

    for (page_num, page) in layout.pages.iter().enumerate() {
        println!("\nPage {}:", page_num + 1);
        println!("  Boxes: {}", page.boxes.len());

        // Print all boxes to see their Y positions
        for (i, layout_box) in page.boxes.iter().enumerate() {
            println!(
                "  Box {}: y={:.2}, height={:.2}, type={:?}",
                i, layout_box.y, layout_box.height, layout_box.element_type
            );

            // Check for overlapping boxes (same or very close Y positions)
            if i > 0 {
                let prev_box = &page.boxes[i - 1];
                let prev_bottom = prev_box.y + prev_box.height;

                if layout_box.y < prev_bottom {
                    eprintln!("⚠️  OVERLAP DETECTED!");
                    eprintln!(
                        "     Box {} (y={:.2}) overlaps with Box {} (bottom={:.2})",
                        i,
                        layout_box.y,
                        i - 1,
                        prev_bottom
                    );
                    eprintln!("     Overlap amount: {:.2}pt", prev_bottom - layout_box.y);
                    panic!("Overlapping boxes detected in layout!");
                }
            }
        }
    }
}

#[test]
fn test_flexbox_horizontal_alignment() {
    // Test specifically for flex layouts with justify-between
    let tsx_source = r#"
function Test() {
  return (
    <div className="flex justify-between items-start mb-1">
      <h3 className="font-bold">Backend Developer</h3>
      <span className="text-sm">February 2022 – August 2023</span>
    </div>
  );
}
"#;

    let config = PDFConfig::default();

    let metadata = CVMetadata {
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
    };

    let tsx_root = parse_tsx(tsx_source).expect("Failed to parse TSX");

    let layout_config = extract_tsx_layout_config_from_document(&tsx_root);

    let layout = calculate_layout_direct(
        &tsx_root,
        &Arc::new(metadata),
        &layout_config,
        &config,
        &layout_types::EstimatedTextMeasurer,
    )
    .expect("Failed to convert TSX to layout");

    println!("\nFlex layout boxes:");
    fn print_box(box_ref: &layout_types::LayoutBox, indent: usize) {
        println!(
            "{}Box: x={:.2}, y={:.2}, width={:.2}, height={:.2}, type={:?}",
            "  ".repeat(indent),
            box_ref.x,
            box_ref.y,
            box_ref.width,
            box_ref.height,
            box_ref.element_type
        );
        if let layout_types::BoxContent::Container(children) = &box_ref.content {
            for child in children {
                print_box(child, indent + 1);
            }
        }
    }
    for (i, layout_box) in layout.pages[0].boxes.iter().enumerate() {
        println!("\nTop-level box {}:", i);
        print_box(layout_box, 0);
    }

    // The two text elements should be at the same Y position (horizontally aligned)
    // but different X positions (left and right)
}

#[test]
fn test_a4_with_margins_no_date_wrapping() {
    // Test case that reproduces the issue: A4 page with 36pt margins
    // The date "November 2002 – February 2022" should NOT wrap
    // NOTE: Real CV uses max-w-4xl (672pt) and p-8 (24pt padding)
    let tsx_source = r#"
function Resume() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-5">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold">Software Developer & Technical Specialist</h3>
          <span className="text-sm">November 2002 – February 2022</span>
        </div>
      </div>
    </div>
  );
}
"#;

    // A4 page with 0.5" (36pt) margins - exactly like extension config
    let config = PDFConfig {
        page_size: PageSize::A4,
        margin: Margin {
            top: 36.0,
            bottom: 36.0,
            left: 36.0,
            right: 36.0,
        },
        ..Default::default()
    };

    let metadata = CVMetadata {
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
    };

    let tsx_root = parse_tsx(tsx_source).expect("Failed to parse TSX");
    let layout_config = extract_tsx_layout_config_from_document(&tsx_root);

    println!("\n=== A4 + 36pt margins test ===");
    println!("A4 page size: 595.276 x 841.89 pt");
    println!("Content width after margins: {} pt", 595.276 - 36.0 * 2.0);
    println!("max-w-4xl = 672pt, p-8 = 24pt padding each side");
    println!(
        "Content area: {} pt (A4-margins) vs {} pt (max-w-4xl)",
        595.276 - 36.0 * 2.0,
        672.0
    );
    println!(
        "Actual container width: min({}, {}) - {} = {} pt",
        595.276 - 36.0 * 2.0,
        672.0,
        24.0 * 2.0,
        523.276f64.min(672.0) - 48.0
    );

    // Use PDFTextMeasurer - same as WASM uses
    let measurer = pdf_generator::fonts::PDFTextMeasurer;

    let layout = calculate_layout_direct(
        &tsx_root,
        &Arc::new(metadata),
        &layout_config,
        &config,
        &measurer,
    )
    .expect("Failed to convert TSX to layout");

    // Find the date text box and check if it wrapped
    fn find_date_lines(layout_box: &layout_types::LayoutBox) -> Option<Vec<String>> {
        match &layout_box.content {
            layout_types::BoxContent::Text(lines) => {
                let text = lines.join(" ");
                if text.contains("November 2002") {
                    println!(
                        "Found date box: x={:.2}, y={:.2}, w={:.2}, h={:.2}",
                        layout_box.x, layout_box.y, layout_box.width, layout_box.height
                    );
                    println!("  Lines: {:?}", lines);
                    return Some(lines.clone());
                }
                None
            }
            layout_types::BoxContent::Container(children) => {
                for child in children {
                    if let Some(lines) = find_date_lines(child) {
                        return Some(lines);
                    }
                }
                None
            }
            _ => None,
        }
    }

    let date_lines = layout.pages[0]
        .boxes
        .iter()
        .find_map(find_date_lines)
        .expect("Should find date text box");

    assert_eq!(
        date_lines.len(),
        1,
        "Date 'November 2002 – February 2022' should be on ONE line, not wrapped. Got {} lines: {:?}",
        date_lines.len(),
        date_lines
    );
}

#[test]
fn test_shrink_0_prevents_date_squeeze() {
    // Test that shrink-0 on date span prevents it from being squeezed
    // even when the content is wider than available space
    let tsx_source = r#"
function Resume() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-start">
        <h3 className="font-bold">Software Developer & Technical Specialist</h3>
        <span className="text-sm shrink-0">November 2002 – November 2022</span>
      </div>
    </div>
  );
}
"#;

    let config = PDFConfig {
        page_size: PageSize::A4,
        margin: Margin {
            top: 36.0,
            bottom: 36.0,
            left: 36.0,
            right: 36.0,
        },
        ..Default::default()
    };

    let metadata = CVMetadata {
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
    };

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
    .expect("Failed to convert TSX to layout");

    // Find the date text box
    fn find_date_lines(layout_box: &layout_types::LayoutBox) -> Option<Vec<String>> {
        match &layout_box.content {
            layout_types::BoxContent::Text(lines) => {
                let text = lines.join(" ");
                if text.contains("November 2002") && text.contains("November 2022") {
                    println!(
                        "Found date box: x={:.2}, y={:.2}, w={:.2}, h={:.2}",
                        layout_box.x, layout_box.y, layout_box.width, layout_box.height
                    );
                    println!("  Lines: {:?}", lines);
                    return Some(lines.clone());
                }
                None
            }
            layout_types::BoxContent::Container(children) => {
                for child in children {
                    if let Some(lines) = find_date_lines(child) {
                        return Some(lines);
                    }
                }
                None
            }
            _ => None,
        }
    }

    let date_lines = layout.pages[0]
        .boxes
        .iter()
        .find_map(find_date_lines)
        .expect("Should find date text box");

    // With shrink-0, even a long date should stay on one line
    // (the title may wrap instead, or content may overflow)
    assert_eq!(
        date_lines.len(),
        1,
        "Date with shrink-0 should NOT wrap. Got {} lines: {:?}",
        date_lines.len(),
        date_lines
    );
}
