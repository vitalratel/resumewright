// ABOUTME: Settings general fieldset — theme selector (light/dark/system) and reset button.
// ABOUTME: Dispatches ThemeChanged and ResetSettings messages.

import app/model.{type Msg}
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/element/svg
import lustre/event
import shared/types.{type Settings, Auto, Dark, Light}

pub fn view(settings: Settings) -> Element(Msg) {
  html.div(
    [attribute.class("space-y-4")],
    [
      theme_fieldset(settings),
      reset_section(),
    ],
  )
}

fn theme_fieldset(settings: Settings) -> Element(Msg) {
  let current = settings.theme
  html.fieldset(
    [attribute.class("space-y-2")],
    [
      html.legend(
        [attribute.class("text-sm font-semibold text-foreground")],
        [html.text("Theme")],
      ),
      html.p(
        [attribute.class("text-xs text-muted-foreground mb-3")],
        [html.text("PDF rendering color mode")],
      ),
      html.div(
        [attribute.class("flex gap-2")],
        [
          theme_button("light", "Light", light_icon(), current == Light),
          theme_button("dark", "Dark", dark_icon(), current == Dark),
          theme_button("system", "System", system_icon(), current == Auto),
        ],
      ),
    ],
  )
}

fn theme_button(
  value: String,
  label: String,
  icon: Element(Msg),
  pressed: Bool,
) -> Element(Msg) {
  html.button(
    [
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

fn reset_section() -> Element(Msg) {
  html.div(
    [attribute.class("border-t border-border pt-4 mt-2")],
    [
      html.p(
        [attribute.class("text-xs text-muted-foreground mb-3")],
        [html.text("Restore all settings to their default values.")],
      ),
      html.button(
        [
          attribute.type_("button"),
          attribute.data("testid", "reset-settings"),
          attribute.class("btn-warning"),
          event.on_click(model.ResetRequested),
        ],
        [html.text("Reset to Defaults")],
      ),
    ],
  )
}

fn light_icon() -> Element(Msg) {
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
    [
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
    ],
  )
}

fn dark_icon() -> Element(Msg) {
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
    [
      svg.path([
        attribute.attribute("d", "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"),
      ]),
    ],
  )
}

fn system_icon() -> Element(Msg) {
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
    [
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
    ],
  )
}
