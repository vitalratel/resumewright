// ABOUTME: Tests for theme FFI type signatures and pure theme class logic.
// ABOUTME: DOM-side effects (apply_theme_class) require browser context; tested via E2E.

import ffi/theme

pub fn system_prefers_dark_type_test() {
  let _: fn() -> Bool = theme.system_prefers_dark
  Nil
}

pub fn apply_theme_class_type_test() {
  let _: fn(String) -> Nil = theme.apply_theme_class
  Nil
}

pub fn css_class_for_light_test() {
  assert theme.css_class("light") == "light"
}

pub fn css_class_for_dark_test() {
  assert theme.css_class("dark") == "dark"
}

pub fn css_class_for_auto_is_empty_test() {
  assert theme.css_class("auto") == ""
}

pub fn css_class_for_unknown_is_empty_test() {
  assert theme.css_class("nonsense") == ""
}
