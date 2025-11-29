//! OutputIntent and ICC Profile Management
//!
//! This module handles embedding of ICC profiles and creation of OutputIntent
//! dictionaries for PDF/A compliance. The OutputIntent specifies the color space
//! for the document, which is required for PDF/A.

use super::constants::SRGB_ICC_PROFILE;
use crate::error::PDFError;
use lopdf::{dictionary, Object, Stream};

/// Adds PDF/A-1 OutputIntent to the document catalog.
///
/// The OutputIntent specifies the color space for the document, which is
/// required for PDF/A compliance. For PDF/A-1b, we use sRGB as the
/// device-independent color space.
///
/// This function embeds the sRGB ICC profile (456 bytes, CC0 licensed from
/// <https://github.com/saucecontrol/Compact-ICC-Profiles>) as required by
/// ISO 19005-1:2005 Section 6.2.3.3 for DeviceRGB color space usage.
///
/// # Arguments
/// * `doc` - Mutable reference to the PDF document
///
/// # Returns
/// Result indicating success or failure of the operation.
pub fn add_output_intent(doc: &mut lopdf::Document) -> Result<(), PDFError> {
    // Create ICC profile stream
    let icc_stream = create_icc_stream();
    let icc_stream_id = doc.add_object(icc_stream);

    // Create OutputIntent with reference to ICC profile
    let output_intent = create_output_intent_dict(icc_stream_id);
    let output_intent_id = doc.add_object(output_intent);

    // Get catalog and add OutputIntents array
    let catalog_id = super::get_catalog_id(doc)?;

    if let Ok(Object::Dictionary(ref mut catalog)) = doc.get_object_mut(catalog_id) {
        catalog.set("OutputIntents", vec![Object::Reference(output_intent_id)]);
    } else {
        return Err(PDFError::InitError(
            "Catalog is not a dictionary".to_string(),
        ));
    }

    Ok(())
}

/// Creates an ICC profile stream for sRGB color space
///
/// # Returns
/// A lopdf Stream object containing the embedded ICC profile
pub(super) fn create_icc_stream() -> Stream {
    Stream::new(
        dictionary! {
            "N" => 3,  // Number of color components (RGB = 3)
            "Alternate" => "DeviceRGB",
            "Length" => SRGB_ICC_PROFILE.len() as i64,
        },
        SRGB_ICC_PROFILE.to_vec(),
    )
}

/// Creates an OutputIntent dictionary for PDF/A-1b
///
/// # Arguments
/// * `icc_stream_id` - Object ID of the ICC profile stream
///
/// # Returns
/// A lopdf Dictionary object for the OutputIntent
pub(super) fn create_output_intent_dict(icc_stream_id: (u32, u16)) -> lopdf::Dictionary {
    dictionary! {
        "Type" => "OutputIntent",
        "S" => "GTS_PDFA1",  // PDF/A-1 conformance
        "OutputConditionIdentifier" => Object::String(
            b"sRGB IEC61966-2.1".to_vec(),
            lopdf::StringFormat::Literal
        ),
        "RegistryName" => Object::String(
            b"http://www.color.org".to_vec(),
            lopdf::StringFormat::Literal
        ),
        "Info" => Object::String(
            b"sRGB IEC61966-2.1".to_vec(),
            lopdf::StringFormat::Literal
        ),
        "DestOutputProfile" => Object::Reference(icc_stream_id),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_icc_stream() {
        let stream = create_icc_stream();

        // Verify stream dictionary
        assert_eq!(stream.dict.get(b"N").unwrap().as_i64().unwrap(), 3);
        assert_eq!(
            stream.dict.get(b"Alternate").unwrap().as_name().unwrap(),
            b"DeviceRGB"
        );
        assert_eq!(
            stream.dict.get(b"Length").unwrap().as_i64().unwrap(),
            SRGB_ICC_PROFILE.len() as i64
        );

        // Verify stream content
        assert_eq!(stream.content, SRGB_ICC_PROFILE);
    }

    #[test]
    fn test_create_output_intent_dict() {
        let icc_id = (42, 0);
        let dict = create_output_intent_dict(icc_id);

        // Verify OutputIntent dictionary structure
        assert_eq!(
            dict.get(b"Type").unwrap().as_name().unwrap(),
            b"OutputIntent"
        );
        assert_eq!(dict.get(b"S").unwrap().as_name().unwrap(), b"GTS_PDFA1");

        // Verify profile reference
        let profile_ref = dict.get(b"DestOutputProfile").unwrap();
        assert_eq!(profile_ref.as_reference().unwrap(), icc_id);

        // Verify strings
        assert!(dict.get(b"OutputConditionIdentifier").is_ok());
        assert!(dict.get(b"RegistryName").is_ok());
        assert!(dict.get(b"Info").is_ok());
    }

    #[test]
    fn test_icc_profile_size() {
        // Verify we're using the compact 456-byte profile
        assert_eq!(SRGB_ICC_PROFILE.len(), 456);
    }

    #[test]
    fn test_add_output_intent() {
        use lopdf::{dictionary, Document, Object};

        // Create a minimal PDF document with catalog
        let mut doc = Document::with_version("1.4");
        let catalog = dictionary! {
            "Type" => "Catalog",
        };
        let catalog_id = doc.add_object(catalog);
        doc.trailer.set("Root", Object::Reference(catalog_id));

        // Add OutputIntent
        let result = add_output_intent(&mut doc);
        assert!(result.is_ok());

        // Verify catalog has OutputIntents
        let catalog = doc.get_dictionary(catalog_id).unwrap();
        assert!(catalog.get(b"OutputIntents").is_ok());

        // Verify OutputIntents is an array with one element
        let output_intents = catalog.get(b"OutputIntents").unwrap();
        if let Object::Array(ref arr) = output_intents {
            assert_eq!(arr.len(), 1);

            // Verify it's a reference
            if let Object::Reference(intent_id) = arr[0] {
                // Verify the OutputIntent object exists
                let intent_dict = doc.get_dictionary(intent_id).unwrap();
                assert_eq!(
                    intent_dict.get(b"Type").unwrap().as_name().unwrap(),
                    b"OutputIntent"
                );
                assert_eq!(
                    intent_dict.get(b"S").unwrap().as_name().unwrap(),
                    b"GTS_PDFA1"
                );

                // Verify it has a DestOutputProfile reference
                assert!(intent_dict.get(b"DestOutputProfile").is_ok());
            } else {
                panic!("OutputIntents array should contain a reference");
            }
        } else {
            panic!("OutputIntents should be an array");
        }
    }

    #[test]
    fn test_add_output_intent_invalid_catalog() {
        use lopdf::{Document, Object};

        // Create document with invalid catalog (not a dictionary)
        let mut doc = Document::with_version("1.4");
        let invalid_catalog_id = doc.add_object(Object::Null);
        doc.trailer
            .set("Root", Object::Reference(invalid_catalog_id));

        // This should fail because catalog is not a dictionary
        let result = add_output_intent(&mut doc);
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            crate::error::PDFError::InitError(_)
        ));
    }
}
