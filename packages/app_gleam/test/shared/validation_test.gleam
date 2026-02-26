// ABOUTME: Tests for margin, conversion config, and settings validation rules.
// ABOUTME: Covers boundary values, all error paths, and composite validate_settings.

import shared/types.{
  Auto, ConversionConfig, Letter, Margin, Settings,
}
import shared/validation

// ---------------------------------------------------------------------------
// validate_margin
// ---------------------------------------------------------------------------

pub fn valid_margin_test() {
  let m = Margin(top: 0.5, right: 0.5, bottom: 0.5, left: 0.5)
  assert validation.validate_margin(m) == Ok(m)
}

pub fn margin_boundary_zero_test() {
  let m = Margin(top: 0.0, right: 0.0, bottom: 0.0, left: 0.0)
  assert validation.validate_margin(m) == Ok(m)
}

pub fn margin_boundary_max_test() {
  let m = Margin(top: 1.5, right: 1.5, bottom: 1.5, left: 1.5)
  assert validation.validate_margin(m) == Ok(m)
}

pub fn margin_top_too_high_test() {
  let m = Margin(top: 2.0, right: 0.5, bottom: 0.5, left: 0.5)
  assert validation.validate_margin(m) == Error(["top margin must be between 0.0 and 1.5 inches"])
}

pub fn margin_right_too_high_test() {
  let m = Margin(top: 0.5, right: 2.0, bottom: 0.5, left: 0.5)
  assert validation.validate_margin(m) == Error(["right margin must be between 0.0 and 1.5 inches"])
}

pub fn margin_top_negative_test() {
  let m = Margin(top: -0.1, right: 0.5, bottom: 0.5, left: 0.5)
  assert validation.validate_margin(m) == Error(["top margin must be between 0.0 and 1.5 inches"])
}

pub fn margin_multiple_invalid_test() {
  let m = Margin(top: 2.0, right: 2.0, bottom: 0.5, left: 0.5)
  let result = validation.validate_margin(m)
  assert result == Error([
    "top margin must be between 0.0 and 1.5 inches",
    "right margin must be between 0.0 and 1.5 inches",
  ])
}

// ---------------------------------------------------------------------------
// validate_conversion_config
// ---------------------------------------------------------------------------

pub fn valid_config_test() {
  let config = ConversionConfig(
    page_size: Letter,
    margin: Margin(top: 0.5, right: 0.5, bottom: 0.5, left: 0.5),
    font_size: 11,
    font_family: "Helvetica",
    compress: True,
    ats_optimization: False,
    include_metadata: True,
  )
  assert validation.validate_conversion_config(config) == Ok(config)
}

pub fn config_invalid_margin_test() {
  let config = ConversionConfig(
    page_size: Letter,
    margin: Margin(top: 3.0, right: 0.5, bottom: 0.5, left: 0.5),
    font_size: 11,
    font_family: "Helvetica",
    compress: True,
    ats_optimization: False,
    include_metadata: True,
  )
  assert validation.validate_conversion_config(config)
    == Error(["top margin must be between 0.0 and 1.5 inches"])
}

// ---------------------------------------------------------------------------
// validate_settings
// ---------------------------------------------------------------------------

pub fn valid_settings_test() {
  let s = Settings(
    theme: Auto,
    default_config: ConversionConfig(
      page_size: Letter,
      margin: Margin(top: 0.5, right: 0.5, bottom: 0.5, left: 0.5),
      font_size: 11,
      font_family: "Helvetica",
      compress: True,
      ats_optimization: False,
      include_metadata: True,
    ),
    settings_version: 1,
    last_updated: 1_234_567_890,
  )
  assert validation.validate_settings(s) == Ok(s)
}

pub fn settings_version_zero_test() {
  let s = Settings(
    theme: Auto,
    default_config: ConversionConfig(
      page_size: Letter,
      margin: Margin(top: 0.5, right: 0.5, bottom: 0.5, left: 0.5),
      font_size: 11,
      font_family: "Helvetica",
      compress: True,
      ats_optimization: False,
      include_metadata: True,
    ),
    settings_version: 0,
    last_updated: 1_234_567_890,
  )
  assert validation.validate_settings(s)
    == Error(["settingsVersion must be greater than 0"])
}

pub fn settings_last_updated_zero_test() {
  let s = Settings(
    theme: Auto,
    default_config: ConversionConfig(
      page_size: Letter,
      margin: Margin(top: 0.5, right: 0.5, bottom: 0.5, left: 0.5),
      font_size: 11,
      font_family: "Helvetica",
      compress: True,
      ats_optimization: False,
      include_metadata: True,
    ),
    settings_version: 1,
    last_updated: 0,
  )
  assert validation.validate_settings(s)
    == Error(["lastUpdated must be greater than 0"])
}

pub fn settings_multiple_errors_test() {
  let s = Settings(
    theme: Auto,
    default_config: ConversionConfig(
      page_size: Letter,
      margin: Margin(top: 2.0, right: 0.5, bottom: 0.5, left: 0.5),
      font_size: 11,
      font_family: "Helvetica",
      compress: True,
      ats_optimization: False,
      include_metadata: True,
    ),
    settings_version: 0,
    last_updated: 0,
  )
  let result = validation.validate_settings(s)
  assert result
    == Error([
      "settingsVersion must be greater than 0",
      "lastUpdated must be greater than 0",
      "top margin must be between 0.0 and 1.5 inches",
    ])
}
