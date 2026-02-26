// ABOUTME: App shell — header with logo/help, main content slot, footer with version.
// ABOUTME: Also renders the help dialog and ARIA live regions for announcements.

import app/model.{type Model, type Msg}
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/element/svg
import lustre/event

pub fn wrap(model: Model, content: Element(Msg)) -> Element(Msg) {
  html.div(
    [attribute.class("flex flex-col min-h-screen bg-background text-foreground")],
    [
      header(model),
      html.main(
        [attribute.class("flex-1 w-full max-w-lg mx-auto px-4 py-6")],
        [content],
      ),
      footer(model),
      help_dialog(model),
      live_regions(model),
    ],
  )
}

fn header(model: Model) -> Element(Msg) {
  html.header(
    [attribute.class("border-b border-border bg-card")],
    [
      html.div(
        [
          attribute.class(
            "flex items-center justify-between w-full max-w-lg mx-auto px-4 py-3",
          ),
        ],
        [
          logo(),
          html.button(
            [
              attribute.type_("button"),
              attribute.aria_label("Help"),
              attribute.aria_expanded(model.help_open),
              attribute.class("btn-icon"),
              event.on_click(model.OpenHelp),
            ],
            [help_icon()],
          ),
        ],
      ),
    ],
  )
}

fn logo() -> Element(Msg) {
  html.div(
    [attribute.class("flex items-center gap-2")],
    [
      html.img([
        attribute.src("/icons/icon-48.png"),
        attribute.alt(""),
        attribute.class("w-6 h-6"),
        attribute.aria_hidden(True),
      ]),
      html.span(
        [attribute.class("text-sm font-semibold text-foreground")],
        [html.text("ResumeWright")],
      ),
    ],
  )
}

fn footer(model: Model) -> Element(Msg) {
  html.footer(
    [attribute.class("border-t border-border bg-card")],
    [
      html.p(
        [
          attribute.class(
            "text-xs text-muted-foreground text-center py-2",
          ),
        ],
        [html.text("v" <> model.version)],
      ),
    ],
  )
}

fn help_dialog(model: Model) -> Element(Msg) {
  html.div(
    [
      attribute.role("dialog"),
      attribute.aria_modal(True),
      attribute.aria_label("Help"),
      attribute.hidden(!model.help_open),
      attribute.class(
        "fixed inset-0 z-50 flex items-center justify-center bg-background/80",
      ),
    ],
    [
      html.div(
        [
          attribute.class(
            "bg-card border border-border rounded-lg shadow-lg p-6 w-full max-w-sm mx-4 space-y-4",
          ),
        ],
        [
          html.div(
            [attribute.class("flex items-center justify-between")],
            [
              html.h2(
                [attribute.class("text-base font-semibold text-foreground")],
                [html.text("Help")],
              ),
              html.button(
                [
                  attribute.type_("button"),
                  attribute.aria_label("Close help"),
                  attribute.class("btn-icon"),
                  event.on_click(model.CloseHelp),
                ],
                [close_icon()],
              ),
            ],
          ),
          html.div(
            [attribute.class("space-y-3 text-sm text-muted-foreground")],
            [
              html.p(
                [],
                [
                  html.text("1. Ask Claude.ai to write your CV as a React component"),
                ],
              ),
              html.p(
                [],
                [
                  html.text("2. Save the code as a "),
                  html.code(
                    [attribute.class("code-inline")],
                    [html.text(".tsx")],
                  ),
                  html.text(" file"),
                ],
              ),
              html.p([], [html.text("3. Drop it here to convert to PDF")]),
              html.p(
                [attribute.class("pt-2")],
                [
                  html.text("Keyboard shortcut: "),
                  html.kbd(
                    [
                      attribute.class(
                        "px-1.5 py-0.5 text-xs font-mono bg-muted rounded border border-border",
                      ),
                    ],
                    [html.text("Ctrl E")],
                  ),
                  html.text(" to export"),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  )
}

fn live_regions(model: Model) -> Element(Msg) {
  html.div(
    [attribute.class("sr-only")],
    [
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
          attribute.role("alert"),
          attribute.aria_live("assertive"),
          attribute.aria_atomic(True),
        ],
        [html.text(model.error_announcement)],
      ),
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
      svg.path([attribute.attribute("d", "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3")]),
      svg.line([
        attribute.attribute("x1", "12"),
        attribute.attribute("y1", "17"),
        attribute.attribute("x2", "12.01"),
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
