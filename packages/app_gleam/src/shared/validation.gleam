// ABOUTME: Validation for domain types — margin bounds, version constraints, config invariants.
// ABOUTME: Returns a list of error strings so callers surface all failures at once.

import gleam/list
import shared/types.{type ConversionConfig, type Margin, type Settings}

/// Validates a Margin, checking each side is within [0.0, 1.5] inches.
pub fn validate_margin(margin: Margin) -> Result(Margin, List(String)) {
  let errors =
    [
      check_margin_side("top", margin.top),
      check_margin_side("right", margin.right),
      check_margin_side("bottom", margin.bottom),
      check_margin_side("left", margin.left),
    ]
    |> list.filter_map(fn(r) {
      case r {
        Ok(_) -> Error(Nil)
        Error(msg) -> Ok(msg)
      }
    })
  case errors {
    [] -> Ok(margin)
    _ -> Error(errors)
  }
}

fn check_margin_side(side: String, value: Float) -> Result(Nil, String) {
  case value <. 0.0 || value >. 1.5 {
    True -> Error(side <> " margin must be between 0.0 and 1.5 inches")
    False -> Ok(Nil)
  }
}

/// Validates a ConversionConfig. PageSize is always valid (typed enum).
pub fn validate_conversion_config(
  config: ConversionConfig,
) -> Result(ConversionConfig, List(String)) {
  case validate_margin(config.margin) {
    Ok(_) -> Ok(config)
    Error(errs) -> Error(errs)
  }
}

/// Validates Settings: version > 0, last_updated > 0, and config is valid.
pub fn validate_settings(settings: Settings) -> Result(Settings, List(String)) {
  let version_errors = case settings.settings_version > 0 {
    True -> []
    False -> ["settingsVersion must be greater than 0"]
  }
  let updated_errors = case settings.last_updated > 0 {
    True -> []
    False -> ["lastUpdated must be greater than 0"]
  }
  let config_errors = case validate_conversion_config(settings.default_config) {
    Ok(_) -> []
    Error(errs) -> errs
  }
  let all_errors = list.flatten([version_errors, updated_errors, config_errors])
  case all_errors {
    [] -> Ok(settings)
    _ -> Error(all_errors)
  }
}
