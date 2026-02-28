// ABOUTME: View for the ready state — file info card, export button, settings summary.
// ABOUTME: Rendered after TSX validation passes and the file is ready for conversion.

import app/model.{type Msg}
import gleam/int
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/element/svg
import lustre/event
import shared/types.{type Settings, A4, Legal, Letter}

pub fn view(file: model.ImportedFile, settings: Settings) -> Element(Msg) {
  html.div([attribute.class("animate-fade-in space-y-4")], [
    file_card(file),
    export_button(),
    settings_summary_line(settings),
  ])
}

fn file_card(file: model.ImportedFile) -> Element(Msg) {
  html.div(
    [
      attribute.class(
        "border-2 border-success bg-success/10 rounded-lg p-4 flex items-center justify-between gap-3",
      ),
    ],
    [
      html.div([attribute.class("flex items-center gap-3 min-w-0")], [
        file_icon(),
        html.div([attribute.class("min-w-0")], [
          html.p(
            [
              attribute.class("text-sm font-medium text-success-text truncate"),
            ],
            [html.text(file.name)],
          ),
          html.p([attribute.class("text-xs text-success-text/80")], [
            html.text(format_file_size(file.size)),
          ]),
        ]),
      ]),
      html.button(
        [
          attribute.type_("button"),
          attribute.aria_label("Remove file"),
          attribute.class(
            "btn-icon text-success-text/60 hover:text-success-text",
          ),
          event.on_click(model.FileCleared),
        ],
        [close_icon()],
      ),
    ],
  )
}

fn export_button() -> Element(Msg) {
  html.button(
    [
      attribute.type_("button"),
      attribute.data("testid", "export-button"),
      attribute.aria_keyshortcuts("Control+e"),
      attribute.class(
        "btn-primary w-full py-3 px-4 font-semibold flex items-center justify-center gap-2",
      ),
      event.on_click(model.ExportClicked),
    ],
    [
      export_icon(),
      html.text("Export to PDF"),
      html.kbd(
        [
          attribute.class(
            "ml-1 px-1.5 py-0.5 text-xs font-mono bg-primary-foreground/20 rounded border border-primary-foreground/30",
          ),
          attribute.aria_hidden(True),
        ],
        [html.text("Ctrl E")],
      ),
    ],
  )
}

fn settings_summary_line(settings: Settings) -> Element(Msg) {
  html.p([attribute.class("text-center text-xs text-muted-foreground")], [
    html.text("Current settings: "),
    html.span([], [html.text(settings_summary(settings))]),
    html.button(
      [
        attribute.type_("button"),
        attribute.class("btn-link ml-1"),
        event.on_click(model.ShowSettings),
      ],
      [html.text("Change")],
    ),
  ])
}

fn settings_summary(settings: Settings) -> String {
  let page = case settings.default_config.page_size {
    Letter -> "Letter"
    A4 -> "A4"
    Legal -> "Legal"
  }
  let m = settings.default_config.margin
  let margin_label = case
    m.top == 0.5 && m.right == 0.5 && m.bottom == 0.5 && m.left == 0.5
  {
    True -> "Compact margins"
    False -> "Custom margins"
  }
  page <> ", " <> margin_label
}

fn format_file_size(bytes: Int) -> String {
  case bytes {
    b if b >= 1_048_576 -> int.to_string(b / 1_048_576) <> " MB"
    b if b >= 1024 -> int.to_string(b / 1024) <> " KB"
    _ -> int.to_string(bytes) <> " B"
  }
}

fn file_icon() -> Element(Msg) {
  svg.svg(
    [
      attribute.attribute("width", "20"),
      attribute.attribute("height", "20"),
      attribute.attribute("viewBox", "0 0 24 24"),
      attribute.attribute("fill", "none"),
      attribute.attribute("stroke", "currentColor"),
      attribute.attribute("stroke-width", "2"),
      attribute.attribute("stroke-linecap", "round"),
      attribute.attribute("stroke-linejoin", "round"),
      attribute.aria_hidden(True),
      attribute.class("text-success-text shrink-0"),
    ],
    [
      svg.path([
        attribute.attribute(
          "d",
          "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
        ),
      ]),
      svg.polyline([attribute.attribute("points", "14 2 14 8 20 8")]),
      svg.line([
        attribute.attribute("x1", "16"),
        attribute.attribute("y1", "13"),
        attribute.attribute("x2", "8"),
        attribute.attribute("y2", "13"),
      ]),
      svg.line([
        attribute.attribute("x1", "16"),
        attribute.attribute("y1", "17"),
        attribute.attribute("x2", "8"),
        attribute.attribute("y2", "17"),
      ]),
    ],
  )
}

fn close_icon() -> Element(Msg) {
  svg.svg(
    [
      attribute.attribute("width", "16"),
      attribute.attribute("height", "16"),
      attribute.aria_hidden(True),
    ],
    [svg.use_([attribute.attribute("href", "#icon-close")])],
  )
}

fn export_icon() -> Element(Msg) {
  svg.svg(
    [
      attribute.attribute("width", "16"),
      attribute.attribute("height", "16"),
      attribute.attribute("viewBox", "0 0 24 24"),
      attribute.attribute("fill", "none"),
      attribute.attribute("stroke", "currentColor"),
      attribute.attribute("stroke-width", "2"),
      attribute.attribute("stroke-linecap", "round"),
      attribute.attribute("stroke-linejoin", "round"),
      attribute.aria_hidden(True),
    ],
    [
      svg.path([
        attribute.attribute(
          "d",
          "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
        ),
      ]),
      svg.polyline([attribute.attribute("points", "14 2 14 8 20 8")]),
      svg.line([
        attribute.attribute("x1", "12"),
        attribute.attribute("y1", "18"),
        attribute.attribute("x2", "12"),
        attribute.attribute("y2", "12"),
      ]),
      svg.polyline([attribute.attribute("points", "9 15 12 18 15 15")]),
    ],
  )
}
