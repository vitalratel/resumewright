// ABOUTME: App shell — header with logo/help/settings buttons, main content slot, footer.
// ABOUTME: Wraps converter and settings views; help routes to its own full-screen view.

import app/model.{type Model, type Msg}
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/element/svg
import lustre/event

pub fn wrap(model: Model, content: Element(Msg)) -> Element(Msg) {
  html.div(
    [
      attribute.class(
        "flex flex-col min-h-screen bg-background text-foreground",
      ),
    ],
    [
      header(),
      html.main([attribute.class("flex-1 w-full max-w-lg mx-auto px-4 py-6")], [
        content,
      ]),
      footer(model),
      live_regions(model),
    ],
  )
}

fn header() -> Element(Msg) {
  html.header([attribute.class("w-full bg-primary text-primary-foreground")], [
    html.div(
      [
        attribute.class(
          "flex items-center justify-between w-full max-w-lg mx-auto px-4 py-3",
        ),
      ],
      [
        logo(),
        html.div([attribute.class("flex items-center gap-1")], [
          html.button(
            [
              attribute.type_("button"),
              attribute.aria_label("Help"),
              attribute.class("btn-header"),
              event.on_click(model.OpenHelp),
            ],
            [help_icon(), html.text("Help")],
          ),
          html.button(
            [
              attribute.id("btn-settings"),
              attribute.type_("button"),
              attribute.aria_label("Settings"),
              attribute.class("btn-header"),
              event.on_click(model.ShowSettings),
            ],
            [settings_icon(), html.text("Settings")],
          ),
        ]),
      ],
    ),
  ])
}

fn logo() -> Element(Msg) {
  html.div([attribute.class("flex items-center gap-2")], [
    html.img([
      attribute.src("/icons/icon-48.png"),
      attribute.alt(""),
      attribute.class("w-6 h-6"),
      attribute.aria_hidden(True),
    ]),
    html.span(
      [attribute.class("text-sm font-semibold text-primary-foreground")],
      [html.text("ResumeWright")],
    ),
  ])
}

fn footer(model: Model) -> Element(Msg) {
  html.footer([attribute.class("w-full border-t border-border")], [
    html.div(
      [
        attribute.class(
          "max-w-lg mx-auto px-4 py-3 flex items-center justify-between text-xs text-muted-foreground",
        ),
      ],
      [
        html.a(
          [
            attribute.href("https://resumewright.com/#faq"),
            attribute.attribute("target", "_blank"),
            attribute.attribute("rel", "noopener noreferrer"),
            attribute.class("btn-ghost flex items-center gap-1.5"),
          ],
          [footer_help_icon(), html.text("Help & FAQ")],
        ),
        html.span([attribute.class("flex items-center gap-1.5")], [
          footer_check_icon(),
          html.text("Privacy-first"),
        ]),
        html.span([], [html.text("v" <> model.version)]),
      ],
    ),
  ])
}

fn footer_help_icon() -> Element(Msg) {
  svg.svg(
    [
      attribute.attribute("width", "12"),
      attribute.attribute("height", "12"),
      attribute.attribute("viewBox", "0 0 24 24"),
      attribute.attribute("fill", "none"),
      attribute.attribute("stroke", "currentColor"),
      attribute.attribute("stroke-width", "2"),
      attribute.attribute("stroke-linecap", "round"),
      attribute.attribute("stroke-linejoin", "round"),
      attribute.aria_hidden(True),
    ],
    [
      svg.circle([
        attribute.attribute("cx", "12"),
        attribute.attribute("cy", "12"),
        attribute.attribute("r", "10"),
      ]),
      svg.path([
        attribute.attribute("d", "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"),
      ]),
      svg.line([
        attribute.attribute("x1", "12"),
        attribute.attribute("y1", "17"),
        attribute.attribute("x2", "12.01"),
        attribute.attribute("y2", "17"),
      ]),
    ],
  )
}

fn footer_check_icon() -> Element(Msg) {
  svg.svg(
    [
      attribute.attribute("width", "12"),
      attribute.attribute("height", "12"),
      attribute.attribute("viewBox", "0 0 24 24"),
      attribute.attribute("fill", "none"),
      attribute.attribute("stroke", "currentColor"),
      attribute.attribute("stroke-width", "2"),
      attribute.attribute("stroke-linecap", "round"),
      attribute.attribute("stroke-linejoin", "round"),
      attribute.aria_hidden(True),
      attribute.class("text-success"),
    ],
    [
      svg.path([attribute.attribute("d", "M22 11.08V12a10 10 0 1 1-5.93-9.14")]),
      svg.polyline([attribute.attribute("points", "22 4 12 14.01 9 11.01")]),
    ],
  )
}

fn live_regions(model: Model) -> Element(Msg) {
  html.div([attribute.class("sr-only")], [
    html.div(
      [
        attribute.role("status"),
        attribute.aria_live("polite"),
        attribute.aria_atomic(True),
      ],
      [html.text(model.announcement)],
    ),
    html.div(
      [
        attribute.aria_live("assertive"),
        attribute.aria_atomic(True),
      ],
      [html.text(model.error_announcement)],
    ),
  ])
}

fn settings_icon() -> Element(Msg) {
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
      svg.circle([
        attribute.attribute("cx", "12"),
        attribute.attribute("cy", "12"),
        attribute.attribute("r", "3"),
      ]),
      svg.path([
        attribute.attribute(
          "d",
          "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
        ),
      ]),
    ],
  )
}

fn help_icon() -> Element(Msg) {
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
      svg.circle([
        attribute.attribute("cx", "12"),
        attribute.attribute("cy", "12"),
        attribute.attribute("r", "10"),
      ]),
      svg.path([
        attribute.attribute("d", "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"),
      ]),
      svg.line([
        attribute.attribute("x1", "12"),
        attribute.attribute("y1", "17"),
        attribute.attribute("x2", "12.01"),
        attribute.attribute("y2", "17"),
      ]),
    ],
  )
}
