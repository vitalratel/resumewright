// ABOUTME: Settings margins fieldset — sliders, stepper buttons, and visual preview box.
// ABOUTME: Dispatches MarginChanged for slider input and stepper button clicks.

import app/model.{type Msg}
import gleam/dynamic/decode
import gleam/float
import gleam/int
import gleam/result
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import shared/types.{type Margin, type Settings}

pub fn view(settings: Settings) -> Element(Msg) {
  let margin = settings.default_config.margin
  html.fieldset(
    [attribute.class("space-y-3")],
    [
      html.legend(
        [attribute.class("text-sm font-semibold text-foreground")],
        [html.text("Margins")],
      ),
      html.p(
        [attribute.class("text-xs text-muted-foreground")],
        [html.text("In inches (0.25 - 1.5). Use arrow keys to adjust.")],
      ),
      html.div(
        [attribute.class("flex gap-6 items-center")],
        [
          html.div(
            [attribute.class("flex-1 space-y-3 min-w-0")],
            [
              row("top", "Top", margin.top),
              row("bottom", "Bottom", margin.bottom),
              row("left", "Left", margin.left),
              row("right", "Right", margin.right),
            ],
          ),
          preview(margin),
        ],
      ),
    ],
  )
}

fn row(side: String, label: String, value: Float) -> Element(Msg) {
  let new_minus = float.max(0.25, value -. 0.05)
  let new_plus = float.min(1.5, value +. 0.05)
  html.div(
    [attribute.class("flex items-center gap-3")],
    [
      html.label(
        [
          attribute.for("margin-" <> side),
          attribute.class("w-12 text-sm text-muted-foreground"),
        ],
        [html.text(label)],
      ),
      html.button(
        [
          attribute.type_("button"),
          attribute.aria_label("Decrease " <> label <> " margin"),
          attribute.class("btn-stepper"),
          event.on_click(model.MarginChanged(side, new_minus)),
        ],
        [html.text("−")],
      ),
      html.input([
        attribute.id("margin-" <> side),
        attribute.name("margin-" <> side),
        attribute.type_("range"),
        attribute.min("0.25"),
        attribute.max("1.5"),
        attribute.step("0.05"),
        attribute.value(float.to_string(value)),
        attribute.class("flex-1 min-w-0 text-primary accent-primary"),
        attribute.aria_label(label <> " margin in inches"),
        event.on("input", slider_decoder(side)),
      ]),
      html.button(
        [
          attribute.type_("button"),
          attribute.aria_label("Increase " <> label <> " margin"),
          attribute.class("btn-stepper"),
          event.on_click(model.MarginChanged(side, new_plus)),
        ],
        [html.text("+")],
      ),
      html.span(
        [
          attribute.class(
            "w-12 text-sm text-right text-muted-foreground tabular-nums",
          ),
        ],
        [html.text(fmt(value))],
      ),
    ],
  )
}

fn preview(margin: Margin) -> Element(Msg) {
  html.div(
    [attribute.class("flex flex-col items-center gap-1 shrink-0")],
    [
      html.p(
        [attribute.class("text-xs text-muted-foreground")],
        [html.text("Preview")],
      ),
      html.div(
        [
          attribute.class(
            "margin-preview-box relative border-2 border-primary/40 bg-card rounded",
          ),
        ],
        [
          html.div(
            [
              attribute.class(
                "margin-preview-overlay absolute bg-primary/10 border border-primary/20",
              ),
            ],
            [],
          ),
          html.span(
            [attribute.class("margin-label-top absolute text-[9px] text-muted-foreground")],
            [html.text(fmt(margin.top))],
          ),
          html.span(
            [attribute.class("margin-label-bottom absolute text-[9px] text-muted-foreground")],
            [html.text(fmt(margin.bottom))],
          ),
          html.span(
            [attribute.class("margin-label-left absolute text-[9px] text-muted-foreground")],
            [html.text(fmt(margin.left))],
          ),
          html.span(
            [attribute.class("margin-label-right absolute text-[9px] text-muted-foreground")],
            [html.text(fmt(margin.right))],
          ),
        ],
      ),
    ],
  )
}

fn slider_decoder(side: String) -> decode.Decoder(Msg) {
  use val_str <- decode.subfield(["target", "value"], decode.string)
  let f = result.unwrap(float.parse(val_str), 0.0)
  decode.success(model.MarginChanged(side, f))
}

fn fmt(v: Float) -> String {
  // Format a margin value to 2 decimal places with inch symbol
  let hundredths = float.round(v *. 100.0)
  let whole = hundredths / 100
  let frac = result.unwrap(int.remainder(hundredths, 100), 0)
  let frac_str = case frac < 10 {
    True -> "0" <> int.to_string(frac)
    False -> int.to_string(frac)
  }
  int.to_string(whole) <> "." <> frac_str <> "\""
}

