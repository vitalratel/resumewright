// ABOUTME: Settings general fieldset — theme selector (light/dark/auto) and reset button.
// ABOUTME: Dispatches ThemeChanged, ResetRequested, ResetCancelled, ResetConfirmed messages.

import app/model.{type Msg}
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/element/svg
import lustre/event
import shared/types.{type Settings, Auto, Dark, Light}

pub fn view(settings: Settings, reset_confirm: Bool) -> Element(Msg) {
  html.div([attribute.class("space-y-4")], [
    theme_fieldset(settings),
    reset_section(reset_confirm),
  ])
}

fn theme_fieldset(settings: Settings) -> Element(Msg) {
  let current = settings.theme
  html.fieldset([attribute.class("space-y-2")], [
    html.legend([attribute.class("text-sm font-semibold text-foreground")], [
      html.text("Theme"),
    ]),
    html.div([attribute.class("flex gap-2")], [
      theme_button("light", "Light", light_icon(), current == Light),
      theme_button("dark", "Dark", dark_icon(), current == Dark),
      theme_button("auto", "Auto", system_icon(), current == Auto),
    ]),
    html.p([attribute.class("text-xs text-muted-foreground")], [
      html.text("Follows your system preference"),
    ]),
  ])
}

fn theme_button(
  value: String,
  label: String,
  icon: Element(Msg),
  pressed: Bool,
) -> Element(Msg) {
  html.button(
    [
      attribute.id("theme-" <> value),
      attribute.type_("button"),
      attribute.class("btn-theme"),
      attribute.aria_pressed(case pressed {
        True -> "true"
        False -> "false"
      }),
      event.on_click(model.ThemeChanged(value)),
    ],
    [
      icon,
      html.span([], [html.text(label)]),
    ],
  )
}

fn reset_section(reset_confirm: Bool) -> Element(Msg) {
  case reset_confirm {
    False ->
      html.button(
        [
          attribute.type_("button"),
          attribute.data("testid", "reset-settings"),
          attribute.class("btn-outline w-full py-2.5 px-4 rounded-md"),
          event.on_click(model.ResetRequested),
        ],
        [html.text("Reset to Defaults")],
      )
    True ->
      html.div(
        [
          attribute.class(
            "p-4 border border-warning/50 bg-warning/10 rounded-md text-sm space-y-3",
          ),
        ],
        [
          html.p([attribute.class("text-warning-text font-medium")], [
            html.text("Reset all settings to defaults?"),
          ]),
          html.div([attribute.class("flex gap-3")], [
            html.button(
              [
                attribute.type_("button"),
                attribute.class("btn-warning flex-1 py-2 px-3"),
                event.on_click(model.ResetConfirmed),
              ],
              [html.text("Reset")],
            ),
            html.button(
              [
                attribute.type_("button"),
                attribute.class("btn-outline flex-1 py-2 px-3 rounded"),
                event.on_click(model.ResetCancelled),
              ],
              [html.text("Cancel")],
            ),
          ]),
        ],
      )
  }
}

fn theme_icon(children: List(Element(Msg))) -> Element(Msg) {
  svg.svg(
    [
      attribute.attribute("width", "14"),
      attribute.attribute("height", "14"),
      attribute.attribute("viewBox", "0 0 24 24"),
      attribute.attribute("fill", "none"),
      attribute.attribute("stroke", "currentColor"),
      attribute.attribute("stroke-width", "2"),
      attribute.attribute("stroke-linecap", "round"),
      attribute.attribute("stroke-linejoin", "round"),
      attribute.aria_hidden(True),
    ],
    children,
  )
}

fn light_icon() -> Element(Msg) {
  theme_icon([
    svg.circle([
      attribute.attribute("cx", "12"),
      attribute.attribute("cy", "12"),
      attribute.attribute("r", "5"),
    ]),
    svg.line([
      attribute.attribute("x1", "12"),
      attribute.attribute("y1", "1"),
      attribute.attribute("x2", "12"),
      attribute.attribute("y2", "3"),
    ]),
    svg.line([
      attribute.attribute("x1", "12"),
      attribute.attribute("y1", "21"),
      attribute.attribute("x2", "12"),
      attribute.attribute("y2", "23"),
    ]),
    svg.line([
      attribute.attribute("x1", "4.22"),
      attribute.attribute("y1", "4.22"),
      attribute.attribute("x2", "5.64"),
      attribute.attribute("y2", "5.64"),
    ]),
    svg.line([
      attribute.attribute("x1", "18.36"),
      attribute.attribute("y1", "18.36"),
      attribute.attribute("x2", "19.78"),
      attribute.attribute("y2", "19.78"),
    ]),
    svg.line([
      attribute.attribute("x1", "1"),
      attribute.attribute("y1", "12"),
      attribute.attribute("x2", "3"),
      attribute.attribute("y2", "12"),
    ]),
    svg.line([
      attribute.attribute("x1", "21"),
      attribute.attribute("y1", "12"),
      attribute.attribute("x2", "23"),
      attribute.attribute("y2", "12"),
    ]),
    svg.line([
      attribute.attribute("x1", "4.22"),
      attribute.attribute("y1", "19.78"),
      attribute.attribute("x2", "5.64"),
      attribute.attribute("y2", "18.36"),
    ]),
    svg.line([
      attribute.attribute("x1", "18.36"),
      attribute.attribute("y1", "5.64"),
      attribute.attribute("x2", "19.78"),
      attribute.attribute("y2", "4.22"),
    ]),
  ])
}

fn dark_icon() -> Element(Msg) {
  theme_icon([
    svg.path([
      attribute.attribute(
        "d",
        "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
      ),
    ]),
  ])
}

fn system_icon() -> Element(Msg) {
  theme_icon([
    svg.rect([
      attribute.attribute("x", "2"),
      attribute.attribute("y", "3"),
      attribute.attribute("width", "20"),
      attribute.attribute("height", "14"),
      attribute.attribute("rx", "2"),
      attribute.attribute("ry", "2"),
    ]),
    svg.line([
      attribute.attribute("x1", "8"),
      attribute.attribute("y1", "21"),
      attribute.attribute("x2", "16"),
      attribute.attribute("y2", "21"),
    ]),
    svg.line([
      attribute.attribute("x1", "12"),
      attribute.attribute("y1", "17"),
      attribute.attribute("x2", "12"),
      attribute.attribute("y2", "21"),
    ]),
  ])
}
