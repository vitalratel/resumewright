/**
 * Popup Container Component
 * Extract POPUP_CONTAINER string constant to proper component
 *
 * Provides fixed-size container for extension popup (400x600px)
 * Use CenteredContainer for full-page converter tab instead
 */

import { tokens } from '../../styles/tokens';

interface PopupContainerProps {
  children: React.ReactNode;
}

// Extract static style object to prevent recreation on every render
// Use tokens for popup dimensions
const POPUP_CONTAINER_STYLE = {
  width: tokens.layout.popupWidth,
  height: tokens.layout.popupHeight,
};

export function PopupContainer({ children }: PopupContainerProps) {
  return (
    <div
      className="overflow-hidden"
      style={POPUP_CONTAINER_STYLE}
    >
      {children}
    </div>
  );
}
