// ABOUTME: Browser FFI for system dark mode detection and theme class application.
// ABOUTME: Reads matchMedia and sets/clears "light"/"dark" class on the html element.

export function system_prefers_dark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function apply_theme_class(theme) {
  const html = document.documentElement;
  html.classList.remove("light", "dark");
  if (theme !== "auto" && theme !== "") {
    html.classList.add(theme);
  }
}
