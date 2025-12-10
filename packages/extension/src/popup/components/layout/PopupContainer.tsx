// ABOUTME: Fixed-size container for extension popup (max-w-md x 600px).
// ABOUTME: Use CenteredContainer for full-page converter tab instead.

interface PopupContainerProps {
  children: React.ReactNode;
}

const POPUP_CONTAINER_STYLE = {
  width: 'max-w-md',
  height: '600px',
};

export function PopupContainer({ children }: PopupContainerProps) {
  return (
    <div className="overflow-hidden" style={POPUP_CONTAINER_STYLE}>
      {children}
    </div>
  );
}
