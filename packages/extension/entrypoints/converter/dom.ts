// ABOUTME: DOM element query helper for the converter entrypoint.
// ABOUTME: Throws clearly if a required element is missing rather than silently returning null.

export function getElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Required element #${id} not found`);
  return el as T;
}
