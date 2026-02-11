// ABOUTME: Container component managing download interactions after PDF conversion.
// ABOUTME: Handles browser download API, error recovery, and delegates to SuccessView.

import { createSignal, Show } from 'solid-js';
import { createCountdown } from '../../hooks/ui/useCountdown';
import { createBrowserDownloads } from '../../reactivity/downloads';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';
import { SuccessView } from './SuccessView';

interface SuccessProps {
  ref?: HTMLDivElement | ((el: HTMLDivElement) => void);
  filename: string;
  fileSize?: string;
  autoCloseSeconds?: number;
  onExportAnother: () => void;
}

export function Success(props: SuccessProps) {
  const [downloadError, setDownloadError] = createSignal<string | null>(null);

  const { isAvailable, apiAvailable, openDownload, showInFolder } = createBrowserDownloads(
    props.filename,
  );
  const { countdown, isPaused, pause, resume } = createCountdown(props.autoCloseSeconds);

  const fileSize = () => props.fileSize ?? '324 KB';

  const handleOpenDownload = () => {
    try {
      setDownloadError(null);
      openDownload();
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Failed to open download');
    }
  };

  const handleShowInFolder = () => {
    try {
      setDownloadError(null);
      showInFolder();
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Failed to show download folder');
    }
  };

  const isOpenDownloadError = () => downloadError()?.includes('open download') ?? false;
  const isShowFolderError = () => downloadError()?.includes('show download folder') ?? false;

  return (
    <Show
      when={downloadError()}
      fallback={
        <SuccessView
          ref={props.ref}
          displayFilename={props.filename}
          fileSize={fileSize()}
          apiAvailable={apiAvailable()}
          isAvailable={isAvailable()}
          countdown={countdown()}
          isPaused={isPaused()}
          onPause={pause}
          onResume={resume}
          onOpenDownload={handleOpenDownload}
          onShowInFolder={handleShowInFolder}
          onExportAnother={props.onExportAnother}
        />
      }
    >
      <div
        ref={(el: HTMLDivElement) => {
          const r = props.ref;
          if (typeof r === 'function') r(el);
        }}
        class="flex flex-col items-center justify-center p-6"
      >
        <Alert variant="error" dismissible onDismiss={() => setDownloadError(null)}>
          <p class="mb-3">{downloadError()}</p>
          <div class="flex gap-2">
            {/* Retry the failed action */}
            <Show when={isOpenDownloadError()}>
              <Button
                onClick={handleOpenDownload}
                variant="primary"
                aria-label="Retry opening download"
              >
                Retry Open
              </Button>
            </Show>
            <Show when={isShowFolderError()}>
              <Button
                onClick={handleShowInFolder}
                variant="primary"
                aria-label="Retry showing download folder"
              >
                Retry Show Folder
              </Button>
            </Show>
            {/* Fallback: try the other action if one failed */}
            <Show when={!apiAvailable()}>
              <Button
                onClick={props.onExportAnother}
                variant="secondary"
                aria-label="Export another CV"
              >
                Export Another
              </Button>
            </Show>
            <Show when={apiAvailable()}>
              <Show when={isOpenDownloadError()}>
                <Button
                  onClick={handleShowInFolder}
                  variant="secondary"
                  aria-label="Try showing folder instead"
                >
                  Show in Folder
                </Button>
              </Show>
              <Show when={isShowFolderError()}>
                <Button
                  onClick={handleOpenDownload}
                  variant="secondary"
                  aria-label="Try opening file instead"
                >
                  Open File
                </Button>
              </Show>
            </Show>
          </div>
        </Alert>
      </div>
    </Show>
  );
}
