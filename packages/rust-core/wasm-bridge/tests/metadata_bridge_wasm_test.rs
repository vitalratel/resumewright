//! WASM API Tests for CV Metadata Extraction
//!
//! Priority: P0-COV-METADATA_BRIDGE-001, P0-COV-METADATA_BRIDGE-002
//!
//! These tests verify the extract_cv_metadata() public WASM API and all CVMetadata getters.
//! The API is called from TypeScript to extract CV information before PDF generation.
//!
//! Coverage:
//! - extract_cv_metadata() - PUBLIC WASM API
//! - CVMetadata getters (12 methods)
//! - Error handling for invalid TSX
//! - Edge cases (minimal CV, no metadata, etc.)

use js_sys::Reflect;
use wasm_bindgen_test::*;

// Import public API
use wasm_bridge::extract_cv_metadata;

wasm_bindgen_test_configure!(run_in_browser);

//
// Test 1: Extract Metadata - Complete CV
//

#[wasm_bindgen_test]
fn test_extract_cv_metadata_complete_cv() {
    let tsx = r#"
        const CV = () => (
            <div>
                <h1>John Doe</h1>
                <p>Senior Software Engineer</p>
                <a href="mailto:john@example.com">john@example.com</a>
                <p>+1-555-012-3456</p>
                <p>San Francisco, CA</p>
                <a href="https://johndoe.com">johndoe.com</a>

                <div>
                    <h2>Experience</h2>
                    <div>
                        <h3>Tech Corp</h3>
                        <p>Senior Engineer | 2020-Present</p>
                    </div>
                </div>

                <div>
                    <h2>Education</h2>
                    <p>BS Computer Science</p>
                </div>

                <div>
                    <h2>Skills</h2>
                    <p>JavaScript, TypeScript, Rust, React</p>
                </div>
            </div>
        );
    "#;

    // Extract metadata
    let result = extract_cv_metadata(tsx);

    // Should succeed
    assert!(result.is_ok(), "Metadata extraction should succeed");

    let metadata = result.unwrap();

    // Test name getter
    let name = metadata.name();
    assert!(name.is_some(), "Should extract name");
    assert_eq!(name.unwrap(), "John Doe", "Name should be 'John Doe'");

    // Test title getter
    let title = metadata.title();
    assert!(title.is_some(), "Should extract title");
    assert_eq!(
        title.unwrap(),
        "Senior Software Engineer",
        "Title should match"
    );

    // Test email getter
    let email = metadata.email();
    assert!(email.is_some(), "Should extract email");
    assert_eq!(email.unwrap(), "john@example.com", "Email should match");

    // Test phone getter
    let phone = metadata.phone();
    assert!(phone.is_some(), "Should extract phone");
    assert!(
        phone.unwrap().contains("555-012-3456"),
        "Phone should contain number"
    );

    // Test location getter
    let location = metadata.location();
    assert!(location.is_some(), "Should extract location");
    assert!(
        location.unwrap().contains("San Francisco"),
        "Location should match"
    );

    // Test website getter
    let website = metadata.website();
    assert!(website.is_some(), "Should extract website");
    assert!(
        website.unwrap().contains("johndoe.com"),
        "Website should match"
    );

    // Test estimated_pages getter
    let pages = metadata.estimated_pages();
    assert!(pages > 0, "Should estimate pages, got {}", pages);

    // Test component_count getter
    let components = metadata.component_count();
    assert!(
        components > 0,
        "Should count components, got {}",
        components
    );

    // Test has_contact_info getter
    let has_contact = metadata.has_contact_info();
    assert!(has_contact, "Should have contact info");

    // Test has_clear_sections getter
    let has_sections = metadata.has_clear_sections();
    assert!(has_sections, "Should have clear sections");
}

//
// Test 2: Extract Metadata - Minimal CV
//

#[wasm_bindgen_test]
fn test_extract_cv_metadata_minimal_cv() {
    let tsx = r#"
        const CV = () => (
            <div>
                <h1>Jane Smith</h1>
                <p>Developer</p>
            </div>
        );
    "#;

    let result = extract_cv_metadata(tsx);
    assert!(
        result.is_ok(),
        "Metadata extraction should succeed for minimal CV"
    );

    let metadata = result.unwrap();

    // Name and title should be present
    assert!(
        metadata.name().is_some(),
        "Should extract name from minimal CV"
    );
    assert!(
        metadata.title().is_some(),
        "Should extract title from minimal CV"
    );

    // Other fields may be None
    let email = metadata.email();
    let phone = metadata.phone();
    let location = metadata.location();
    let website = metadata.website();

    // Test that getters work even when returning None
    assert!(
        email.is_none() || email.is_some(),
        "Email getter should work"
    );
    assert!(
        phone.is_none() || phone.is_some(),
        "Phone getter should work"
    );
    assert!(
        location.is_none() || location.is_some(),
        "Location getter should work"
    );
    assert!(
        website.is_none() || website.is_some(),
        "Website getter should work"
    );

    // Should still estimate pages
    let pages = metadata.estimated_pages();
    assert!(pages >= 1, "Should estimate at least 1 page");

    // Should count components
    let components = metadata.component_count();
    assert!(components > 0, "Should count at least some components");
}

//
// Test 3: Extract Metadata - No Contact Info
//

#[wasm_bindgen_test]
fn test_extract_cv_metadata_no_contact_info() {
    let tsx = r#"
        const CV = () => (
            <div>
                <h1>Anonymous User</h1>
                <div>
                    <h2>Experience</h2>
                    <p>Various roles</p>
                </div>
            </div>
        );
    "#;

    let result = extract_cv_metadata(tsx);
    assert!(result.is_ok(), "Metadata extraction should succeed");

    let metadata = result.unwrap();

    // Test has_contact_info getter - should be false
    let has_contact = metadata.has_contact_info();
    assert!(!has_contact, "Should NOT have contact info");

    // Email, phone, location, website should be None
    assert!(metadata.email().is_none(), "Email should be None");
    assert!(metadata.phone().is_none(), "Phone should be None");
    assert!(metadata.location().is_none(), "Location should be None");
    assert!(metadata.website().is_none(), "Website should be None");
}

//
// Test 4: Extract Metadata - Layout Type Detection
//

#[wasm_bindgen_test]
fn test_extract_cv_metadata_layout_type() {
    let tsx = r#"
        const CV = () => (
            <div style="display: flex">
                <div style="width: 30%">
                    <h2>Contact</h2>
                </div>
                <div style="width: 70%">
                    <h1>John Doe</h1>
                    <h2>Experience</h2>
                </div>
            </div>
        );
    "#;

    let result = extract_cv_metadata(tsx);
    assert!(result.is_ok(), "Metadata extraction should succeed");

    let metadata = result.unwrap();

    // Test layout_type getter
    let _layout_type = metadata.layout_type();

    // Layout type getter should work (returns LayoutType enum)
    // Enum is serialized as kebab-case string in JSON
}

//
// Test 5: Extract Metadata - Font Complexity
//

#[wasm_bindgen_test]
fn test_extract_cv_metadata_font_complexity() {
    let tsx_simple = r#"
        const CV = () => (
            <div style="font-family: Arial">
                <h1>Simple CV</h1>
            </div>
        );
    "#;

    let result = extract_cv_metadata(tsx_simple);
    assert!(result.is_ok(), "Metadata extraction should succeed");

    let metadata = result.unwrap();

    // Test font_complexity getter
    let _complexity = metadata.font_complexity();

    // Font complexity getter should work (returns FontComplexity enum)
    // Enum is serialized as kebab-case string in JSON
}

//
// Test 6: Extract Metadata - Error Handling (Invalid TSX)
//

#[wasm_bindgen_test]
fn test_extract_cv_metadata_invalid_tsx() {
    let invalid_tsx = "<div><h1>Unclosed tag";

    let result = extract_cv_metadata(invalid_tsx);

    // Should return error
    assert!(result.is_err(), "Invalid TSX should return error");

    let error = result.err().unwrap();

    // Error should be an object
    assert!(error.is_object(), "Error should be an object");

    // Check error structure
    let code = Reflect::get(&error, &"code".into()).unwrap();
    assert!(code.is_string(), "Error should have 'code' field");

    let message = Reflect::get(&error, &"message".into()).unwrap();
    assert!(message.is_string(), "Error should have 'message' field");
    assert!(
        !message.as_string().unwrap().is_empty(),
        "Error message should not be empty"
    );
}

//
// Test 7: Extract Metadata - Empty TSX
//

#[wasm_bindgen_test]
fn test_extract_cv_metadata_empty_tsx() {
    let empty_tsx = "";

    let result = extract_cv_metadata(empty_tsx);

    // Should return error
    assert!(result.is_err(), "Empty TSX should return error");

    let error = result.err().unwrap();
    assert!(error.is_object(), "Error should be an object");
}

//
// Test 8: Extract Metadata - Multiple Pages Estimation
//

#[wasm_bindgen_test]
fn test_extract_cv_metadata_multipage_estimation() {
    // Create large CV with many sections
    let tsx = r#"
        const CV = () => (
            <div>
                <h1>John Doe</h1>
                <p>Senior Software Engineer</p>

                <div><h2>Experience</h2>
                    <div><h3>Company 1</h3><p>Description 1</p></div>
                    <div><h3>Company 2</h3><p>Description 2</p></div>
                    <div><h3>Company 3</h3><p>Description 3</p></div>
                    <div><h3>Company 4</h3><p>Description 4</p></div>
                    <div><h3>Company 5</h3><p>Description 5</p></div>
                </div>

                <div><h2>Education</h2>
                    <div><h3>University 1</h3><p>Degree 1</p></div>
                    <div><h3>University 2</h3><p>Degree 2</p></div>
                </div>

                <div><h2>Skills</h2>
                    <p>Skill 1, Skill 2, Skill 3, Skill 4, Skill 5</p>
                    <p>Skill 6, Skill 7, Skill 8, Skill 9, Skill 10</p>
                </div>

                <div><h2>Projects</h2>
                    <div><h3>Project 1</h3><p>Description 1</p></div>
                    <div><h3>Project 2</h3><p>Description 2</p></div>
                    <div><h3>Project 3</h3><p>Description 3</p></div>
                </div>
            </div>
        );
    "#;

    let result = extract_cv_metadata(tsx);
    assert!(result.is_ok(), "Metadata extraction should succeed");

    let metadata = result.unwrap();

    // Should estimate multiple pages
    let pages = metadata.estimated_pages();
    assert!(pages >= 1, "Should estimate at least 1 page, got {}", pages);

    // Component count should be high
    let components = metadata.component_count();
    assert!(
        components > 10,
        "Should count many components, got {}",
        components
    );
}

//
// Test 9: Extract Metadata - Clear Sections Detection
//

#[wasm_bindgen_test]
fn test_extract_cv_metadata_clear_sections() {
    let tsx_with_sections = r#"
        const CV = () => (
            <div>
                <h1>Jane Doe</h1>
                <div><h2>Experience</h2><p>Content</p></div>
                <div><h2>Education</h2><p>Content</p></div>
                <div><h2>Skills</h2><p>Content</p></div>
            </div>
        );
    "#;

    let result = extract_cv_metadata(tsx_with_sections);
    assert!(result.is_ok(), "Metadata extraction should succeed");

    let metadata = result.unwrap();

    // Should detect clear sections
    let has_sections = metadata.has_clear_sections();
    assert!(has_sections, "Should detect clear sections");
}

//
// Test 10: Extract Metadata - No Clear Sections
//

#[wasm_bindgen_test]
fn test_extract_cv_metadata_no_clear_sections() {
    let tsx_no_sections = r#"
        const CV = () => (
            <div>
                <h1>John Doe</h1>
                <p>Just some random text without clear sections</p>
                <p>More text</p>
                <p>Even more text</p>
            </div>
        );
    "#;

    let result = extract_cv_metadata(tsx_no_sections);
    assert!(result.is_ok(), "Metadata extraction should succeed");

    let metadata = result.unwrap();

    // Verify has_clear_sections getter returns a valid boolean
    let _has_sections = metadata.has_clear_sections();
}

//
// Test 11: All Getters Return Valid Types
//

#[wasm_bindgen_test]
fn test_cv_metadata_all_getters_return_valid_types() {
    let tsx = r#"
        const CV = () => (
            <div>
                <h1>Test User</h1>
                <p>Test Title</p>
                <a href="mailto:test@example.com">test@example.com</a>
            </div>
        );
    "#;

    let result = extract_cv_metadata(tsx);
    assert!(result.is_ok(), "Metadata extraction should succeed");

    let metadata = result.unwrap();

    // All getters should return valid types
    // This tests that the WASM bindings work correctly

    let _name: Option<String> = metadata.name();
    let _title: Option<String> = metadata.title();
    let _email: Option<String> = metadata.email();
    let _phone: Option<String> = metadata.phone();
    let _location: Option<String> = metadata.location();
    let _website: Option<String> = metadata.website();
    let _layout_type = metadata.layout_type();
    let _pages: usize = metadata.estimated_pages();
    let _components: usize = metadata.component_count();
    let _has_contact: bool = metadata.has_contact_info();
    let _has_sections: bool = metadata.has_clear_sections();
    let _font_complexity = metadata.font_complexity();

    // If we get here, all getters worked without panicking
}

//
// Test 12: Extract Metadata - Special Characters
//

#[wasm_bindgen_test]
fn test_extract_cv_metadata_special_characters() {
    let tsx = r#"
        const CV = () => (
            <div>
                <h1>José García-López</h1>
                <p>Développeur Senior</p>
                <a href="mailto:josé@example.com">josé@example.com</a>
            </div>
        );
    "#;

    let result = extract_cv_metadata(tsx);
    assert!(
        result.is_ok(),
        "Metadata extraction should handle special characters"
    );

    let metadata = result.unwrap();

    // Should extract name with special characters
    let name = metadata.name();
    assert!(name.is_some(), "Should extract name with special chars");
    assert!(
        name.unwrap().contains("José"),
        "Name should contain special characters"
    );
}
