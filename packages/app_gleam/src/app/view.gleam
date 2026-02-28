// ABOUTME: Top-level view dispatcher — routes to converter or settings based on Model.view.
// ABOUTME: Wraps all views in the shared layout (header, footer, help dialog).

import app/model.{type Model, type Msg}
import lustre/element.{type Element}
import view/converting
import view/error
import view/help
import view/importing
import view/layout
import view/ready
import view/settings
import view/success

pub fn view(model: Model) -> Element(Msg) {
  case model.view {
    model.Help -> help.view()
    _ -> layout.wrap(model, main_content(model))
  }
}

fn main_content(model: Model) -> Element(Msg) {
  case model.view {
    model.Settings -> settings.view(model)
    _ -> converter_view(model)
  }
}

fn converter_view(model: Model) -> Element(Msg) {
  case model.converter_state {
    model.Importing(validation_error: err, drag_over: drag) ->
      importing.view(err, drag)

    model.Ready(file: file) ->
      ready.view(file, model.settings)

    model.Converting(file: file, progress: progress) ->
      converting.view(file, progress)

    model.Success(
      filename: filename,
      file_size: file_size,
      duration: duration,
      countdown: countdown,
      paused: paused,
    ) ->
      success.view(filename, file_size, duration, countdown, paused)

    model.Errored(error: err, file: file) ->
      error.view(err, file)
  }
}
