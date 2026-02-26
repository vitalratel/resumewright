// ABOUTME: Phase 0 smoke test — proves Gleam/Lustre loads inside the Chrome extension.
// ABOUTME: Renders into #gleam-smoke (hidden) without touching the converter UI.

import lustre
import lustre/element/html

pub fn main() {
  let app = lustre.element(html.p([], [html.text("Hello from Gleam")]))
  let assert Ok(_) = lustre.start(app, "#gleam-smoke", Nil)
  Nil
}
