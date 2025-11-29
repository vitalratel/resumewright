/// Test that actual test fixtures can be parsed
///
/// This test verifies that the test fixtures used in E2E tests
/// can be successfully parsed by the tsx-parser.
use std::fs;
use std::path::Path;
use tsx_parser::{parse_tsx, parse_tsx_with_recovery};

#[test]
fn test_parse_single_column_traditional_fixture() {
    let fixture_path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .join("test-fixtures/tsx-samples/single-page/01-single-column-traditional.tsx");

    println!("Reading fixture from: {:?}", fixture_path);

    let tsx_content = fs::read_to_string(&fixture_path).expect("Failed to read fixture file");

    println!("Fixture size: {} bytes", tsx_content.len());
    println!(
        "First 200 chars: {}",
        &tsx_content[..200.min(tsx_content.len())]
    );

    // Try parsing with error recovery
    let result = parse_tsx_with_recovery(&tsx_content);

    match result {
        tsx_parser::ParseResult::Complete(doc) => {
            println!("✓ Parse succeeded (Complete)");
            println!("  Document source length: {}", doc.source().len());
        }
        tsx_parser::ParseResult::Partial { document, errors } => {
            println!("⚠ Parse succeeded with errors (Partial)");
            println!("  Document source length: {}", document.source().len());
            println!("  Errors:");
            for error in &errors {
                println!("    - {}", error);
            }
            panic!("Partial parse - fixture has errors: {:?}", errors);
        }
        tsx_parser::ParseResult::Failed { errors } => {
            println!("✗ Parse failed");
            println!("  Errors:");
            for error in &errors {
                println!("    - {}", error);
            }
            panic!("Parse failed - fixture is invalid: {:?}", errors);
        }
    }

    // Also try the simpler parse_tsx which expects success
    match parse_tsx(&tsx_content) {
        Ok(doc) => {
            println!("✓ parse_tsx also succeeded");
            println!("  Document: {}", doc);
        }
        Err(e) => {
            panic!("parse_tsx failed: {}", e);
        }
    }
}

#[test]
fn test_all_single_page_fixtures() {
    let fixtures_dir = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .join("test-fixtures/tsx-samples/single-page");

    if !fixtures_dir.exists() {
        println!("Fixtures directory doesn't exist: {:?}", fixtures_dir);
        return;
    }

    let entries = fs::read_dir(&fixtures_dir).expect("Failed to read fixtures directory");

    let mut fixture_count = 0;
    let mut failed_fixtures = Vec::new();

    for entry in entries {
        let entry = entry.expect("Failed to read directory entry");
        let path = entry.path();

        if path.extension().and_then(|s| s.to_str()) == Some("tsx") {
            fixture_count += 1;
            let filename = path.file_name().unwrap().to_str().unwrap();

            println!("\n--- Testing fixture: {} ---", filename);

            let tsx_content = fs::read_to_string(&path).expect("Failed to read fixture file");

            match parse_tsx(&tsx_content) {
                Ok(_) => {
                    println!("  ✓ {}", filename);
                }
                Err(e) => {
                    println!("  ✗ {}: {}", filename, e);
                    failed_fixtures.push((filename.to_string(), e.to_string()));
                }
            }
        }
    }

    println!("\n=== Summary ===");
    println!("Total fixtures tested: {}", fixture_count);
    println!("Failed: {}", failed_fixtures.len());

    if !failed_fixtures.is_empty() {
        println!("\nFailed fixtures:");
        for (name, error) in &failed_fixtures {
            println!("  - {}: {}", name, error);
        }
        panic!("{} fixtures failed to parse", failed_fixtures.len());
    }
}
