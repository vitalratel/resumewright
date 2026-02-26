// ABOUTME: Domain types for the ResumeWright converter — layout, settings, conversion state.
// ABOUTME: Shared between the Lustre frontend and the Gleam service worker.

import gleam/option.{type Option}

pub type PageSize {
  Letter
  A4
  Legal
}

pub type Margin {
  Margin(top: Float, right: Float, bottom: Float, left: Float)
}

pub type ConversionConfig {
  ConversionConfig(
    page_size: PageSize,
    margin: Margin,
    font_size: Int,
    font_family: String,
    compress: Bool,
    ats_optimization: Bool,
    include_metadata: Bool,
  )
}

pub type Theme {
  Light
  Dark
  Auto
}

pub type Settings {
  Settings(
    theme: Theme,
    default_config: ConversionConfig,
    settings_version: Int,
    last_updated: Int,
  )
}

pub type ConversionStatus {
  Queued
  Parsing
  ExtractingMetadata
  Rendering
  LayingOut
  GeneratingPdf
  Completed
  Failed
}

pub type ConversionProgress {
  ConversionProgress(
    stage: ConversionStatus,
    percentage: Int,
    current_operation: String,
  )
}

pub type ConversionError {
  ConversionError(
    code: String,
    message: String,
    suggestions: List(String),
    recoverable: Bool,
    technical_details: Option(String),
  )
}

/// Payload sent from frontend to background to start a conversion.
pub type ConversionRequest {
  ConversionRequest(
    tsx: Option(String),
    file_name: Option(String),
    config: Option(ConversionConfig),
  )
}

/// Payload types for background → frontend broadcasts.
pub type ProgressPayload {
  ProgressPayload(job_id: String, progress: ConversionProgress)
}

pub type CompletePayload {
  CompletePayload(
    job_id: String,
    filename: Option(String),
    file_size: Int,
    duration: Int,
  )
}

pub type ErrorPayload {
  ErrorPayload(job_id: String, error: ConversionError)
}
