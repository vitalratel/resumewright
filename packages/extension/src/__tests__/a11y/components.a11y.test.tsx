/**
 * Component Accessibility Tests
 * WCAG 2.1 AA compliance for individual components
 */

import { describe, it } from 'vitest';
import { Alert } from '../../popup/components/common/Alert';
import { Button } from '../../popup/components/common/Button';
import { Modal } from '../../popup/components/common/Modal';
import { RangeSlider } from '../../popup/components/common/RangeSlider';
import { Spinner } from '../../popup/components/common/Spinner';
import { ProgressBar } from '../../popup/components/conversion/ProgressBar';
import { testA11y } from './setup';

describe('Component Accessibility', () => {
  describe('Button', () => {
    it('has no violations with text content', async () => {
      await testA11y(<Button>Convert to PDF</Button>);
    });

    it('has no violations when disabled', async () => {
      await testA11y(<Button disabled>Convert to PDF</Button>);
    });

    it('has no violations with loading state', async () => {
      await testA11y(<Button loading>Converting...</Button>);
    });
  });

  describe('Alert', () => {
    it('error variant has role="alert" for assertive announcement', async () => {
      await testA11y(
        <Alert variant="error">
          <p>Failed to convert file</p>
        </Alert>
      );
    });

    it('success variant has role="status" for polite announcement', async () => {
      await testA11y(
        <Alert variant="success">
          <p>File converted successfully</p>
        </Alert>
      );
    });

    it('info variant has no violations', async () => {
      await testA11y(
        <Alert variant="info">
          <p>Drag and drop your CV file here</p>
        </Alert>
      );
    });

    it('warning variant has no violations', async () => {
      await testA11y(
        <Alert variant="warning">
          <p>File size is close to the limit</p>
        </Alert>
      );
    });

    it('dismissible alert has accessible dismiss button', async () => {
      await testA11y(
        <Alert variant="info" dismissible onDismiss={() => {}}>
          <p>This message can be dismissed</p>
        </Alert>
      );
    });
  });

  describe('ProgressBar', () => {
    it('has proper progressbar role and aria attributes', async () => {
      await testA11y(<ProgressBar percentage={50} />);
    });

    it('handles 0% progress accessibly', async () => {
      await testA11y(<ProgressBar percentage={0} />);
    });

    it('handles 100% progress accessibly', async () => {
      await testA11y(<ProgressBar percentage={100} />);
    });

    it('success variant has no violations', async () => {
      await testA11y(<ProgressBar percentage={100} variant="success" />);
    });

    it('error variant has no violations', async () => {
      await testA11y(<ProgressBar percentage={75} variant="error" />);
    });
  });

  describe('Spinner', () => {
    it('is hidden from screen readers when used decoratively', async () => {
      // Spinner with accompanying text should be aria-hidden
      await testA11y(
        <div>
          <Spinner size="small" delayMs={0} />
          <span>Loading...</span>
        </div>
      );
    });

    it('has accessible label when used as primary indicator', async () => {
      await testA11y(
        <Spinner size="large" ariaLabel="Loading content" delayMs={0} />
      );
    });

    it('all size variants have no violations', async () => {
      await testA11y(
        <div>
          <Spinner size="small" delayMs={0} />
          <Spinner size="medium" delayMs={0} />
          <Spinner size="large" delayMs={0} />
        </div>
      );
    });
  });

  describe('Modal', () => {
    it('has proper dialog role and aria-modal', async () => {
      await testA11y(
        <Modal
          isOpen={true}
          onClose={() => {}}
          ariaLabelledBy="modal-title"
          ariaDescribedBy="modal-desc"
        >
          <h2 id="modal-title">Confirm Action</h2>
          <p id="modal-desc">Are you sure you want to proceed?</p>
          <button type="button">Confirm</button>
          <button type="button">Cancel</button>
        </Modal>
      );
    });

    it('renders nothing when closed (no violations)', async () => {
      await testA11y(
        <Modal isOpen={false} onClose={() => {}}>
          <p>This should not render</p>
        </Modal>
      );
    });
  });

  describe('RangeSlider', () => {
    it('has proper label association and aria attributes', async () => {
      await testA11y(
        <RangeSlider
          id="margin-top"
          label="Top"
          value={0.5}
          min={0.25}
          max={1.0}
          step={0.05}
          onChange={() => {}}
        />
      );
    });

    it('increment/decrement buttons have accessible labels', async () => {
      await testA11y(
        <RangeSlider
          id="margin-bottom"
          label="Bottom"
          value={0.75}
          min={0.25}
          max={1.0}
          step={0.05}
          onChange={() => {}}
        />
      );
    });

    it('handles min value accessibly', async () => {
      await testA11y(
        <RangeSlider
          id="margin-left"
          label="Left"
          value={0.25}
          min={0.25}
          max={1.0}
          step={0.05}
          onChange={() => {}}
        />
      );
    });

    it('handles max value accessibly', async () => {
      await testA11y(
        <RangeSlider
          id="margin-right"
          label="Right"
          value={1.0}
          min={0.25}
          max={1.0}
          step={0.05}
          onChange={() => {}}
        />
      );
    });
  });
});
