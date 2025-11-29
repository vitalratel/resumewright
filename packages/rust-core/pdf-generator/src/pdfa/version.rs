//! PDF Version Management for PDF/A
//!
//! This module handles PDF version configuration for various PDF/A compliance levels.

/// Marks the PDF document as PDF/A-1 compliant by setting the appropriate version.
///
/// PDF/A-1 requires PDF version 1.4 (not 1.7). This function updates the
/// document version when PDF/A-1b standard is selected.
///
/// # Arguments
/// * `doc` - Mutable reference to the PDF document
///
/// # Note
/// This must be called before finalizing the document.
///
/// # PDF/A Version Requirements
/// - PDF/A-1: PDF 1.4
/// - PDF/A-2: PDF 1.7 (not yet supported)
/// - PDF/A-3: PDF 1.7 (not yet supported)
pub fn set_pdfa1_version(doc: &mut lopdf::Document) {
    doc.version = "1.4".to_string();
}

/// Configures the document to use traditional xref table instead of xref streams.
///
/// PDF/A-1b forbids cross-reference streams (Clause 6.1.4), which were introduced
/// in PDF 1.5. This function ensures the document uses the older but compliant
/// cross-reference table format.
///
/// # Arguments
/// * `doc` - Mutable reference to the PDF document
///
/// # Note
/// This must be called during document initialization, before adding objects.
pub fn use_traditional_xref_table(doc: &mut lopdf::Document) {
    doc.reference_table.cross_reference_type = lopdf::xref::XrefType::CrossReferenceTable;
}

/// Adds Document ID to the trailer dictionary.
///
/// PDF/A-1b requires a /ID entry in the file trailer (Clause 6.1.3).
/// The ID consists of two byte strings (original and current file identifiers).
///
/// # Arguments
/// * `doc` - Mutable reference to the PDF document
///
/// # Returns
/// Result indicating success or failure of the operation.
///
/// # Implementation Note
/// For WASM compatibility, we generate a deterministic ID based on a timestamp.
/// In production, this could be enhanced with document content hashing.
pub fn add_document_id(doc: &mut lopdf::Document) -> Result<(), crate::error::PDFError> {
    // Generate file identifier based on timestamp
    #[cfg(target_arch = "wasm32")]
    {
        use crate::timestamp::current_pdf_timestamp;

        // Get timestamp string (e.g., "D:20250120120000")
        let timestamp = current_pdf_timestamp();

        // Create a deterministic ID from timestamp bytes
        // PDF/A requires ID but doesn't mandate specific generation method
        let id_bytes = timestamp.as_bytes().to_vec();

        // Pad to 16 bytes for better compatibility
        let mut padded = id_bytes.clone();
        padded.resize(16, 0);

        // Create ID array [original_id, current_id]
        // For new documents, both are the same
        let id = vec![
            lopdf::Object::String(padded.clone(), lopdf::StringFormat::Hexadecimal),
            lopdf::Object::String(padded, lopdf::StringFormat::Hexadecimal),
        ];

        doc.trailer.set("ID", id);
    }

    #[cfg(not(target_arch = "wasm32"))]
    {
        use std::time::SystemTime;

        // Use system time for non-WASM targets
        let now = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap();

        // Create ID from timestamp
        let timestamp_str = format!("{:?}", now);
        let mut id_bytes = timestamp_str.as_bytes().to_vec();
        id_bytes.resize(16, 0);

        let id = vec![
            lopdf::Object::String(id_bytes.clone(), lopdf::StringFormat::Hexadecimal),
            lopdf::Object::String(id_bytes, lopdf::StringFormat::Hexadecimal),
        ];

        doc.trailer.set("ID", id);
    }

    Ok(())
}

/// Adds PDF/A-1b required binary comment after PDF header.
///
/// PDF/A-1b Clause 6.1.2 requires the file header to be immediately followed
/// by a comment line containing at least 4 bytes with values > 127.
/// This signals to transfer programs that the file contains binary data.
///
/// # Arguments
/// * `pdf_bytes` - The raw PDF bytes after lopdf serialization
///
/// # Returns
/// Modified PDF bytes with binary comment inserted after header line,
/// with all xref byte offsets adjusted to account for the inserted bytes.
pub fn add_binary_comment(mut pdf_bytes: Vec<u8>) -> Vec<u8> {
    // Find the end of first line (%PDF-1.4)
    let newline_pos = match pdf_bytes.iter().position(|&b| b == b'\n') {
        Some(pos) => pos,
        None => return pdf_bytes,
    };

    // Binary comment: %âãÏÓ (bytes > 127 to indicate binary content)
    let binary_comment = b"%\xe2\xe3\xcf\xd3\n";
    let insert_len = binary_comment.len();

    // Find xref table and adjust all offsets BEFORE inserting the comment
    // This way we work with correct byte positions

    // Find "xref\n" marker
    let xref_start = match find_pattern(&pdf_bytes, b"xref\n") {
        Some(pos) => pos,
        None => {
            // No xref table found, just insert comment without adjustment
            let mut result = Vec::with_capacity(pdf_bytes.len() + insert_len);
            result.extend_from_slice(&pdf_bytes[..=newline_pos]);
            result.extend_from_slice(binary_comment);
            result.extend_from_slice(&pdf_bytes[newline_pos + 1..]);
            return result;
        }
    };

    // Find "trailer" marker to know where xref entries end
    let trailer_start = match find_pattern(&pdf_bytes[xref_start..], b"trailer") {
        Some(pos) => xref_start + pos,
        None => return pdf_bytes,
    };

    // Process xref table entries: each "in use" entry is 20 bytes:
    // "OOOOOOOOOO GGGGG n \n" where O=offset (10 digits), G=generation (5 digits)
    // Free entries end with 'f' and don't need adjustment
    let xref_section = &mut pdf_bytes[xref_start..trailer_start];

    // Skip "xref\n" and subsection header "N M\n"
    let mut pos = 5; // Skip "xref\n"

    // Skip subsection headers and process entries
    while pos < xref_section.len() {
        // Check if this is a subsection header (two numbers separated by space)
        // or an entry (10-digit offset)
        if pos + 20 <= xref_section.len() {
            let entry = &xref_section[pos..pos + 20];

            // Check if this looks like an xref entry (ends with " n \n" or " f \n")
            if entry.len() >= 20 && (entry[17] == b'n' || entry[17] == b'f') && entry[18] == b' ' {
                // This is an xref entry
                if entry[17] == b'n' {
                    // "In use" entry - adjust the offset
                    if let Ok(offset_str) = std::str::from_utf8(&entry[..10]) {
                        if let Ok(old_offset) = offset_str.parse::<usize>() {
                            let new_offset = old_offset + insert_len;
                            let new_offset_str = format!("{:010}", new_offset);
                            xref_section[pos..pos + 10].copy_from_slice(new_offset_str.as_bytes());
                        }
                    }
                }
                pos += 20;
                continue;
            }
        }

        // Skip to next line (subsection header or other content)
        if let Some(nl) = xref_section[pos..].iter().position(|&b| b == b'\n') {
            pos += nl + 1;
        } else {
            break;
        }
    }

    // Adjust startxref value
    if let Some(startxref_pos) = find_pattern(&pdf_bytes, b"startxref\n") {
        let num_start = startxref_pos + b"startxref\n".len();
        if let Some(num_end) = pdf_bytes[num_start..].iter().position(|&b| b == b'\n') {
            let num_end = num_start + num_end;
            if let Some(old_offset) = std::str::from_utf8(&pdf_bytes[num_start..num_end])
                .ok()
                .and_then(|s| s.parse::<usize>().ok())
            {
                let new_offset = old_offset + insert_len;
                let new_offset_str = new_offset.to_string();

                // Build final result with adjusted xref, adjusted startxref, and binary comment
                let mut result =
                    Vec::with_capacity(pdf_bytes.len() + insert_len + new_offset_str.len());
                result.extend_from_slice(&pdf_bytes[..=newline_pos]);
                result.extend_from_slice(binary_comment);
                result.extend_from_slice(&pdf_bytes[newline_pos + 1..num_start]);
                result.extend_from_slice(new_offset_str.as_bytes());
                result.extend_from_slice(&pdf_bytes[num_end..]);
                return result;
            }
        }
    }

    // Fallback: just insert comment without startxref adjustment
    let mut result = Vec::with_capacity(pdf_bytes.len() + insert_len);
    result.extend_from_slice(&pdf_bytes[..=newline_pos]);
    result.extend_from_slice(binary_comment);
    result.extend_from_slice(&pdf_bytes[newline_pos + 1..]);
    result
}

/// Find byte pattern in slice
fn find_pattern(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    haystack.windows(needle.len()).position(|w| w == needle)
}

#[cfg(test)]
mod tests {
    use super::*;
    use lopdf::Document;

    #[test]
    fn test_set_pdfa1_version() {
        let mut doc = Document::with_version("1.7");
        assert_eq!(doc.version, "1.7");

        set_pdfa1_version(&mut doc);
        assert_eq!(doc.version, "1.4");
    }

    #[test]
    fn test_use_traditional_xref_table() {
        let mut doc = Document::with_version("1.4");

        use_traditional_xref_table(&mut doc);

        // XrefType doesn't implement PartialEq, so we verify by checking behavior
        // The function sets traditional xref table format
        assert!(matches!(
            doc.reference_table.cross_reference_type,
            lopdf::xref::XrefType::CrossReferenceTable
        ));
    }

    #[test]
    fn test_add_document_id() {
        let mut doc = Document::with_version("1.4");

        let result = add_document_id(&mut doc);
        assert!(result.is_ok());

        // Verify ID exists in trailer
        let id = doc.trailer.get(b"ID");
        assert!(id.is_ok());

        // Verify ID is an array
        let id_array = id.unwrap().as_array();
        assert!(id_array.is_ok());

        // Verify array has 2 elements
        let array = id_array.unwrap();
        assert_eq!(array.len(), 2);
    }

    #[test]
    fn test_add_binary_comment() {
        let pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj".to_vec();
        let result = add_binary_comment(pdf_bytes);

        // Check header is preserved
        assert!(result.starts_with(b"%PDF-1.4\n"));

        // Find the second % character (binary comment)
        let second_percent = result.iter().skip(1).position(|&b| b == b'%').unwrap() + 1;

        // Check binary comment bytes are > 127
        assert!(result[second_percent + 1] > 127);
        assert!(result[second_percent + 2] > 127);
        assert!(result[second_percent + 3] > 127);
        assert!(result[second_percent + 4] > 127);
    }

    #[test]
    fn test_add_binary_comment_preserves_content() {
        let pdf_bytes = b"%PDF-1.4\noriginal content".to_vec();
        let result = add_binary_comment(pdf_bytes);

        // Original content should still be present
        assert!(result
            .windows(b"original content".len())
            .any(|w| w == b"original content"));
    }
}
