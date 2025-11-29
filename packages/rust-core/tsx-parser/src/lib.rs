//! TSX Parser module using oxc_parser
//!
//! This module provides functionality to parse TypeScript JSX (TSX) source code
//! into an Abstract Syntax Tree (AST) that can be further processed for PDF generation.
//! It uses oxc_parser for high-performance parsing with smaller binary size.

use std::fmt;

use oxc_allocator::Allocator;
use oxc_ast::ast::Program;

// Module declarations
mod error;
mod extraction;
mod helpers;
mod parser;
mod validation;

// Re-export public API
pub use error::{ParseError, ParseResult};
pub use extraction::{
    extract_class_name, extract_element_name, extract_inline_style, extract_jsx_elements,
    extract_text_content, get_attribute_names, get_attribute_value,
};
pub use parser::{parse_tsx, parse_tsx_with_recovery};

// Re-export oxc types that consumers need
pub use oxc_ast::ast::{
    Declaration, Expression, JSXAttribute, JSXAttributeItem, JSXAttributeName, JSXAttributeValue,
    JSXChild, JSXElement, JSXElementName, JSXExpression, JSXExpressionContainer,
    JSXMemberExpression, JSXNamespacedName, JSXText, ModuleDeclaration, Statement,
};

/// Parsed TSX document with AST representation
///
/// This struct owns the allocator to ensure the AST remains valid.
/// The allocator must live as long as any references to the AST.
pub struct TsxDocument {
    pub source: String,
    // The allocator owns all AST memory - it must be stored but not directly accessed
    _allocator: Allocator,
    // We store the program as a raw pointer to avoid lifetime issues.
    // Safety: The allocator outlives this pointer, and we only access it via &self
    program_ptr: *const Program<'static>,
}

// Safety: TsxDocument is Send because it owns all its data and doesn't share mutable state
unsafe impl Send for TsxDocument {}
// Safety: TsxDocument is Sync because all access is read-only after construction
unsafe impl Sync for TsxDocument {}

impl TsxDocument {
    /// Create a new TsxDocument by parsing TSX source code
    ///
    /// This internal constructor handles the allocator ownership correctly by
    /// parsing inside the same function where the allocator is created.
    pub(crate) fn from_source(
        source: String,
    ) -> Result<Self, (Vec<crate::error::ParseError>, Option<Self>)> {
        use oxc_parser::Parser;
        use oxc_span::SourceType;

        let allocator = Allocator::default();
        let source_type = SourceType::tsx();

        // Parse within this scope where allocator is still borrowed
        let ret = Parser::new(&allocator, &source, source_type).parse();

        // Collect any parse errors
        let errors: Vec<crate::error::ParseError> = ret
            .errors
            .iter()
            .map(|e| crate::error::ParseError::SyntaxError {
                line: 1,
                column: 1,
                message: e.to_string(),
            })
            .collect();

        // Allocate the program struct itself in the arena
        // The program's contents are already in the arena, but the Program struct
        // is on the stack. We need to move it into the arena so it outlives
        // this function.
        let program_in_arena: &Program<'_> = allocator.alloc(ret.program);
        let program_ptr: *const Program<'static> = program_in_arena as *const _ as *const _;

        // Now we can safely move the allocator - program_ptr points to arena memory
        let doc = Self {
            source,
            _allocator: allocator,
            program_ptr,
        };

        if errors.is_empty() {
            Ok(doc)
        } else {
            Err((errors, Some(doc)))
        }
    }

    /// Get a reference to the source code
    pub fn source(&self) -> &str {
        &self.source
    }

    /// Get the program AST
    ///
    /// # Safety
    /// This is safe because the allocator is owned by this struct and outlives the reference.
    pub fn program(&self) -> &Program<'_> {
        // Safety: program_ptr points to valid memory owned by _allocator
        unsafe { &*self.program_ptr }
    }
}

impl Clone for TsxDocument {
    fn clone(&self) -> Self {
        // Re-parse to create a new document with its own allocator
        parse_tsx(&self.source).expect("Re-parsing should succeed for valid document")
    }
}

impl fmt::Debug for TsxDocument {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("TsxDocument")
            .field("source_len", &self.source.len())
            .finish()
    }
}

impl fmt::Display for TsxDocument {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let elements = extract_jsx_elements(self);
        let preview = self.source.chars().take(100).collect::<String>();
        let preview = if self.source.len() > 100 {
            format!("{}...", preview)
        } else {
            preview
        };

        write!(
            f,
            "TsxDocument {{ elements: {}, source: \"{}\" }}",
            elements.len(),
            preview
        )
    }
}
