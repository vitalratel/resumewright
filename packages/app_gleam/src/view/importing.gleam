// ABOUTME: View for the importing state — drop zone, file input, and validation error.
// ABOUTME: Handles drag-drop and click-to-browse interactions for TSX file selection.

import app/model.{type Msg}
import ffi/app as app_ffi
import gleam/dynamic/decode
import gleam/option.{type Option, None, Some}
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/element/svg
import lustre/event

pub fn view(validation_error: Option(String), drag_over: Bool) -> Element(Msg) {
  html.div([], [
    html.h1([attribute.class("sr-only")], [html.text("Convert CV to PDF")]),
    tip_collapsible(),
    drop_zone(validation_error, drag_over),
    validation_error_div(validation_error),
    html.label(
      [
        attribute.for("file-input"),
        attribute.class(
          "btn-primary mt-4 w-full py-2.5 px-4 font-medium flex items-center justify-center cursor-pointer",
        ),
      ],
      [html.text("Browse Files")],
    ),
  ])
}

fn tip_collapsible() -> Element(Msg) {
  html.details([attribute.class("mb-4 text-sm text-muted-foreground")], [
    html.summary(
      [
        attribute.class(
          "flex items-center gap-2 cursor-pointer select-none hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-0.5",
        ),
      ],
      [
        info_icon(),
        html.text("GetTSX from Claude.ai"),
      ],
    ),
    html.div([attribute.class("mt-2 ml-5 space-y-1 text-muted-foreground")], [
      html.p([], [
        html.text(
          "1. Open Claude.ai and ask it to write your CV as a React component",
        ),
      ]),
      html.p([], [
        html.text("2. Save the generated code as a "),
        html.code([attribute.class("code-inline")], [html.text(".tsx")]),
        html.text(" file"),
      ]),
      html.p([], [html.text("3. Drop it below to convert to PDF")]),
    ]),
  ])
}

fn drop_zone(_validation_error: Option(String), drag_over: Bool) -> Element(Msg) {
  html.div(
    [
      attribute.id("drop-zone"),
      attribute.class(
        "border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-ring "
        <> case drag_over {
          True -> "border-primary bg-primary/10"
          False ->
            "border-primary/40 hover:border-primary/70 hover:bg-primary/5"
        },
      ),
      attribute.role("region"),
      attribute.aria_label("File drop zone"),
      attribute.aria_describedby("drop-zone-hint"),
      event.on("dragover", decode.success(model.DraggedOver))
        |> event.prevent_default,
      event.on("dragleave", decode.success(model.DragLeft)),
      event.on("drop", drop_file_decoder()) |> event.prevent_default,
    ],
    [
      upload_icon(),
      html.div([attribute.class("text-center")], [
        html.p([attribute.class("text-sm font-medium text-foreground")], [
          html.text("Drag & drop your CV file here"),
        ]),
        html.p(
          [
            attribute.id("drop-zone-hint"),
            attribute.class("text-xs text-muted-foreground mt-0.5"),
          ],
          [html.text("Supports: TSX files (up to 1MB)")],
        ),
      ]),
      html.input([
        attribute.id("file-input"),
        attribute.type_("file"),
        attribute.accept([".tsx", ".ts", ".jsx", ".js"]),
        attribute.class("sr-only"),
        attribute.data("testid", "file-input"),
        attribute.aria_label("Choose CV file"),
        attribute.tabindex(-1),
        event.on("change", input_file_decoder()),
      ]),
    ],
  )
}

fn validation_error_div(validation_error: Option(String)) -> Element(Msg) {
  html.div(
    [
      attribute.id("validation-error"),
      attribute.data("testid", "validation-error"),
      attribute.hidden(validation_error == None),
      attribute.role("alert"),
      attribute.class(
        "mt-3 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive-text flex items-start gap-2",
      ),
    ],
    [
      alert_icon_sm(),
      html.span([attribute.id("validation-error-text")], [
        html.text(case validation_error {
          Some(msg) -> msg
          None -> ""
        }),
      ]),
    ],
  )
}

fn drop_file_decoder() -> decode.Decoder(Msg) {
  decode.dynamic
  |> decode.map(fn(dyn) {
    case app_ffi.file_from_drop_event(dyn) {
      Some(file) -> model.FileDropped(file)
      None -> model.NoOp
    }
  })
}

fn input_file_decoder() -> decode.Decoder(Msg) {
  decode.dynamic
  |> decode.map(fn(dyn) {
    case app_ffi.file_from_input_event(dyn) {
      Some(file) -> model.FileSelected(file)
      None -> model.NoOp
    }
  })
}

fn upload_icon() -> Element(Msg) {
  svg.svg(
    [
      attribute.attribute("width", "36"),
      attribute.attribute("height", "36"),
      attribute.attribute("viewBox", "0 0 24 24"),
      attribute.attribute("fill", "none"),
      attribute.attribute("stroke", "currentColor"),
      attribute.attribute("stroke-width", "1.5"),
      attribute.attribute("stroke-linecap", "round"),
      attribute.attribute("stroke-linejoin", "round"),
      attribute.aria_hidden(True),
      attribute.class("text-primary/60"),
    ],
    [
      svg.path([
        attribute.attribute("d", "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"),
      ]),
      svg.polyline([attribute.attribute("points", "17 8 12 3 7 8")]),
      svg.line([
        attribute.attribute("x1", "12"),
        attribute.attribute("y1", "3"),
        attribute.attribute("x2", "12"),
        attribute.attribute("y2", "15"),
      ]),
    ],
  )
}

fn info_icon() -> Element(Msg) {
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
        attribute.attribute("r", "10"),
      ]),
      svg.path([attribute.attribute("d", "M12 16v-4")]),
      svg.path([attribute.attribute("d", "M12 8h.01")]),
    ],
  )
}

fn alert_icon_sm() -> Element(Msg) {
  svg.svg(
    [
      attribute.attribute("width", "14"),
      attribute.attribute("height", "14"),
      attribute.aria_hidden(True),
      attribute.class("shrink-0 mt-0.5"),
    ],
    [svg.use_([attribute.attribute("href", "#icon-alert-circle")])],
  )
}
