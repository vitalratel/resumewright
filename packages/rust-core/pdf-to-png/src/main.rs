//! CLI tool for converting PDF pages to PNG images using pdfium-render.
//!
//! This tool is designed for use in testing environments where fast PDF-to-PNG
//! conversion is needed. It provides a simple command-line interface that can
//! be called from TypeScript/Node.js tests.
//!
//! # System Requirements
//!
//! **IMPORTANT:** This tool requires the pdfium shared library to be installed:
//!
//! - **Linux**: Install `libpdfium.so` (via package manager or manual download)
//! - **macOS**: Install `libpdfium.dylib`
//! - **Windows**: Install `pdfium.dll`
//!
//! If pdfium is not found, you will get: "Failed to bind to Pdfium library"
//!
//! See <https://github.com/ajrcarey/pdfium-render> for installation instructions.
//!
//! # Usage
//!
//! ```bash
//! pdf-to-png --input input.pdf --output-dir ./output --basename page --scale 2.0
//! ```
//!
//! # Output
//!
//! Outputs JSON to stdout with the paths to generated PNG files:
//! ```json
//! {
//!   "success": true,
//!   "pngPaths": ["./output/page-1.png", "./output/page-2.png"],
//!   "pageCount": 2
//! }
//! ```
//!
//! On error:
//! ```json
//! {
//!   "success": false,
//!   "error": "Input PDF file does not exist"
//! }
//! ```

use clap::Parser;
use pdf_test_utils::{pdf_to_pngs, RenderConfig};
use serde_json::json;
use std::error::Error;
use std::path::PathBuf;
use std::process;

#[derive(Parser, Debug)]
#[command(name = "pdf-to-png")]
#[command(version)]
#[command(about = "Convert PDF pages to PNG images using pdfium-render", long_about = None)]
struct Args {
    /// Path to the input PDF file
    #[arg(short, long)]
    input: PathBuf,

    /// Directory where PNG files will be saved
    #[arg(short, long)]
    output_dir: PathBuf,

    /// Base filename for output files (e.g., "page" -> "page-1.png", "page-2.png")
    #[arg(short, long, default_value = "page")]
    basename: String,

    /// Scale factor for rendering (default: 2.0 for high quality)
    /// Valid range: 0.1 to 10.0
    #[arg(short, long, default_value = "2.0")]
    scale: f32,

    /// Maximum width in pixels (optional)
    /// Valid range: 100 to 10000
    #[arg(long)]
    max_width: Option<u32>,

    /// Maximum height in pixels (optional)
    /// Valid range: 100 to 10000
    #[arg(long)]
    max_height: Option<u32>,
}

fn main() {
    let args = Args::parse();

    if let Err(e) = run(args) {
        output_error(&e.to_string());
        process::exit(1);
    }
}

/// Main execution logic extracted for testability.
///
/// # Arguments
/// * `args` - Parsed command-line arguments
///
/// # Returns
/// * `Ok(())` - On successful PDF conversion
/// * `Err(Box<dyn Error>)` - On validation or conversion failure
///
/// # Errors
/// Returns error if:
/// - Input file does not exist
/// - max_width or max_height are out of valid range (100-10000)
/// - PDF conversion fails
fn run(args: Args) -> Result<(), Box<dyn Error>> {
    // Validate input file exists
    if !args.input.exists() {
        return Err("Input PDF file does not exist".into());
    }

    // Validate scale factor range
    if args.scale <= 0.0 || args.scale > 10.0 {
        return Err("scale must be between 0.1 and 10.0".into());
    }

    // Validate max_width range
    if let Some(width) = args.max_width {
        if !(100..=10000).contains(&width) {
            return Err("max_width must be between 100 and 10000 pixels".into());
        }
    }

    // Validate max_height range
    if let Some(height) = args.max_height {
        if !(100..=10000).contains(&height) {
            return Err("max_height must be between 100 and 10000 pixels".into());
        }
    }

    // Create render config
    let config = RenderConfig {
        scale: args.scale,
        max_width: args.max_width,
        max_height: args.max_height,
    };

    // Convert PDF to PNGs
    let png_paths = pdf_to_pngs(&args.input, &args.output_dir, &args.basename, config)
        .map_err(|e| format!("PDF conversion failed: {}", e))?;

    // Output success JSON
    let output = json!({
        "success": true,
        "pngPaths": png_paths,
        "pageCount": png_paths.len(),
    });
    println!("{}", output);

    Ok(())
}

/// Output error message as JSON to stdout.
///
/// # Arguments
/// * `message` - Error message to output
fn output_error(message: &str) {
    let output = json!({
        "success": false,
        "error": message,
    });
    println!("{}", output);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_run_invalid_scale_too_small() {
        let args = Args {
            input: PathBuf::from("Cargo.toml"),
            output_dir: PathBuf::from("/tmp"),
            basename: "test".to_string(),
            scale: 0.0, // Invalid - too small
            max_width: None,
            max_height: None,
        };

        let result = run(args);
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("scale must be between"));
    }

    #[test]
    fn test_run_invalid_scale_too_large() {
        let args = Args {
            input: PathBuf::from("Cargo.toml"),
            output_dir: PathBuf::from("/tmp"),
            basename: "test".to_string(),
            scale: 15.0, // Invalid - too large
            max_width: None,
            max_height: None,
        };

        let result = run(args);
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("scale must be between"));
    }

    #[test]
    fn test_run_missing_file() {
        let args = Args {
            input: PathBuf::from("nonexistent.pdf"),
            output_dir: PathBuf::from("/tmp"),
            basename: "test".to_string(),
            scale: 2.0,
            max_width: None,
            max_height: None,
        };

        let result = run(args);
        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err().to_string(),
            "Input PDF file does not exist"
        );
    }

    #[test]
    fn test_run_invalid_max_width_too_small() {
        let args = Args {
            input: PathBuf::from("Cargo.toml"), // Use existing file for validation test
            output_dir: PathBuf::from("/tmp"),
            basename: "test".to_string(),
            scale: 2.0,
            max_width: Some(50), // Too small
            max_height: None,
        };

        let result = run(args);
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("max_width must be between"));
    }

    #[test]
    fn test_run_invalid_max_width_too_large() {
        let args = Args {
            input: PathBuf::from("Cargo.toml"),
            output_dir: PathBuf::from("/tmp"),
            basename: "test".to_string(),
            scale: 2.0,
            max_width: Some(20000), // Too large
            max_height: None,
        };

        let result = run(args);
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("max_width must be between"));
    }

    #[test]
    fn test_run_invalid_max_height_too_small() {
        let args = Args {
            input: PathBuf::from("Cargo.toml"),
            output_dir: PathBuf::from("/tmp"),
            basename: "test".to_string(),
            scale: 2.0,
            max_width: None,
            max_height: Some(50), // Too small
        };

        let result = run(args);
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("max_height must be between"));
    }

    #[test]
    fn test_run_invalid_max_height_too_large() {
        let args = Args {
            input: PathBuf::from("Cargo.toml"),
            output_dir: PathBuf::from("/tmp"),
            basename: "test".to_string(),
            scale: 2.0,
            max_width: None,
            max_height: Some(20000), // Too large
        };

        let result = run(args);
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("max_height must be between"));
    }

    #[test]
    fn test_run_valid_max_dimensions() {
        let args = Args {
            input: PathBuf::from("Cargo.toml"),
            output_dir: PathBuf::from("/tmp"),
            basename: "test".to_string(),
            scale: 2.0,
            max_width: Some(1000),
            max_height: Some(1000),
        };

        // This will fail at PDF conversion (Cargo.toml is not a PDF),
        // but should pass validation
        let result = run(args);
        assert!(result.is_err());
        // Should fail on conversion, not validation
        assert!(result.unwrap_err().to_string().contains("PDF conversion"));
    }
}
