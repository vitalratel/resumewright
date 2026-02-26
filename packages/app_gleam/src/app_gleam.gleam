// ABOUTME: Converter UI entry point — initialises the Lustre application and mounts to #app.
// ABOUTME: Loads settings from Chrome storage before first render.

import app/effects
import app/model
import app/update
import app/view
import ffi/app as app_ffi
import lustre
import lustre/effect

pub fn main() {
  let app = lustre.application(init, update.update, view.view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}

fn init(_flags) -> #(model.Model, effect.Effect(model.Msg)) {
  let version = app_ffi.get_version()
  let m = model.initial(model.default_settings(), version)
  #(m, effects.load_settings())
}
