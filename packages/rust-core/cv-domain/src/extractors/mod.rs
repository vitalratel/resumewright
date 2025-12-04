//! Field extractors for CV content
//!
//! This module contains specialized extractors for different types of CV fields.
//! Each extractor focuses on a single responsibility (SRP refactoring Phase 3).

pub mod email;
pub mod location;
pub mod name;
pub mod phone;
pub mod text;
pub mod title;
pub mod url;

// Re-export public functions for backward compatibility
pub use email::extract_email_from_text;
pub use location::extract_location_from_text;
pub use name::extract_name_from_elements;
pub use phone::extract_phone_from_text;
pub use text::collect_all_text;
pub use title::extract_title_from_elements;
pub use url::extract_website_from_text;
