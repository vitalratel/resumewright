// ABOUTME: Settings panel view — tab bar (Page, General) and tab content dispatcher.
// ABOUTME: Dispatches SwitchTab, ShowMain, and delegates to sub-module views.

import app/model.{type Model, type Msg, GeneralTab, PageTab}
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
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
    [attribute.class("flex items-center justify-between")],
    [
      html.h2(
        [attribute.class("text-base font-semibold text-foreground")],
        [html.text("Settings")],
      ),
      html.button(
        [
          attribute.type_("button"),
          attribute.aria_label("Back to converter"),
          attribute.class("btn-icon"),
          event.on_click(model.ShowMain),
        ],
        [back_icon()],
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
      GeneralTab -> [general.view(m.settings)]
    },
  )
}

fn back_icon() -> Element(Msg) {
  html.span(
    [attribute.class("text-sm")],
    [html.text("←")],
  )
}
