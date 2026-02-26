// ABOUTME: Theme detection and application — matchMedia FFI + pure CSS class helper.
// ABOUTME: apply_theme_class and system_prefers_dark require browser context.

/// Returns the CSS class name for a theme string, or "" for auto/unknown.
/// Auto mode is handled by the CSS media query; no class is needed on <html>.
pub fn css_class(theme: String) -> String {
  case theme {
    "light" | "dark" -> theme
    _ -> ""
  }
}

@external(javascript, "./theme_ffi.mjs", "system_prefers_dark")
pub fn system_prefers_dark() -> Bool

@external(javascript, "./theme_ffi.mjs", "apply_theme_class")
pub fn apply_theme_class(theme: String) -> Nil
