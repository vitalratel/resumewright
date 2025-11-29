/**
 * Theme Icons Component Tests
 * Test coverage for theme icon components
 *
 * Tests theme icon components (SunIcon, MoonIcon, ComputerIcon) for:
 * - SVG rendering
 * - Props forwarding (className, etc.)
 * - Accessibility attributes
 */

import { render } from '@testing-library/react';
import { describe, expect } from 'vitest';
import { ComputerIcon } from '../ComputerIcon';
import { MoonIcon } from '../MoonIcon';
import { SunIcon } from '../SunIcon';

describe('Theme Icons', () => {
  describe('SVG Rendering', () => {
    it.each([
      ['SunIcon', SunIcon],
      ['MoonIcon', MoonIcon],
      ['ComputerIcon', ComputerIcon],
    ])('%s renders as SVG element', (_name, Icon) => {
      const { container } = render(<Icon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it.each([
      ['SunIcon', SunIcon],
      ['MoonIcon', MoonIcon],
      ['ComputerIcon', ComputerIcon],
    ])('%s has correct viewBox', (_name, Icon) => {
      const { container } = render(<Icon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it.each([
      ['SunIcon', SunIcon],
      ['MoonIcon', MoonIcon],
      ['ComputerIcon', ComputerIcon],
    ])('%s has stroke styling', (_name, Icon) => {
      const { container } = render(<Icon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
      expect(svg).toHaveAttribute('stroke-width', '2');
      expect(svg).toHaveAttribute('fill', 'none');
    });
  });

  describe('Props Forwarding', () => {
    it.each([
      ['SunIcon', SunIcon],
      ['MoonIcon', MoonIcon],
      ['ComputerIcon', ComputerIcon],
    ])('%s forwards className prop', (_name, Icon) => {
      const { container } = render(<Icon className="custom-test-class" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('custom-test-class');
    });

    it.each([
      ['SunIcon', SunIcon],
      ['MoonIcon', MoonIcon],
      ['ComputerIcon', ComputerIcon],
    ])('%s forwards multiple className values', (_name, Icon) => {
      const { container } = render(<Icon className="class-one class-two" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('class-one', 'class-two');
    });

    it.each([
      ['SunIcon', SunIcon],
      ['MoonIcon', MoonIcon],
      ['ComputerIcon', ComputerIcon],
    ])('%s forwards aria-label prop', (name, Icon) => {
      const { container } = render(<Icon aria-label={`${name} label`} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-label', `${name} label`);
    });

    it.each([
      ['SunIcon', SunIcon],
      ['MoonIcon', MoonIcon],
      ['ComputerIcon', ComputerIcon],
    ])('%s forwards aria-hidden prop', (_name, Icon) => {
      const { container } = render(<Icon aria-hidden="true" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it.each([
      ['SunIcon', SunIcon],
      ['MoonIcon', MoonIcon],
      ['ComputerIcon', ComputerIcon],
    ])('%s forwards role prop', (_name, Icon) => {
      const { container } = render(<Icon role="img" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('role', 'img');
    });

    it.each([
      ['SunIcon', SunIcon],
      ['MoonIcon', MoonIcon],
      ['ComputerIcon', ComputerIcon],
    ])('%s forwards style prop', (_name, Icon) => {
      const { container } = render(<Icon style={{ width: '32px', height: '32px' }} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveStyle({ width: '32px', height: '32px' });
    });
  });

  describe('Icon Paths', () => {
    it('SunIcon has path element with correct structure', () => {
      const { container } = render(<SunIcon />);
      const path = container.querySelector('path');
      expect(path).toBeInTheDocument();
      expect(path).toHaveAttribute('stroke-linecap', 'round');
      expect(path).toHaveAttribute('stroke-linejoin', 'round');
    });

    it('MoonIcon has path element with correct structure', () => {
      const { container } = render(<MoonIcon />);
      const path = container.querySelector('path');
      expect(path).toBeInTheDocument();
      expect(path).toHaveAttribute('stroke-linecap', 'round');
      expect(path).toHaveAttribute('stroke-linejoin', 'round');
    });

    it('ComputerIcon has path element with correct structure', () => {
      const { container } = render(<ComputerIcon />);
      const path = container.querySelector('path');
      expect(path).toBeInTheDocument();
      expect(path).toHaveAttribute('stroke-linecap', 'round');
      expect(path).toHaveAttribute('stroke-linejoin', 'round');
    });
  });

  describe('Typical Usage', () => {
    it('renders icons with common theme selection classes', () => {
      const { container: sunContainer } = render(
        <SunIcon className="w-5 h-5 text-yellow-500" aria-label="Light theme" />,
      );
      const { container: moonContainer } = render(
        <MoonIcon className="w-5 h-5 text-blue-500" aria-label="Dark theme" />,
      );
      const { container: computerContainer } = render(
        <ComputerIcon className="w-5 h-5 text-gray-500" aria-label="Auto theme" />,
      );

      const sunSvg = sunContainer.querySelector('svg');
      const moonSvg = moonContainer.querySelector('svg');
      const computerSvg = computerContainer.querySelector('svg');

      expect(sunSvg).toHaveClass('w-5', 'h-5', 'text-yellow-500');
      expect(moonSvg).toHaveClass('w-5', 'h-5', 'text-blue-500');
      expect(computerSvg).toHaveClass('w-5', 'h-5', 'text-gray-500');

      expect(sunSvg).toHaveAttribute('aria-label', 'Light theme');
      expect(moonSvg).toHaveAttribute('aria-label', 'Dark theme');
      expect(computerSvg).toHaveAttribute('aria-label', 'Auto theme');
    });
  });
});
