// ABOUTME: Settings page-size fieldset — Letter, A4, and Legal radio buttons.
// ABOUTME: Dispatches PageSizeChanged when the user selects a different paper size.

import app/model.{type Msg}
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import shared/types.{type Settings, A4, Legal, Letter}

pub fn view(settings: Settings) -> Element(Msg) {
  html.fieldset([attribute.class("space-y-2")], [
    html.legend([attribute.class("text-sm font-semibold text-foreground")], [
      html.text("Page Size"),
    ]),
    html.p([attribute.class("text-xs text-muted-foreground mb-3")], [
      html.text("Control PDF page dimensions"),
    ]),
    html.div([attribute.class("space-y-2")], [
      option("Letter", "Letter (8.5\" × 11\")", settings),
      option("A4", "A4 (210mm × 297mm)", settings),
      option("Legal", "Legal (8.5\" × 14\")", settings),
    ]),
  ])
}

fn option(value: String, label: String, settings: Settings) -> Element(Msg) {
  let is_selected = case settings.default_config.page_size {
    Letter -> value == "Letter"
    A4 -> value == "A4"
    Legal -> value == "Legal"
  }
  html.label(
    [
      attribute.class(
        "flex items-center gap-3 px-4 py-3 border border-border rounded-md cursor-pointer hover:bg-accent focus-within:ring-2 focus-within:ring-ring transition-colors",
      ),
    ],
    [
      html.input([
        attribute.type_("radio"),
        attribute.name("page-size"),
        attribute.value(value),
        attribute.checked(is_selected),
        attribute.class("text-primary focus:ring-ring"),
        event.on_change(fn(v) { model.PageSizeChanged(v) }),
      ]),
      html.span([attribute.class("text-sm text-foreground")], [html.text(label)]),
    ],
  )
}
