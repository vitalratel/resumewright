// ABOUTME: Tests for conversion stage descriptions and retry messages.
// ABOUTME: Covers all ConversionStatus variants and retry description formatting.

import background/progress
import shared/types.{
  Completed, ExtractingMetadata, Failed, GeneratingPdf, LayingOut, Parsing,
  Queued, Rendering,
}

// ---------------------------------------------------------------------------
// stage_description — ConversionStatus variant
// ---------------------------------------------------------------------------

pub fn queued_description_test() {
  assert progress.stage_description(Queued) == "Preparing conversion..."
}

pub fn parsing_description_test() {
  assert progress.stage_description(Parsing) == "Parsing TSX code..."
}

pub fn extracting_metadata_description_test() {
  assert progress.stage_description(ExtractingMetadata)
    == "Extracting metadata..."
}

pub fn rendering_description_test() {
  assert progress.stage_description(Rendering)
    == "Rendering React components..."
}

pub fn laying_out_description_test() {
  assert progress.stage_description(LayingOut) == "Calculating layout..."
}

pub fn generating_pdf_description_test() {
  assert progress.stage_description(GeneratingPdf) == "Generating PDF..."
}

pub fn completed_description_test() {
  assert progress.stage_description(Completed) == "Complete!"
}

pub fn failed_description_test() {
  assert progress.stage_description(Failed) == "Conversion failed."
}

// ---------------------------------------------------------------------------
// description_from_string — raw WASM stage strings
// ---------------------------------------------------------------------------

pub fn string_queued_test() {
  assert progress.description_from_string("queued") == "Preparing conversion..."
}

pub fn string_parsing_test() {
  assert progress.description_from_string("parsing") == "Parsing TSX code..."
}

pub fn string_extracting_metadata_test() {
  assert progress.description_from_string("extracting-metadata")
    == "Extracting metadata..."
}

pub fn string_rendering_test() {
  assert progress.description_from_string("rendering")
    == "Rendering React components..."
}

pub fn string_laying_out_test() {
  assert progress.description_from_string("laying-out")
    == "Calculating layout..."
}

pub fn string_generating_pdf_test() {
  assert progress.description_from_string("generating-pdf")
    == "Generating PDF..."
}

pub fn string_completed_test() {
  assert progress.description_from_string("completed") == "Complete!"
}

pub fn string_failed_test() {
  assert progress.description_from_string("failed") == "Conversion failed."
}

pub fn string_unknown_stage_test() {
  let desc = progress.description_from_string("some-new-stage")
  assert desc == "Processing (some-new-stage)..."
}

// ---------------------------------------------------------------------------
// retry_description
// ---------------------------------------------------------------------------

pub fn retry_first_attempt_test() {
  let desc = progress.retry_description(1, 3, 1000)
  assert desc == "Conversion attempt 1/3... retrying in 1.0s"
}

pub fn retry_second_attempt_test() {
  let desc = progress.retry_description(2, 3, 2000)
  assert desc == "Conversion attempt 2/3... retrying in 2.0s"
}

pub fn retry_last_attempt_test() {
  let desc = progress.retry_description(3, 3, 4000)
  assert desc == "Conversion attempt 3/3... retrying in 4.0s"
}
