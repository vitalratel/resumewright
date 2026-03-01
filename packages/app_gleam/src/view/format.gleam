// ABOUTME: Shared formatting utilities for view modules.

import gleam/int

pub fn file_size(bytes: Int) -> String {
  case bytes {
    b if b >= 1_048_576 -> int.to_string(b / 1_048_576) <> " MB"
    b if b >= 1024 -> int.to_string(b / 1024) <> " KB"
    _ -> int.to_string(bytes) <> " B"
  }
}
