// ABOUTME: Conversion stage descriptions for progress broadcasts.
// ABOUTME: Maps ConversionStatus variants and raw WASM stage strings to user-facing text.

import gleam/float
import gleam/int
import shared/types.{
  type ConversionStatus, Completed, ExtractingMetadata, Failed, GeneratingPdf,
  LayingOut, Parsing, Queued, Rendering,
}

/// Maps a ConversionStatus variant to a user-facing operation description.
pub fn stage_description(stage: ConversionStatus) -> String {
  case stage {
    Queued -> "Preparing conversion..."
    Parsing -> "Parsing TSX code..."
    ExtractingMetadata -> "Extracting metadata..."
    Rendering -> "Rendering React components..."
    LayingOut -> "Calculating layout..."
    GeneratingPdf -> "Generating PDF..."
    Completed -> "Complete!"
    Failed -> "Conversion failed."
  }
}

/// Maps a raw WASM stage string (e.g. "extracting-metadata") to a description.
pub fn description_from_string(stage: String) -> String {
  case stage {
    "queued" -> "Preparing conversion..."
    "parsing" -> "Parsing TSX code..."
    "extracting-metadata" -> "Extracting metadata..."
    "rendering" -> "Rendering React components..."
    "laying-out" -> "Calculating layout..."
    "generating-pdf" -> "Generating PDF..."
    "completed" -> "Complete!"
    "failed" -> "Conversion failed."
    _ -> "Processing (" <> stage <> ")..."
  }
}

/// Formats a retry progress description, e.g. "Conversion attempt 2/3... retrying in 1.0s".
pub fn retry_description(
  attempt: Int,
  max_attempts: Int,
  delay_ms: Int,
) -> String {
  let delay_s = int.to_float(delay_ms) /. 1000.0
  let delay_str = format_delay(delay_s)
  "Conversion attempt "
  <> int.to_string(attempt)
  <> "/"
  <> int.to_string(max_attempts)
  <> "... retrying in "
  <> delay_str
  <> "s"
}

fn format_delay(seconds: Float) -> String {
  // Format to one decimal place: 1000ms → "1.0", 2000ms → "2.0"
  let whole = float.truncate(seconds)
  let frac = float.truncate({ seconds -. int.to_float(whole) } *. 10.0)
  int.to_string(whole) <> "." <> int.to_string(frac)
}
