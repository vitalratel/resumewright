// ABOUTME: View for the converting state — progress bar, stage label, and cancel button.
// ABOUTME: Rendered while the background service worker is generating the PDF.

import app/model.{type Msg}
import gleam/int
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/event

pub fn view(file: model.ImportedFile, progress: model.Progress) -> Element(Msg) {
  html.section(
    [
      attribute.class(
        "animate-fade-in flex flex-col items-center justify-center gap-4 py-8",
      ),
    ],
    [
      html.h1(
        [
          attribute.class(
            "text-xl font-semibold tracking-tight text-foreground text-center",
          ),
        ],
        [html.text("Converting your CV...")],
      ),
      html.p(
        [
          attribute.class(
            "text-base text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded-md border border-border max-w-full truncate",
          ),
        ],
        [html.text(file.name)],
      ),
      html.div(
        [
          attribute.class("w-full bg-muted rounded-full h-2 overflow-hidden"),
          attribute.role("progressbar"),
          attribute.aria_valuemin("0"),
          attribute.aria_valuemax("100"),
          attribute.aria_valuenow(int.to_string(progress.percentage)),
          attribute.aria_label("Conversion progress"),
        ],
        [
          html.div(
            [
              attribute.class(
                "progress-bar-fill h-full bg-primary rounded-full",
              ),
            ],
            [],
          ),
        ],
      ),
      html.div(
        [
          attribute.class("text-center space-y-1"),
          attribute.data("testid", "progress-status"),
        ],
        [
          html.p([attribute.class("text-2xl font-bold text-foreground")], [
            html.text(int.to_string(progress.percentage) <> "%"),
          ]),
          html.p([attribute.class("text-sm text-muted-foreground")], [
            html.text(progress.stage),
          ]),
        ],
      ),
      html.button(
        [
          attribute.type_("button"),
          attribute.class("btn-ghost mt-2 px-4 py-2 text-sm"),
          event.on_click(model.CancelClicked),
        ],
        [html.text("Cancel")],
      ),
    ],
  )
}
