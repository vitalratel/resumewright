// ABOUTME: Fixed-size container for extension popup (max-w-md x 600px).
// ABOUTME: Use CenteredContainer for full-page converter tab instead.

import type { JSX } from 'solid-js';

interface PopupContainerProps {
  children: JSX.Element;
}

const POPUP_CONTAINER_STYLE = {
  width: 'max-w-md',
  height: '600px',
};

export function PopupContainer(props: PopupContainerProps) {
  return (
    <div class="overflow-hidden" style={POPUP_CONTAINER_STYLE}>
      {props.children}
    </div>
  );
}
