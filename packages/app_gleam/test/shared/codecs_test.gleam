// ABOUTME: Tests for JSON decoders and encoders — settings round-trips and message payloads.
// ABOUTME: Covers legacy Chrome storage format, optional fields, and all enum variants.

import gleam/json
import gleam/option.{None, Some}
import shared/codecs
import shared/types.{
  A4, Auto, CompletePayload, Completed, ConversionConfig, ConversionError,
  ConversionProgress, ConversionRequest, Dark, ErrorPayload, ExtractingMetadata,
  Failed, GeneratingPdf, LayingOut, Legal, Letter, Light, Margin, Parsing,
  ProgressPayload, Queued, Rendering, Settings,
}

// ---------------------------------------------------------------------------
// settings round-trip
// ---------------------------------------------------------------------------

pub fn settings_round_trip_test() {
  let settings =
    Settings(
      theme: Dark,
      default_config: ConversionConfig(
        page_size: A4,
        margin: Margin(top: 0.5, right: 0.5, bottom: 0.5, left: 0.5),
        font_size: 12,
        font_family: "Inter",
        compress: True,
        ats_optimization: False,
        include_metadata: True,
      ),
      settings_version: 1,
      last_updated: 1_234_567_890,
    )
  let json_string = codecs.settings_to_json(settings)
  assert codecs.parse_settings(json_string) == Ok(settings)
}

pub fn settings_all_page_sizes_test() {
  let make = fn(ps) {
    Settings(
      theme: Auto,
      default_config: ConversionConfig(
        page_size: ps,
        margin: Margin(top: 0.0, right: 0.0, bottom: 0.0, left: 0.0),
        font_size: 11,
        font_family: "Helvetica",
        compress: True,
        ats_optimization: False,
        include_metadata: True,
      ),
      settings_version: 1,
      last_updated: 1,
    )
  }
  assert codecs.parse_settings(codecs.settings_to_json(make(Letter)))
    == Ok(make(Letter))
  assert codecs.parse_settings(codecs.settings_to_json(make(A4)))
    == Ok(make(A4))
  assert codecs.parse_settings(codecs.settings_to_json(make(Legal)))
    == Ok(make(Legal))
}

pub fn settings_all_themes_test() {
  let make = fn(th) {
    Settings(
      theme: th,
      default_config: ConversionConfig(
        page_size: Letter,
        margin: Margin(top: 0.0, right: 0.0, bottom: 0.0, left: 0.0),
        font_size: 11,
        font_family: "Helvetica",
        compress: True,
        ats_optimization: False,
        include_metadata: True,
      ),
      settings_version: 1,
      last_updated: 1,
    )
  }
  assert codecs.parse_settings(codecs.settings_to_json(make(Light)))
    == Ok(make(Light))
  assert codecs.parse_settings(codecs.settings_to_json(make(Dark)))
    == Ok(make(Dark))
  assert codecs.parse_settings(codecs.settings_to_json(make(Auto)))
    == Ok(make(Auto))
}

// Legacy Chrome storage format — extra fields (autoDetectCV, etc.) are ignored.
pub fn settings_from_legacy_json_test() {
  let json_str =
    "{\"theme\":\"auto\",\"defaultConfig\":{\"pageSize\":\"Letter\",\"margin\":{\"top\":0,\"right\":0,\"bottom\":0,\"left\":0},\"fontSize\":11,\"fontFamily\":\"Helvetica\",\"compress\":true,\"atsOptimization\":false,\"includeMetadata\":true},\"autoDetectCV\":true,\"showConvertButtons\":true,\"telemetryEnabled\":false,\"retentionDays\":30,\"settingsVersion\":1,\"lastUpdated\":1234567890}"
  assert codecs.parse_settings(json_str)
    == Ok(Settings(
      theme: Auto,
      default_config: ConversionConfig(
        page_size: Letter,
        margin: Margin(top: 0.0, right: 0.0, bottom: 0.0, left: 0.0),
        font_size: 11,
        font_family: "Helvetica",
        compress: True,
        ats_optimization: False,
        include_metadata: True,
      ),
      settings_version: 1,
      last_updated: 1_234_567_890,
    ))
}

// Optional config fields default correctly when absent.
pub fn settings_optional_config_fields_default_test() {
  let json_str =
    "{\"theme\":\"light\",\"defaultConfig\":{\"pageSize\":\"A4\",\"margin\":{\"top\":0,\"right\":0,\"bottom\":0,\"left\":0},\"fontSize\":11,\"fontFamily\":\"Arial\",\"compress\":false},\"settingsVersion\":2,\"lastUpdated\":9999}"
  assert codecs.parse_settings(json_str)
    == Ok(Settings(
      theme: Light,
      default_config: ConversionConfig(
        page_size: A4,
        margin: Margin(top: 0.0, right: 0.0, bottom: 0.0, left: 0.0),
        font_size: 11,
        font_family: "Arial",
        compress: False,
        ats_optimization: False,
        include_metadata: True,
      ),
      settings_version: 2,
      last_updated: 9999,
    ))
}

pub fn settings_invalid_page_size_test() {
  let json_str =
    "{\"theme\":\"auto\",\"defaultConfig\":{\"pageSize\":\"B5\",\"margin\":{\"top\":0,\"right\":0,\"bottom\":0,\"left\":0},\"fontSize\":11,\"fontFamily\":\"Helvetica\",\"compress\":true},\"settingsVersion\":1,\"lastUpdated\":1}"
  let result = codecs.parse_settings(json_str)
  assert result
    != Ok(Settings(
      theme: Auto,
      default_config: ConversionConfig(
        page_size: Letter,
        margin: Margin(top: 0.0, right: 0.0, bottom: 0.0, left: 0.0),
        font_size: 11,
        font_family: "Helvetica",
        compress: True,
        ats_optimization: False,
        include_metadata: True,
      ),
      settings_version: 1,
      last_updated: 1,
    ))
  case result {
    Error(_) -> Nil
    Ok(_) -> panic as "Expected decode error for invalid page size"
  }
}

pub fn settings_invalid_theme_test() {
  let json_str =
    "{\"theme\":\"sepia\",\"defaultConfig\":{\"pageSize\":\"Letter\",\"margin\":{\"top\":0,\"right\":0,\"bottom\":0,\"left\":0},\"fontSize\":11,\"fontFamily\":\"Helvetica\",\"compress\":true},\"settingsVersion\":1,\"lastUpdated\":1}"
  let result = codecs.parse_settings(json_str)
  case result {
    Error(_) -> Nil
    Ok(_) -> panic as "Expected decode error for invalid theme"
  }
}

// ---------------------------------------------------------------------------
// parse_conversion_error
// ---------------------------------------------------------------------------

pub fn conversion_error_full_test() {
  let json_str =
    "{\"code\":\"TSX_PARSE_ERROR\",\"message\":\"Unexpected token\",\"suggestions\":[\"Check your JSX\",\"Verify brackets\"],\"recoverable\":false,\"technicalDetails\":\"Line 10, column 5\"}"
  assert codecs.parse_conversion_error(json_str)
    == Ok(ConversionError(
      code: "TSX_PARSE_ERROR",
      message: "Unexpected token",
      suggestions: ["Check your JSX", "Verify brackets"],
      recoverable: False,
      technical_details: Some("Line 10, column 5"),
    ))
}

pub fn conversion_error_no_technical_details_test() {
  let json_str =
    "{\"code\":\"UNKNOWN_ERROR\",\"message\":\"Something went wrong\",\"suggestions\":[],\"recoverable\":true}"
  assert codecs.parse_conversion_error(json_str)
    == Ok(ConversionError(
      code: "UNKNOWN_ERROR",
      message: "Something went wrong",
      suggestions: [],
      recoverable: True,
      technical_details: None,
    ))
}

pub fn conversion_error_null_technical_details_test() {
  let json_str =
    "{\"code\":\"PDF_GENERATION_FAILED\",\"message\":\"Render failed\",\"suggestions\":[\"Retry\"],\"recoverable\":true,\"technicalDetails\":null}"
  assert codecs.parse_conversion_error(json_str)
    == Ok(ConversionError(
      code: "PDF_GENERATION_FAILED",
      message: "Render failed",
      suggestions: ["Retry"],
      recoverable: True,
      technical_details: None,
    ))
}

// ---------------------------------------------------------------------------
// progress_payload_decoder
// ---------------------------------------------------------------------------

pub fn progress_payload_queued_test() {
  let json_str =
    "{\"jobId\":\"job-1\",\"progress\":{\"stage\":\"queued\",\"percentage\":0,\"currentOperation\":\"Waiting\"}}"
  assert json.parse(from: json_str, using: codecs.progress_payload_decoder())
    == Ok(ProgressPayload(
      job_id: "job-1",
      progress: ConversionProgress(
        stage: Queued,
        percentage: 0,
        current_operation: "Waiting",
      ),
    ))
}

pub fn progress_payload_all_statuses_test() {
  let make_json = fn(stage_str, pct) {
    "{\"jobId\":\"j\",\"progress\":{\"stage\":\""
    <> stage_str
    <> "\",\"percentage\":"
    <> pct
    <> ",\"currentOperation\":\"op\"}}"
  }
  let parse = fn(j) {
    json.parse(from: j, using: codecs.progress_payload_decoder())
  }

  let check_stage = fn(json_str, expected_stage) {
    case parse(json_str) {
      Ok(ProgressPayload(progress: cp, ..)) -> {
        let ConversionProgress(stage: s, ..) = cp
        assert s == expected_stage
      }
      _ -> panic as "Expected Ok"
    }
  }

  check_stage(make_json("queued", "0"), Queued)
  check_stage(make_json("parsing", "10"), Parsing)
  check_stage(make_json("extracting-metadata", "20"), ExtractingMetadata)
  check_stage(make_json("rendering", "40"), Rendering)
  check_stage(make_json("laying-out", "60"), LayingOut)
  check_stage(make_json("generating-pdf", "80"), GeneratingPdf)
  check_stage(make_json("completed", "100"), Completed)
  check_stage(make_json("failed", "0"), Failed)
}

// ---------------------------------------------------------------------------
// complete_payload_decoder
// ---------------------------------------------------------------------------

pub fn complete_payload_with_filename_test() {
  let json_str =
    "{\"jobId\":\"job-2\",\"filename\":\"resume.pdf\",\"fileSize\":42000,\"duration\":1500}"
  assert json.parse(from: json_str, using: codecs.complete_payload_decoder())
    == Ok(CompletePayload(
      job_id: "job-2",
      filename: Some("resume.pdf"),
      file_size: 42_000,
      duration: 1500,
    ))
}

pub fn complete_payload_no_filename_test() {
  let json_str = "{\"jobId\":\"job-3\",\"fileSize\":10000,\"duration\":800}"
  assert json.parse(from: json_str, using: codecs.complete_payload_decoder())
    == Ok(CompletePayload(
      job_id: "job-3",
      filename: None,
      file_size: 10_000,
      duration: 800,
    ))
}

pub fn complete_payload_null_filename_test() {
  let json_str =
    "{\"jobId\":\"job-4\",\"filename\":null,\"fileSize\":5000,\"duration\":200}"
  assert json.parse(from: json_str, using: codecs.complete_payload_decoder())
    == Ok(CompletePayload(
      job_id: "job-4",
      filename: None,
      file_size: 5000,
      duration: 200,
    ))
}

// ---------------------------------------------------------------------------
// error_payload_decoder
// ---------------------------------------------------------------------------

pub fn error_payload_test() {
  let json_str =
    "{\"jobId\":\"job-5\",\"error\":{\"code\":\"WASM_INIT_FAILED\",\"message\":\"WASM failed\",\"suggestions\":[\"Reload\"],\"recoverable\":false}}"
  assert json.parse(from: json_str, using: codecs.error_payload_decoder())
    == Ok(ErrorPayload(
      job_id: "job-5",
      error: ConversionError(
        code: "WASM_INIT_FAILED",
        message: "WASM failed",
        suggestions: ["Reload"],
        recoverable: False,
        technical_details: None,
      ),
    ))
}

// ---------------------------------------------------------------------------
// conversion_request_decoder / conversion_request_to_json
// ---------------------------------------------------------------------------

pub fn conversion_request_full_test() {
  let json_str =
    "{\"tsx\":\"<CV />\",\"fileName\":\"resume.tsx\",\"config\":{\"pageSize\":\"Letter\",\"margin\":{\"top\":0,\"right\":0,\"bottom\":0,\"left\":0},\"fontSize\":11,\"fontFamily\":\"Helvetica\",\"compress\":true,\"atsOptimization\":false,\"includeMetadata\":true}}"
  assert json.parse(from: json_str, using: codecs.conversion_request_decoder())
    == Ok(ConversionRequest(
      tsx: Some("<CV />"),
      file_name: Some("resume.tsx"),
      config: Some(ConversionConfig(
        page_size: Letter,
        margin: Margin(top: 0.0, right: 0.0, bottom: 0.0, left: 0.0),
        font_size: 11,
        font_family: "Helvetica",
        compress: True,
        ats_optimization: False,
        include_metadata: True,
      )),
    ))
}

pub fn conversion_request_empty_test() {
  let json_str = "{}"
  assert json.parse(from: json_str, using: codecs.conversion_request_decoder())
    == Ok(ConversionRequest(tsx: None, file_name: None, config: None))
}

pub fn conversion_request_round_trip_test() {
  let req =
    ConversionRequest(
      tsx: Some("<CV />"),
      file_name: Some("cv.tsx"),
      config: None,
    )
  assert json.parse(
      from: codecs.conversion_request_to_json(req),
      using: codecs.conversion_request_decoder(),
    )
    == Ok(req)
}
