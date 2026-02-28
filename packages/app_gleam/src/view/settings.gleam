// ABOUTME: Settings panel view — tab bar (Page, General) and tab content dispatcher.
// ABOUTME: Dispatches SwitchTab, ShowMain, and delegates to sub-module views.

import app/model.{type Model, type Msg, GeneralTab, PageTab}
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/element/svg
import lustre/event
import view/settings/general
import view/settings/margins
import view/settings/page_size

pub fn view(model: Model) -> Element(Msg) {
  html.div(
    [attribute.class("space-y-5")],
    [
      settings_header(),
      tab_bar(model),
      tab_content(model),
    ],
  )
}

fn settings_header() -> Element(Msg) {
  html.div(
    [attribute.class("relative flex items-center mb-1")],
    [
      html.button(
        [
          attribute.type_("button"),
          attribute.aria_label("Back to converter"),
          attribute.class("btn-ghost flex items-center gap-1.5 text-sm"),
          event.on_click(model.ShowMain),
        ],
        [back_icon(), html.text("Back")],
      ),
      html.h1(
        [
          attribute.class(
            "absolute inset-x-0 text-center text-lg font-semibold text-foreground pointer-events-none",
          ),
        ],
        [html.text("Settings")],
      ),
    ],
  )
}

fn tab_bar(m: Model) -> Element(Msg) {
  html.div(
    [
      attribute.role("tablist"),
      attribute.aria_label("Settings sections"),
      attribute.class("flex gap-1 border-b border-border"),
    ],
    [
      tab_button("Page", PageTab, m.settings_tab == PageTab),
      tab_button("General", GeneralTab, m.settings_tab == GeneralTab),
    ],
  )
}

fn tab_button(label: String, tab: model.SettingsTab, selected: Bool) -> Element(Msg) {
  let tab_id = case tab {
    PageTab -> "tab-page"
    GeneralTab -> "tab-general"
  }
  html.button(
    [
      attribute.id(tab_id),
      attribute.type_("button"),
      attribute.role("tab"),
      attribute.aria_selected(selected),
      attribute.class("btn-tab"),
      event.on_click(model.SwitchTab(tab)),
    ],
    [html.text(label)],
  )
}

fn tab_content(m: Model) -> Element(Msg) {
  html.div(
    [attribute.class("space-y-4")],
    case m.settings_tab {
      PageTab -> [page_size.view(m.settings), margins.view(m.settings)]
      GeneralTab -> [general.view(m.settings, m.reset_confirm)]
    },
  )
}

fn back_icon() -> Element(Msg) {
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
    [svg.path([attribute.attribute("d", "m15 18-6-6 6-6")])],
  )
}
