//! Pagination module - splits layout boxes across pages
//!
//! This module orchestrates multi-page layout by:
//! - Determining when to break pages (overflow, orphan prevention)
//! - Splitting boxes that span page boundaries
//! - Adjusting coordinates when boxes move to new pages
//!
//! # Module Organization
//! - `box_splitter` - Splits boxes at page boundaries
//! - `coordinate_adjuster` - Adjusts Y coordinates for boxes
//! - `page_breaker` - Decides when to break pages
//! - `page_builder` - Main pagination orchestration

mod box_splitter;
mod coordinate_adjuster;
mod page_breaker;
mod page_builder;

pub use page_builder::paginate_boxes;
