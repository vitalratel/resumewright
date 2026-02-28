// ABOUTME: JSON decoders and encoders for domain types — Chrome storage and messaging payloads.
// ABOUTME: Decodes camelCase Chrome storage JSON into Gleam types; encodes back for persistence.

import gleam/dynamic/decode
import gleam/json
import gleam/option.{None}
import shared/types.{
  type CompletePayload, type ConversionConfig, type ConversionError,
  type ConversionProgress, type ConversionRequest, type ConversionStatus,
  type ErrorPayload, type Margin, type PageSize, type ProgressPayload,
  type Settings, type Theme, A4, Auto, CompletePayload, Completed,
  ConversionConfig, ConversionError, ConversionProgress, ConversionRequest, Dark,
  ErrorPayload, ExtractingMetadata, Failed, GeneratingPdf, LayingOut, Legal,
  Letter, Light, Margin, Parsing, ProgressPayload, Queued, Rendering, Settings,
}

// ---------------------------------------------------------------------------
// Decoders
// ---------------------------------------------------------------------------

fn page_size_decoder() -> decode.Decoder(PageSize) {
  use s <- decode.then(decode.string)
  case s {
    "Letter" -> decode.success(Letter)
    "A4" -> decode.success(A4)
    "Legal" -> decode.success(Legal)
    _ -> decode.failure(Letter, "PageSize")
  }
}

fn theme_decoder() -> decode.Decoder(Theme) {
  use s <- decode.then(decode.string)
  case s {
    "light" -> decode.success(Light)
    "dark" -> decode.success(Dark)
    "auto" -> decode.success(Auto)
    _ -> decode.failure(Auto, "Theme")
  }
}

fn margin_decoder() -> decode.Decoder(Margin) {
  use top <- decode.field("top", decode.float)
  use right <- decode.field("right", decode.float)
  use bottom <- decode.field("bottom", decode.float)
  use left <- decode.field("left", decode.float)
  decode.success(Margin(top:, right:, bottom:, left:))
}

fn conversion_config_decoder() -> decode.Decoder(ConversionConfig) {
  use page_size <- decode.field("pageSize", page_size_decoder())
  use margin <- decode.field("margin", margin_decoder())
  use font_size <- decode.field("fontSize", decode.int)
  use font_family <- decode.field("fontFamily", decode.string)
  use compress <- decode.field("compress", decode.bool)
  use ats_optimization <- decode.optional_field(
    "atsOptimization",
    False,
    decode.bool,
  )
  use include_metadata <- decode.optional_field(
    "includeMetadata",
    True,
    decode.bool,
  )
  decode.success(ConversionConfig(
    page_size:,
    margin:,
    font_size:,
    font_family:,
    compress:,
    ats_optimization:,
    include_metadata:,
  ))
}

pub fn settings_decoder() -> decode.Decoder(Settings) {
  use theme <- decode.field("theme", theme_decoder())
  use default_config <- decode.field(
    "defaultConfig",
    conversion_config_decoder(),
  )
  use settings_version <- decode.field("settingsVersion", decode.int)
  use last_updated <- decode.field("lastUpdated", decode.int)
  decode.success(Settings(
    theme:,
    default_config:,
    settings_version:,
    last_updated:,
  ))
}

pub fn parse_settings(json_string: String) -> Result(Settings, json.DecodeError) {
  json.parse(from: json_string, using: settings_decoder())
}

fn conversion_status_decoder() -> decode.Decoder(ConversionStatus) {
  use s <- decode.then(decode.string)
  case s {
    "queued" -> decode.success(Queued)
    "parsing" -> decode.success(Parsing)
    "extracting-metadata" -> decode.success(ExtractingMetadata)
    "rendering" -> decode.success(Rendering)
    "laying-out" -> decode.success(LayingOut)
    "generating-pdf" -> decode.success(GeneratingPdf)
    "completed" -> decode.success(Completed)
    "failed" -> decode.success(Failed)
    _ -> decode.failure(Queued, "ConversionStatus")
  }
}

fn conversion_progress_decoder() -> decode.Decoder(ConversionProgress) {
  use stage <- decode.field("stage", conversion_status_decoder())
  use percentage <- decode.field("percentage", decode.int)
  use current_operation <- decode.field("currentOperation", decode.string)
  decode.success(ConversionProgress(stage:, percentage:, current_operation:))
}

pub fn conversion_error_decoder() -> decode.Decoder(ConversionError) {
  use code <- decode.field("code", decode.string)
  use message <- decode.field("message", decode.string)
  use suggestions <- decode.field("suggestions", decode.list(decode.string))
  use recoverable <- decode.field("recoverable", decode.bool)
  use technical_details <- decode.optional_field(
    "technicalDetails",
    None,
    decode.optional(decode.string),
  )
  decode.success(ConversionError(
    code:,
    message:,
    suggestions:,
    recoverable:,
    technical_details:,
  ))
}

pub fn parse_conversion_error(
  json_string: String,
) -> Result(ConversionError, json.DecodeError) {
  json.parse(from: json_string, using: conversion_error_decoder())
}

pub fn progress_payload_decoder() -> decode.Decoder(ProgressPayload) {
  use job_id <- decode.field("jobId", decode.string)
  use progress <- decode.field("progress", conversion_progress_decoder())
  decode.success(ProgressPayload(job_id:, progress:))
}

pub fn complete_payload_decoder() -> decode.Decoder(CompletePayload) {
  use job_id <- decode.field("jobId", decode.string)
  use filename <- decode.optional_field(
    "filename",
    None,
    decode.optional(decode.string),
  )
  use file_size <- decode.field("fileSize", decode.int)
  use duration <- decode.field("duration", decode.int)
  decode.success(CompletePayload(job_id:, filename:, file_size:, duration:))
}

pub fn error_payload_decoder() -> decode.Decoder(ErrorPayload) {
  use job_id <- decode.field("jobId", decode.string)
  use error <- decode.field("error", conversion_error_decoder())
  decode.success(ErrorPayload(job_id:, error:))
}

pub fn conversion_request_decoder() -> decode.Decoder(ConversionRequest) {
  use tsx <- decode.optional_field("tsx", None, decode.optional(decode.string))
  use file_name <- decode.optional_field(
    "fileName",
    None,
    decode.optional(decode.string),
  )
  use config <- decode.optional_field(
    "config",
    None,
    decode.optional(conversion_config_decoder()),
  )
  decode.success(ConversionRequest(tsx:, file_name:, config:))
}

// ---------------------------------------------------------------------------
// Encoders
// ---------------------------------------------------------------------------

fn encode_page_size(page_size: PageSize) -> json.Json {
  case page_size {
    Letter -> json.string("Letter")
    A4 -> json.string("A4")
    Legal -> json.string("Legal")
  }
}

fn encode_theme(theme: Theme) -> json.Json {
  case theme {
    Light -> json.string("light")
    Dark -> json.string("dark")
    Auto -> json.string("auto")
  }
}

fn encode_margin(margin: Margin) -> json.Json {
  json.object([
    #("top", json.float(margin.top)),
    #("right", json.float(margin.right)),
    #("bottom", json.float(margin.bottom)),
    #("left", json.float(margin.left)),
  ])
}

fn encode_conversion_config(config: ConversionConfig) -> json.Json {
  json.object([
    #("pageSize", encode_page_size(config.page_size)),
    #("margin", encode_margin(config.margin)),
    #("fontSize", json.int(config.font_size)),
    #("fontFamily", json.string(config.font_family)),
    #("compress", json.bool(config.compress)),
    #("atsOptimization", json.bool(config.ats_optimization)),
    #("includeMetadata", json.bool(config.include_metadata)),
  ])
}

fn encode_settings_json(settings: Settings) -> json.Json {
  json.object([
    #("theme", encode_theme(settings.theme)),
    #("defaultConfig", encode_conversion_config(settings.default_config)),
    #("settingsVersion", json.int(settings.settings_version)),
    #("lastUpdated", json.int(settings.last_updated)),
  ])
}

pub fn settings_to_json(settings: Settings) -> String {
  json.to_string(encode_settings_json(settings))
}

/// Returns a Json value (not a string) for embedding in larger structures.
pub fn encode_settings(settings: Settings) -> json.Json {
  encode_settings_json(settings)
}

/// Returns a Json value (not a string) for embedding in larger structures.
pub fn encode_conversion_config_json(config: ConversionConfig) -> json.Json {
  encode_conversion_config(config)
}

pub fn conversion_request_to_json(req: ConversionRequest) -> String {
  json.to_string(
    json.object([
      #("tsx", json.nullable(req.tsx, json.string)),
      #("fileName", json.nullable(req.file_name, json.string)),
      #("config", json.nullable(req.config, encode_conversion_config)),
    ]),
  )
}
