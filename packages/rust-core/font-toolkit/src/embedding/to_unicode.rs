//! ABOUTME: ToUnicode CMap generation for PDF text extraction
//! ABOUTME: Creates CMap streams that map CIDs to Unicode codepoints

use lopdf::{dictionary, Document, ObjectId, Stream};
use std::collections::BTreeMap;
use std::fmt::Write as FmtWrite;

use super::compression::compress_bytes;
use super::EmbedError;

/// Creates ToUnicode CMap stream for text extraction
///
/// For Identity-H encoding, CID = Unicode codepoint, so the mapping is
/// effectively an identity mapping for all characters in the font.
///
/// # Arguments
/// * `doc` - PDF document to add stream to
/// * `cid_to_gid` - CID to GID mapping (keys are Unicode codepoints)
///
/// # Returns
/// Object ID of the ToUnicode CMap stream
pub fn create_to_unicode_cmap(
    doc: &mut Document,
    cid_to_gid: &BTreeMap<u32, u16>,
) -> Result<ObjectId, EmbedError> {
    let cmap_content = generate_cmap_content(cid_to_gid);
    let compressed = compress_bytes(cmap_content.as_bytes());

    let stream = Stream::new(
        dictionary! {
            "Length" => compressed.len() as i64,
            "Filter" => "FlateDecode",
        },
        compressed,
    );

    Ok(doc.add_object(stream))
}

/// Generates ToUnicode CMap content as PostScript string
fn generate_cmap_content(cid_to_gid: &BTreeMap<u32, u16>) -> String {
    // Pre-allocate capacity: header (~200) + mappings (20 bytes each) + footer (~70)
    let estimated_size = 200 + (cid_to_gid.len() * 20) + 70;
    let mut cmap = String::with_capacity(estimated_size);

    // CMap header
    cmap.push_str(CMAP_HEADER);

    // Character mappings (only for non-zero CIDs)
    let cids: Vec<_> = cid_to_gid.keys().filter(|&&cid| cid > 0).collect();
    if !cids.is_empty() {
        let _ = writeln!(&mut cmap, "{} beginbfchar", cids.len());

        for &cid in &cids {
            // For Identity-H: CID = Unicode, so mapping is <CID> <CID>
            let _ = writeln!(&mut cmap, "<{:04X}> <{:04X}>", cid, cid);
        }

        cmap.push_str("endbfchar\n");
    }

    // CMap footer
    cmap.push_str(CMAP_FOOTER);

    cmap
}

/// ToUnicode CMap header (PostScript)
const CMAP_HEADER: &str = "/CIDInit /ProcSet findresource begin\n\
12 dict begin\n\
begincmap\n\
/CIDSystemInfo\n\
<< /Registry (Adobe)\n\
   /Ordering (UCS)\n\
   /Supplement 0\n\
>> def\n\
/CMapName /Adobe-Identity-UCS def\n\
/CMapType 2 def\n\
1 begincodespacerange\n\
<0000> <FFFF>\n\
endcodespacerange\n";

/// ToUnicode CMap footer (PostScript)
const CMAP_FOOTER: &str = "endcmap\n\
CMapName currentdict /CMap defineresource pop\n\
end\n\
end";

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_cmap_content_structure() {
        let mut mapping = BTreeMap::new();
        mapping.insert(0x41, 1u16); // 'A'
        mapping.insert(0x42, 2u16); // 'B'

        let content = generate_cmap_content(&mapping);

        assert!(content.contains("beginbfchar"));
        assert!(content.contains("<0041>"));
        assert!(content.contains("<0042>"));
        assert!(content.contains("endbfchar"));
        assert!(content.contains("endcmap"));
    }

    #[test]
    fn test_generate_cmap_content_empty_mapping() {
        let mapping = BTreeMap::new();
        let content = generate_cmap_content(&mapping);

        // Should still have header and footer
        assert!(content.contains("begincmap"));
        assert!(content.contains("endcmap"));
        // Should not have bfchar section
        assert!(!content.contains("beginbfchar"));
    }
}
