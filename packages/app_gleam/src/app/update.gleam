// ABOUTME: Lustre app update function — pure state machine transitions.
// ABOUTME: Every Msg maps to a new Model plus zero or more Effects from app/effects.

import app/effects
import app/model.{
  type Model, type Msg, Converting, Errored, Importing, Progress, Ready,
  Settings, Success,
}
import app/validation
import gleam/option.{None, Some}
import lustre/effect.{type Effect}
import plinth/browser/file.{type File}
import shared/types.{
  type ConversionConfig, A4, Auto, ConversionConfig, Dark, Legal, Letter, Light,
  Margin, Settings as SharedSettings,
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

pub fn update(m: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    // Navigation
    model.ShowSettings ->
      #(
        model.Model(..m, view: Settings),
        effects.apply_margin_preview(m.settings.default_config.margin),
      )
    model.ShowMain ->
      #(model.Model(..m, view: model.Main, reset_confirm: False), effect.none())
    model.OpenHelp -> #(model.Model(..m, view: model.Help), effect.none())
    model.CloseHelp -> #(model.Model(..m, view: model.Main), effect.none())
    model.SwitchTab(tab) -> {
      let tab_effect = case tab {
        model.PageTab ->
          effects.apply_margin_preview(m.settings.default_config.margin)
        _ -> effect.none()
      }
      #(model.Model(..m, settings_tab: tab), tab_effect)
    }

    // Drag-drop visual state
    model.DraggedOver ->
      #(
        model.Model(..m, converter_state: Importing(
          validation_error: get_validation_error(m),
          drag_over: True,
        )),
        effect.none(),
      )
    model.DragLeft ->
      #(
        model.Model(..m, converter_state: Importing(
          validation_error: get_validation_error(m),
          drag_over: False,
        )),
        effect.none(),
      )

    // File object received — run quick checks then read async
    model.FileDropped(file) | model.FileSelected(file) ->
      handle_file_selected(m, file)

    // Async file read completed
    model.FileReadComplete(Ok(content), name, size) ->
      handle_file_read(m, content, name, size)
    model.FileReadComplete(Error(msg), _, _) ->
      #(
        model.Model(..m, converter_state: Importing(
          validation_error: Some(msg),
          drag_over: False,
        )),
        effect.none(),
      )

    // WASM validation result
    model.TsxValidationResult(valid) -> handle_tsx_validation(m, valid)

    // File cleared from ready state
    model.FileCleared ->
      #(model.Model(..m, converter_state: importing_clean()), effect.none())

    // Export
    model.ExportClicked -> handle_export(m)
    model.CancelClicked ->
      #(model.Model(..m, converter_state: importing_clean()), effect.none())
    model.RetryClicked -> handle_retry(m)
    model.ImportDifferentClicked ->
      #(model.Model(..m, converter_state: importing_clean()), effect.none())

    // Success actions
    model.ConvertAnotherClicked ->
      #(model.Model(..m, converter_state: importing_clean()), effect.none())
    model.PauseCountdownClicked -> handle_pause_countdown(m)
    model.CloseTabClicked -> #(m, effects.close_tab())
    model.CopyFilenameClicked -> handle_copy_filename(m)
    model.CountdownTick -> handle_countdown_tick(m)

    // Error action
    model.CopyErrorClicked -> handle_copy_error(m)

    // Background broadcasts
    model.GotProgress(stage, pct, op) -> handle_got_progress(m, stage, pct, op)
    model.GotComplete(filename, file_size, duration) ->
      handle_got_complete(m, filename, file_size, duration)
    model.GotError(error) -> handle_got_error(m, error)

    // Settings
    model.PageSizeChanged(size_str) -> handle_page_size_changed(m, size_str)
    model.MarginChanged(side, value) -> handle_margin_changed(m, side, value)
    model.ThemeChanged(theme_str) -> handle_theme_changed(m, theme_str)
    model.ResetRequested -> #(model.Model(..m, reset_confirm: True), effect.none())
    model.ResetCancelled ->
      #(model.Model(..m, reset_confirm: False), effect.none())
    model.ResetConfirmed -> handle_reset_confirmed(m)
    model.SettingsLoaded(settings) ->
      #(
        model.Model(..m, settings: settings),
        effects.apply_margin_preview(settings.default_config.margin),
      )

    model.KeyDown(key, ctrl) -> handle_key_down(m, key, ctrl)

    model.NoOp -> #(m, effect.none())
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn importing_clean() -> model.ConverterState {
  Importing(validation_error: None, drag_over: False)
}

fn get_validation_error(m: Model) -> option.Option(String) {
  case m.converter_state {
    Importing(err, _) -> err
    _ -> None
  }
}

// ---------------------------------------------------------------------------
// File handling
// ---------------------------------------------------------------------------

fn handle_file_selected(m: Model, file: File) -> #(Model, Effect(Msg)) {
  #(
    model.Model(..m, converter_state: importing_clean()),
    effects.read_file(file),
  )
}

fn handle_file_read(
  m: Model,
  content: String,
  name: String,
  size: Int,
) -> #(Model, Effect(Msg)) {
  case validation.check_content(content) {
    Error(msg) ->
      #(
        model.Model(..m, converter_state: Importing(
          validation_error: Some(msg),
          drag_over: False,
        )),
        effect.none(),
      )
    Ok(Nil) ->
      #(
        model.Model(..m, pending_file: Some(model.ImportedFile(name, size, content))),
        effects.validate_tsx(content),
      )
  }
}

fn handle_tsx_validation(m: Model, valid: Bool) -> #(Model, Effect(Msg)) {
  case m.pending_file {
    None -> #(m, effect.none())
    Some(file) ->
      case valid {
        True ->
          #(
            model.Model(
              ..m,
              converter_state: Ready(file),
              pending_file: None,
              announcement: "File ready: "
                <> file.name
                <> ". Click Export to PDF or press Ctrl+E.",
            ),
            effect.none(),
          )
        False ->
          #(
            model.Model(
              ..m,
              converter_state: Importing(
                validation_error: Some(
                  "This file has TSX syntax errors. Please make sure your CV file from Claude is complete and unmodified.",
                ),
                drag_over: False,
              ),
              pending_file: None,
            ),
            effect.none(),
          )
      }
  }
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

fn handle_export(m: Model) -> #(Model, Effect(Msg)) {
  case m.converter_state {
    Ready(file) ->
      #(
        model.Model(
          ..m,
          converter_state: Converting(file, Progress("", 0, "")),
          announcement: "Starting conversion…",
        ),
        effects.start_conversion(file),
      )
    _ -> #(m, effect.none())
  }
}

fn handle_retry(m: Model) -> #(Model, Effect(Msg)) {
  case m.converter_state {
    Errored(_, Some(file)) ->
      #(
        model.Model(
          ..m,
          converter_state: Converting(file, Progress("", 0, "")),
          announcement: "Starting conversion…",
        ),
        effects.start_conversion(file),
      )
    _ -> #(model.Model(..m, converter_state: importing_clean()), effect.none())
  }
}

// ---------------------------------------------------------------------------
// Progress and completion
// ---------------------------------------------------------------------------

fn handle_got_progress(
  m: Model,
  stage: String,
  pct: Int,
  op: String,
) -> #(Model, Effect(Msg)) {
  case m.converter_state {
    Converting(file, _) ->
      #(
        model.Model(..m, converter_state: Converting(file, Progress(stage, pct, op))),
        effects.apply_progress_pct(pct),
      )
    _ -> #(m, effect.none())
  }
}

fn handle_got_complete(
  m: Model,
  filename: String,
  file_size: Int,
  duration: Int,
) -> #(Model, Effect(Msg)) {
  #(
    model.Model(
      ..m,
      converter_state: Success(filename, file_size, duration, 20, False),
      announcement: "PDF ready: " <> filename <> ". Downloaded to your computer.",
    ),
    effects.start_countdown(),
  )
}

fn handle_got_error(m: Model, error: types.ConversionError) -> #(Model, Effect(Msg)) {
  let file = case m.converter_state {
    Converting(f, _) -> Some(f)
    _ -> None
  }
  #(
    model.Model(
      ..m,
      converter_state: Errored(error, file),
      announcement: "Conversion failed: " <> error.message,
    ),
    effect.none(),
  )
}

// ---------------------------------------------------------------------------
// Countdown
// ---------------------------------------------------------------------------

fn handle_countdown_tick(m: Model) -> #(Model, Effect(Msg)) {
  case m.converter_state {
    Success(filename, file_size, duration, countdown, paused) ->
      case paused {
        True -> #(m, effect.none())
        False ->
          case countdown <= 1 {
            True ->
              #(
                model.Model(
                  ..m,
                  converter_state: Success(filename, file_size, duration, 0, False),
                ),
                effects.close_tab(),
              )
            False ->
              #(
                model.Model(
                  ..m,
                  converter_state: Success(
                    filename,
                    file_size,
                    duration,
                    countdown - 1,
                    False,
                  ),
                ),
                effect.none(),
              )
          }
      }
    _ -> #(m, effect.none())
  }
}

fn handle_pause_countdown(m: Model) -> #(Model, Effect(Msg)) {
  case m.converter_state {
    Success(filename, file_size, duration, countdown, paused) ->
      #(
        model.Model(
          ..m,
          converter_state: Success(filename, file_size, duration, countdown, !paused),
        ),
        effect.none(),
      )
    _ -> #(m, effect.none())
  }
}

// ---------------------------------------------------------------------------
// Clipboard
// ---------------------------------------------------------------------------

fn handle_copy_filename(m: Model) -> #(Model, Effect(Msg)) {
  case m.converter_state {
    Success(filename, _, _, _, _) -> #(m, effects.copy_to_clipboard(filename))
    _ -> #(m, effect.none())
  }
}

fn handle_copy_error(m: Model) -> #(Model, Effect(Msg)) {
  case m.converter_state {
    Errored(error, _) ->
      #(m, effects.copy_to_clipboard(error.code <> ": " <> error.message))
    _ -> #(m, effect.none())
  }
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

fn handle_page_size_changed(m: Model, size_str: String) -> #(Model, Effect(Msg)) {
  case size_str {
    "Letter" -> update_config(m, ConversionConfig(..m.settings.default_config, page_size: Letter))
    "A4" -> update_config(m, ConversionConfig(..m.settings.default_config, page_size: A4))
    "Legal" -> update_config(m, ConversionConfig(..m.settings.default_config, page_size: Legal))
    _ -> #(m, effect.none())
  }
}

fn handle_margin_changed(m: Model, side: String, value: Float) -> #(Model, Effect(Msg)) {
  let margin = m.settings.default_config.margin
  let new_margin = case side {
    "top" -> Margin(..margin, top: value)
    "bottom" -> Margin(..margin, bottom: value)
    "left" -> Margin(..margin, left: value)
    "right" -> Margin(..margin, right: value)
    _ -> margin
  }
  let #(new_m, save_effect) =
    update_config(m, ConversionConfig(..m.settings.default_config, margin: new_margin))
  #(new_m, effect.batch([save_effect, effects.apply_margin_preview(new_margin)]))
}

fn handle_theme_changed(m: Model, theme_str: String) -> #(Model, Effect(Msg)) {
  case theme_str {
    "light" -> update_theme(m, Light, theme_str)
    "dark" -> update_theme(m, Dark, theme_str)
    "auto" -> update_theme(m, Auto, theme_str)
    _ -> #(m, effect.none())
  }
}

fn handle_reset_confirmed(m: Model) -> #(Model, Effect(Msg)) {
  let defaults = model.default_settings()
  #(
    model.Model(..m, settings: defaults, reset_confirm: False),
    effect.batch([
      effects.save_settings(defaults),
      effects.apply_theme("auto"),
      effects.apply_margin_preview(defaults.default_config.margin),
    ]),
  )
}

// ---------------------------------------------------------------------------
// Keyboard shortcuts
// ---------------------------------------------------------------------------

fn handle_key_down(m: Model, key: String, ctrl: Bool) -> #(Model, Effect(Msg)) {
  case key, ctrl {
    "Escape", _ ->
      case m.view {
        model.Help -> #(model.Model(..m, view: model.Main), effect.none())
        Settings ->
          #(
            model.Model(..m, view: model.Main, reset_confirm: False),
            effect.none(),
          )
        _ -> #(m, effect.none())
      }
    "F1", _ -> #(model.Model(..m, view: model.Help), effect.none())
    ",", True -> #(model.Model(..m, view: Settings), effect.none())
    "e", True -> handle_export(m)
    "r", True -> handle_retry(m)
    _, _ -> #(m, effect.none())
  }
}

fn update_config(m: Model, cfg: ConversionConfig) -> #(Model, Effect(Msg)) {
  let new_settings = SharedSettings(..m.settings, default_config: cfg)
  #(model.Model(..m, settings: new_settings), effects.save_settings(new_settings))
}

fn update_theme(
  m: Model,
  theme: types.Theme,
  theme_str: String,
) -> #(Model, Effect(Msg)) {
  let new_settings = SharedSettings(..m.settings, theme: theme)
  #(
    model.Model(..m, settings: new_settings),
    effect.batch([
      effects.save_settings(new_settings),
      effects.apply_theme(theme_str),
    ]),
  )
}
