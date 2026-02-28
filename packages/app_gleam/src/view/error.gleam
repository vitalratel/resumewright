// ABOUTME: View for the error state — error message, suggestions, technical details, actions.
// ABOUTME: Retry button visibility depends on whether the original file is available for retry.

import app/model.{type Msg}
import gleam/list
import gleam/option.{type Option, None, Some}
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/element/svg
import lustre/event
import shared/types.{type ConversionError}

pub fn view(
  error: ConversionError,
  file: Option(model.ImportedFile),
) -> Element(Msg) {
  let has_file = case file {
    Some(_) -> True
    None -> False
  }
  let has_technical = case error.technical_details {
    Some(_) -> True
    None -> False
  }

  html.section(
    [
      attribute.class("animate-fade-in flex flex-col items-center gap-4 py-8"),
      attribute.aria_live("assertive"),
      attribute.aria_atomic(True),
      attribute.data("testid", "error-state"),
    ],
    [
      html.div(
        [
          attribute.class(
            "w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center",
          ),
        ],
        [alert_icon()],
      ),
      html.div([attribute.class("text-center space-y-1 w-full max-w-md")], [
        html.p(
          [
            attribute.class(
              "text-xs text-muted-foreground font-semibold uppercase tracking-wide",
            ),
          ],
          [html.text(error.code)],
        ),
        html.h1([attribute.class("text-lg font-semibold text-foreground")], [
          html.text(error.message),
        ]),
      ]),
      html.ul(
        [
          attribute.class(
            "w-full max-w-md text-sm text-muted-foreground space-y-1 list-disc list-inside",
          ),
        ],
        list.map(error.suggestions, fn(s) { html.li([], [html.text(s)]) }),
      ),
      html.details(
        [
          attribute.class("w-full max-w-md text-sm"),
          attribute.hidden(!has_technical),
        ],
        [
          html.summary(
            [
              attribute.class(
                "text-sm text-muted-foreground cursor-pointer hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
              ),
            ],
            [html.text("Technical details")],
          ),
          html.pre(
            [
              attribute.class(
                "mt-2 text-xs text-muted-foreground bg-muted p-3 rounded-md overflow-x-auto border border-border font-mono whitespace-pre-wrap",
              ),
            ],
            [
              html.text(case error.technical_details {
                Some(s) -> s
                None -> ""
              }),
            ],
          ),
        ],
      ),
      html.a(
        [
          attribute.href("https://github.com/vitalratel/resumewright/issues"),
          attribute.target("_blank"),
          attribute.rel("noopener noreferrer"),
          attribute.class(
            "text-sm text-primary underline hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
          ),
        ],
        [html.text("Need help? Report this issue on GitHub →")],
      ),
      html.div(
        [
          attribute.class(
            "flex flex-wrap items-center justify-center gap-3 mt-2",
          ),
        ],
        [
          html.button(
            [
              attribute.type_("button"),
              attribute.class("btn-primary px-4 py-2 font-medium"),
              attribute.hidden(!has_file),
              event.on_click(model.RetryClicked),
            ],
            [html.text("Retry")],
          ),
          html.button(
            [
              attribute.type_("button"),
              attribute.class("btn-secondary px-4 py-2 font-medium"),
              event.on_click(model.ImportDifferentClicked),
            ],
            [html.text("Import Different File")],
          ),
          html.button(
            [
              attribute.type_("button"),
              attribute.class("btn-ghost px-4 py-2 text-sm"),
              event.on_click(model.CopyErrorClicked),
            ],
            [html.text("Copy Error Details")],
          ),
        ],
      ),
    ],
  )
}

fn alert_icon() -> Element(Msg) {
  svg.svg(
    [
      attribute.attribute("width", "32"),
      attribute.attribute("height", "32"),
      attribute.aria_hidden(True),
      attribute.class("text-destructive"),
    ],
    [svg.use_([attribute.attribute("href", "#icon-alert-circle")])],
  )
}
