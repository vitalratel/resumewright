// ABOUTME: View for the success state — PDF ready confirmation, countdown, and action buttons.
// ABOUTME: Rendered after the background service worker completes PDF generation.

import app/model.{type Msg}
import gleam/int
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/element/svg
import lustre/event

pub fn view(
  filename: String,
  file_size: Int,
  duration: Int,
  countdown: Int,
  paused: Bool,
) -> Element(Msg) {
  html.section(
    [
      attribute.class("animate-fade-in flex flex-col items-center gap-4 py-8"),
      attribute.role("status"),
      attribute.aria_live("polite"),
      attribute.data("testid", "success-state"),
    ],
    [
      checkmark_circle(),
      html.h1([attribute.class("text-2xl font-bold text-foreground")], [
        html.text("PDF Ready"),
      ]),
      html.div([attribute.class("flex items-center gap-2 max-w-full")], [
        html.span(
          [
            attribute.class(
              "text-base text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded-md border border-border truncate max-w-xs",
            ),
          ],
          [html.text(filename)],
        ),
        html.button(
          [
            attribute.type_("button"),
            attribute.aria_label("Copy filename"),
            attribute.class("btn-icon"),
            event.on_click(model.CopyFilenameClicked),
          ],
          [copy_icon()],
        ),
      ]),
      html.div(
        [
          attribute.class(
            "w-full px-4 py-2.5 bg-success/10 border border-success/30 rounded-md flex items-center justify-center gap-2 text-sm text-success-text",
          ),
        ],
        [download_icon(), html.text("Downloaded to your computer")],
      ),
      html.details([attribute.class("w-full text-sm text-muted-foreground")], [
        html.summary(
          [
            attribute.class(
              "cursor-pointer hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
            ),
          ],
          [html.text("View export details")],
        ),
        html.div([attribute.class("mt-2 ml-4 space-y-1 text-xs")], [
          html.p([], [html.text("Size: " <> format_file_size(file_size))]),
          html.p([], [html.text("Duration: " <> format_duration(duration))]),
        ]),
      ]),
      html.button(
        [
          attribute.type_("button"),
          attribute.class("btn-link text-sm"),
          event.on_click(model.ConvertAnotherClicked),
        ],
        [html.text("Convert another CV")],
      ),
      html.p(
        [
          attribute.class(
            "text-xs text-muted-foreground flex items-center gap-2",
          ),
        ],
        [
          html.text("Closing in "),
          html.span([], [html.text(int.to_string(countdown))]),
          html.text("s "),
          html.button(
            [
              attribute.type_("button"),
              attribute.class("btn-link"),
              event.on_click(model.PauseCountdownClicked),
            ],
            [
              html.text(case paused {
                True -> "Resume"
                False -> "Pause"
              }),
            ],
          ),
          html.button(
            [
              attribute.type_("button"),
              attribute.class("btn-link"),
              event.on_click(model.CloseTabClicked),
            ],
            [html.text("Close")],
          ),
        ],
      ),
    ],
  )
}

fn format_file_size(bytes: Int) -> String {
  case bytes {
    b if b >= 1_048_576 -> int.to_string(b / 1_048_576) <> " MB"
    b if b >= 1024 -> int.to_string(b / 1024) <> " KB"
    _ -> int.to_string(bytes) <> " B"
  }
}

fn format_duration(ms: Int) -> String {
  case ms {
    m if m >= 1000 ->
      int.to_string(m / 1000) <> "." <> int.to_string({ m % 1000 } / 100) <> "s"
    _ -> int.to_string(ms) <> "ms"
  }
}

fn checkmark_circle() -> Element(Msg) {
  html.div(
    [
      attribute.class(
        "w-16 h-16 rounded-full bg-success/10 flex items-center justify-center animate-check-in",
      ),
    ],
    [
      svg.svg(
        [
          attribute.attribute("width", "32"),
          attribute.attribute("height", "32"),
          attribute.attribute("viewBox", "0 0 24 24"),
          attribute.attribute("fill", "none"),
          attribute.attribute("stroke", "currentColor"),
          attribute.attribute("stroke-width", "2.5"),
          attribute.attribute("stroke-linecap", "round"),
          attribute.attribute("stroke-linejoin", "round"),
          attribute.aria_hidden(True),
          attribute.class("text-success"),
        ],
        [svg.path([attribute.attribute("d", "M20 6 9 17l-5-5")])],
      ),
    ],
  )
}

fn copy_icon() -> Element(Msg) {
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
      svg.rect([
        attribute.attribute("x", "9"),
        attribute.attribute("y", "9"),
        attribute.attribute("width", "13"),
        attribute.attribute("height", "13"),
        attribute.attribute("rx", "2"),
        attribute.attribute("ry", "2"),
      ]),
      svg.path([
        attribute.attribute(
          "d",
          "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
        ),
      ]),
    ],
  )
}

fn download_icon() -> Element(Msg) {
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
        attribute.attribute("d", "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"),
      ]),
      svg.polyline([attribute.attribute("points", "7 10 12 15 17 10")]),
      svg.line([
        attribute.attribute("x1", "12"),
        attribute.attribute("y1", "15"),
        attribute.attribute("x2", "12"),
        attribute.attribute("y2", "3"),
      ]),
    ],
  )
}
