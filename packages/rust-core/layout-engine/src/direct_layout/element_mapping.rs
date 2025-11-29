//! HTML tag to ElementType mapping
//!
//! Provides centralized mapping from HTML tag names to PDF element types.
//! This module follows the Open/Closed Principle by using a data-driven approach.

use layout_types::ElementType;

/// Convert HTML tag string to ElementType
///
/// Uses pattern matching for compile-time optimization.
///
/// # Arguments
/// * `tag` - HTML tag name (lowercase)
///
/// # Returns
/// * `Some(ElementType)` if tag is recognized
/// * `None` for unrecognized tags
pub fn tag_to_element_type(tag: &str) -> Option<ElementType> {
    match tag {
        // Text content elements
        "p" => Some(ElementType::Paragraph),
        "span" => Some(ElementType::Span),
        "strong" | "b" => Some(ElementType::Strong),
        "em" | "i" => Some(ElementType::Em),
        "code" => Some(ElementType::Code),

        // Heading elements
        "h1" => Some(ElementType::Heading1),
        "h2" => Some(ElementType::Heading2),
        "h3" => Some(ElementType::Heading3),
        "h4" => Some(ElementType::Heading4),
        "h5" => Some(ElementType::Heading5),
        "h6" => Some(ElementType::Heading6),

        // List elements
        "ul" => Some(ElementType::UnorderedList),
        "ol" => Some(ElementType::OrderedList),
        "li" => Some(ElementType::ListItem),

        // Container elements
        "div" => Some(ElementType::Div),
        "section" => Some(ElementType::Section),
        "article" => Some(ElementType::Article),
        "header" => Some(ElementType::Header),
        "footer" => Some(ElementType::Footer),
        "main" => Some(ElementType::Main),

        // Special elements
        "a" => Some(ElementType::Link),
        "img" => Some(ElementType::Image),
        "br" => Some(ElementType::Break),

        // Unknown tags
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tag_to_element_type_text_elements() {
        assert_eq!(tag_to_element_type("p"), Some(ElementType::Paragraph));
        assert_eq!(tag_to_element_type("span"), Some(ElementType::Span));
        assert_eq!(tag_to_element_type("strong"), Some(ElementType::Strong));
        assert_eq!(tag_to_element_type("b"), Some(ElementType::Strong));
        assert_eq!(tag_to_element_type("em"), Some(ElementType::Em));
        assert_eq!(tag_to_element_type("i"), Some(ElementType::Em));
        assert_eq!(tag_to_element_type("code"), Some(ElementType::Code));
    }

    #[test]
    fn test_tag_to_element_type_headings() {
        assert_eq!(tag_to_element_type("h1"), Some(ElementType::Heading1));
        assert_eq!(tag_to_element_type("h2"), Some(ElementType::Heading2));
        assert_eq!(tag_to_element_type("h3"), Some(ElementType::Heading3));
        assert_eq!(tag_to_element_type("h4"), Some(ElementType::Heading4));
        assert_eq!(tag_to_element_type("h5"), Some(ElementType::Heading5));
        assert_eq!(tag_to_element_type("h6"), Some(ElementType::Heading6));
    }

    #[test]
    fn test_tag_to_element_type_lists() {
        assert_eq!(tag_to_element_type("ul"), Some(ElementType::UnorderedList));
        assert_eq!(tag_to_element_type("ol"), Some(ElementType::OrderedList));
        assert_eq!(tag_to_element_type("li"), Some(ElementType::ListItem));
    }

    #[test]
    fn test_tag_to_element_type_containers() {
        assert_eq!(tag_to_element_type("div"), Some(ElementType::Div));
        assert_eq!(tag_to_element_type("section"), Some(ElementType::Section));
        assert_eq!(tag_to_element_type("article"), Some(ElementType::Article));
        assert_eq!(tag_to_element_type("header"), Some(ElementType::Header));
        assert_eq!(tag_to_element_type("footer"), Some(ElementType::Footer));
        assert_eq!(tag_to_element_type("main"), Some(ElementType::Main));
    }

    #[test]
    fn test_tag_to_element_type_special() {
        assert_eq!(tag_to_element_type("a"), Some(ElementType::Link));
        assert_eq!(tag_to_element_type("img"), Some(ElementType::Image));
        assert_eq!(tag_to_element_type("br"), Some(ElementType::Break));
    }

    #[test]
    fn test_tag_to_element_type_unknown() {
        assert_eq!(tag_to_element_type("unknown"), None);
        assert_eq!(tag_to_element_type("custom-element"), None);
        assert_eq!(tag_to_element_type(""), None);
    }

    #[test]
    fn test_tag_lookup_consistency() {
        // Test that repeated lookups return consistent results
        for _ in 0..100 {
            assert_eq!(tag_to_element_type("div"), Some(ElementType::Div));
            assert_eq!(tag_to_element_type("unknown"), None);
        }
    }
}
