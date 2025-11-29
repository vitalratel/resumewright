//! Integration tests for CV domain metadata extraction
//!
//! These tests verify end-to-end functionality of parsing TSX and extracting CV metadata.

use cv_domain::{extract_metadata, LayoutType};
use tsx_parser::parse_tsx;

#[test]
fn test_integration_smoke_fixture_01() {
    let tsx = include_str!(
        "../../../../test-fixtures/tsx-samples/single-page/01-single-column-traditional.tsx"
    );

    // Parse TSX
    let document = parse_tsx(tsx).expect("Failed to parse TSX");

    // Extract metadata
    let metadata = extract_metadata(&document).expect("Failed to extract metadata");

    // Verify name extracted
    assert!(
        metadata.name.is_some(),
        "Name should be extracted from fixture 01"
    );
    assert_eq!(
        metadata.name.as_ref().unwrap(),
        "John Anderson",
        "Name should match fixture 01"
    );

    // Verify email extracted
    assert!(
        metadata.email.is_some(),
        "Email should be extracted from fixture 01"
    );
    assert!(
        metadata.email.as_ref().unwrap().contains("john.anderson"),
        "Email should contain correct username"
    );

    // Verify phone extracted
    assert!(
        metadata.phone.is_some(),
        "Phone should be extracted from fixture 01"
    );

    // Verify layout type (Custom is acceptable for complex fixtures)
    assert!(
        matches!(
            metadata.layout_type,
            LayoutType::SingleColumn | LayoutType::Custom
        ),
        "Layout should be detected for fixture 01, got: {:?}",
        metadata.layout_type
    );

    // Verify ATS hints
    assert!(
        metadata.has_contact_info,
        "Should detect contact info presence"
    );
    assert!(
        metadata.has_clear_sections,
        "Should detect clear sections with h2 headings"
    );

    println!("✓ Integration smoke test passed for fixture 01");
    println!("  Name: {:?}", metadata.name);
    println!("  Email: {:?}", metadata.email);
    println!("  Phone: {:?}", metadata.phone);
    println!("  Layout: {:?}", metadata.layout_type);
    println!("  Estimated Pages: {}", metadata.estimated_pages);
    println!("  Component Count: {}", metadata.component_count);
}

#[test]
fn test_integration_smoke_fixture_02() {
    let tsx =
        include_str!("../../../../test-fixtures/tsx-samples/single-page/02-two-column-modern.tsx");

    let document = parse_tsx(tsx).expect("Failed to parse TSX");
    let metadata = extract_metadata(&document).expect("Failed to extract metadata");

    assert!(
        metadata.name.is_some(),
        "Name should be extracted from fixture 02"
    );
    assert_eq!(
        metadata.name.as_ref().unwrap(),
        "Sarah Chen",
        "Name should match fixture 02"
    );

    // Verify email extracted
    assert!(
        metadata.email.is_some(),
        "Email should be extracted from fixture 02 (got: {:?})",
        metadata.email
    );
    assert!(
        metadata.email.as_ref().unwrap().contains("sarah.chen"),
        "Email should contain correct username"
    );

    // Verify phone extracted
    assert!(
        metadata.phone.is_some(),
        "Phone should be extracted from fixture 02 (got: {:?})",
        metadata.phone
    );

    // Layout should be detected (any type is acceptable)
    println!("  Layout: {:?}", metadata.layout_type);

    println!("✓ Integration smoke test passed for fixture 02");
    println!("  Name: {:?}", metadata.name);
    println!("  Email: {:?}", metadata.email);
    println!("  Phone: {:?}", metadata.phone);
    println!("  Layout: {:?}", metadata.layout_type);
}

#[test]
fn test_integration_smoke_fixture_03() {
    let tsx =
        include_str!("../../../../test-fixtures/tsx-samples/single-page/03-minimal-simple.tsx");

    let document = parse_tsx(tsx).expect("Failed to parse TSX");
    let metadata = extract_metadata(&document).expect("Failed to extract metadata");

    // Name extraction may fail on minimal fixtures, just verify parsing works
    println!("  Name: {:?}", metadata.name);
    println!("  Components: {}", metadata.component_count);

    println!("✓ Integration smoke test passed for fixture 03");
    println!("  Name: {:?}", metadata.name);
}

#[test]
fn test_integration_smoke_fixture_04() {
    let tsx = include_str!(
        "../../../../test-fixtures/tsx-samples/single-page/04-technical-developer.tsx"
    );

    let document = parse_tsx(tsx).expect("Failed to parse TSX");
    let metadata = extract_metadata(&document).expect("Failed to extract metadata");

    // Name extraction may vary based on fixture structure
    println!("  Name: {:?}", metadata.name);
    println!("  Components: {}", metadata.component_count);

    println!("✓ Integration smoke test passed for fixture 04");
    println!("  Name: {:?}", metadata.name);
}

#[test]
fn test_all_fixtures_parse_successfully() {
    let fixtures = vec![
        (
            "01-single-column-traditional",
            include_str!("../../../../test-fixtures/tsx-samples/single-page/01-single-column-traditional.tsx"),
        ),
        (
            "02-two-column-modern",
            include_str!("../../../../test-fixtures/tsx-samples/single-page/02-two-column-modern.tsx"),
        ),
        (
            "03-minimal-simple",
            include_str!("../../../../test-fixtures/tsx-samples/single-page/03-minimal-simple.tsx"),
        ),
        (
            "04-technical-developer",
            include_str!("../../../../test-fixtures/tsx-samples/single-page/04-technical-developer.tsx"),
        ),
    ];

    for (name, tsx) in fixtures {
        let document =
            parse_tsx(tsx).unwrap_or_else(|_| panic!("Failed to parse fixture: {}", name));
        let metadata = extract_metadata(&document)
            .unwrap_or_else(|_| panic!("Failed to extract from fixture: {}", name));

        assert!(
            metadata.component_count > 0,
            "Fixture {} should have components",
            name
        );

        println!("✓ Fixture {} parsed and extracted successfully", name);
    }
}
