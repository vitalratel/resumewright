//! ABOUTME: Zlib compression utilities for PDF streams
//! ABOUTME: Compresses font data and CMap content using FlateDecode

use flate2::write::ZlibEncoder;
use flate2::Compression;
use std::io::Write;

/// Compresses bytes using zlib (FlateDecode in PDF terminology)
pub fn compress_bytes(data: &[u8]) -> Vec<u8> {
    let mut encoder = ZlibEncoder::new(Vec::new(), Compression::default());
    // Writing to Vec<u8> in memory never fails - only allocation failure is possible
    encoder
        .write_all(data)
        .expect("Writing to Vec<u8> should never fail except on allocation failure");
    encoder
        .finish()
        .expect("Finishing ZlibEncoder with Vec<u8> should never fail except on allocation failure")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compress_bytes() {
        let data = b"Hello, World!";
        let compressed = compress_bytes(data);
        assert!(!compressed.is_empty());
    }

    #[test]
    fn test_compress_bytes_empty() {
        let compressed = compress_bytes(&[]);
        // Empty input still produces zlib header/trailer
        assert!(!compressed.is_empty());
    }

    #[test]
    fn test_compress_bytes_large() {
        // Larger data should compress well
        let data: Vec<u8> = (0..10000).map(|i| (i % 256) as u8).collect();
        let compressed = compress_bytes(&data);
        // Should achieve some compression on repetitive data
        assert!(compressed.len() < data.len());
    }
}
