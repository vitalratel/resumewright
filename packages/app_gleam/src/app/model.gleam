// ABOUTME: Lustre app model — all types for the converter UI state machine.
// ABOUTME: Defines Model, Msg, ConverterState, and the default settings value.

import gleam/option.{type Option, None}
import plinth/browser/file.{type File}
import shared/types.{
  type ConversionError, type Settings, Auto, ConversionConfig, Letter, Margin,
}

// Note: Settings constructor NOT imported — conflicts with View { Main  Settings }

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

pub type View {
  Main
  Settings
  Help
}

pub type SettingsTab {
  PageTab
  GeneralTab
}

// ---------------------------------------------------------------------------
// Converter state machine
// ---------------------------------------------------------------------------

pub type ImportedFile {
  ImportedFile(name: String, size: Int, content: String)
}

pub type Progress {
  Progress(stage: String, percentage: Int, current_operation: String)
}

pub type ConverterState {
  Importing(validation_error: Option(String), drag_over: Bool)
  Ready(file: ImportedFile)
  Converting(file: ImportedFile, progress: Progress)
  Success(
    filename: String,
    file_size: Int,
    duration: Int,
    countdown: Int,
    paused: Bool,
  )
  Errored(error: ConversionError, file: Option(ImportedFile))
}

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

pub type Model {
  Model(
    view: View,
    converter_state: ConverterState,
    settings: Settings,
    reset_confirm: Bool,
    settings_tab: SettingsTab,
    version: String,
    pending_file: Option(ImportedFile),
    announcement: String,
    error_announcement: String,
  )
}

pub fn initial(settings: Settings, version: String) -> Model {
  Model(
    view: Main,
    converter_state: Importing(validation_error: None, drag_over: False),
    settings: settings,
    reset_confirm: False,
    settings_tab: PageTab,
    version: version,
    pending_file: None,
    announcement: "",
    error_announcement: "",
  )
}

// ---------------------------------------------------------------------------
// Default settings
// ---------------------------------------------------------------------------

pub fn default_settings() -> Settings {
  types.Settings(
    theme: Auto,
    default_config: ConversionConfig(
      page_size: Letter,
      margin: Margin(top: 0.5, right: 0.5, bottom: 0.5, left: 0.5),
      font_size: 11,
      font_family: "Helvetica",
      compress: True,
      ats_optimization: False,
      include_metadata: True,
    ),
    settings_version: 1,
    last_updated: 0,
  )
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

pub type Msg {
  // Navigation
  ShowSettings
  ShowMain
  OpenHelp
  CloseHelp
  SwitchTab(SettingsTab)
  // File import (file object from browser)
  FileDropped(File)
  FileSelected(File)
  // Drag-drop visual state
  DraggedOver
  DragLeft
  // File validation pipeline results
  FileReadComplete(result: Result(String, String), name: String, size: Int)
  TsxValidationResult(valid: Bool)
  FileCleared
  // Export flow
  ExportClicked
  CancelClicked
  RetryClicked
  ImportDifferentClicked
  // Success actions
  ConvertAnotherClicked
  PauseCountdownClicked
  CloseTabClicked
  CopyFilenameClicked
  CountdownTick
  // Error action
  CopyErrorClicked
  // Background message broadcasts
  GotProgress(stage: String, percentage: Int, current_operation: String)
  GotComplete(filename: String, file_size: Int, duration: Int)
  GotError(error: ConversionError)
  // Settings
  PageSizeChanged(String)
  MarginChanged(side: String, value: Float)
  ThemeChanged(String)
  ResetRequested
  ResetCancelled
  ResetConfirmed
  SettingsLoaded(Settings)
  // Keyboard shortcuts
  KeyDown(key: String, ctrl: Bool)
  // No-op for events where we need to prevent default but dispatch nothing
  NoOp
}
