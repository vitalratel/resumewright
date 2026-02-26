// ABOUTME: Smoke tests verifying plinth covers the browser APIs we need.
// ABOUTME: If these compile, plinth provides File, Blob, and DataTransfer bindings.

import gleam/javascript/array
import plinth/browser/blob
import plinth/browser/drag
import plinth/browser/file

// file.bytes  :: fn(File) -> Promise(BitArray)  — replaces FileReader
// file.text   :: fn(File) -> Promise(String)
// file.name   :: fn(File) -> String
// file.mime   :: fn(File) -> String
// file.size   :: fn(File) -> Int
pub fn plinth_file_api_covered_test() {
  let _read_bytes: fn(file.File) -> _ = file.bytes
  let _read_text: fn(file.File) -> _ = file.text
  let _get_name: fn(file.File) -> String = file.name
  let _get_mime: fn(file.File) -> String = file.mime
  let _get_size: fn(file.File) -> Int = file.size
  Nil
}

// drag.data_transfer :: fn(Event(t)) -> DataTransfer
// drag.files         :: fn(DataTransfer) -> Array(File)
pub fn plinth_drag_api_covered_test() {
  let _get_files: fn(drag.DataTransfer) -> array.Array(file.File) = drag.files
  Nil
}

// blob type exists and blob.Blob is importable
pub fn plinth_blob_api_covered_test() {
  let _: fn(file.File, Int, Int) -> blob.Blob = file.slice
  Nil
}
