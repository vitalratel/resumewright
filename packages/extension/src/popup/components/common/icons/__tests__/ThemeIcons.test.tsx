/**
 * ABOUTME: Smoke tests for theme icon components from solid-icons library.
 * ABOUTME: Validates that Heroicons outline icons render correctly in our environment.
 */

import { render } from '@solidjs/testing-library';
import { HiOutlineComputerDesktop, HiOutlineMoon, HiOutlineSun } from 'solid-icons/hi';
import { describe, expect, it } from 'vitest';

describe('Theme Icons (solid-icons)', () => {
  it.each([
    ['HiOutlineSun', HiOutlineSun],
    ['HiOutlineMoon', HiOutlineMoon],
    ['HiOutlineComputerDesktop', HiOutlineComputerDesktop],
  ])('%s renders an SVG element', (_name, Icon) => {
    const { container } = render(() => <Icon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it.each([
    ['HiOutlineSun', HiOutlineSun],
    ['HiOutlineMoon', HiOutlineMoon],
    ['HiOutlineComputerDesktop', HiOutlineComputerDesktop],
  ])('%s forwards class prop', (_name, Icon) => {
    const { container } = render(() => <Icon class="w-5 h-5 text-yellow-500" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-5', 'h-5', 'text-yellow-500');
  });

  it.each([
    ['HiOutlineSun', HiOutlineSun],
    ['HiOutlineMoon', HiOutlineMoon],
    ['HiOutlineComputerDesktop', HiOutlineComputerDesktop],
  ])('%s accepts size prop', (_name, Icon) => {
    const { container } = render(() => <Icon size={32} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });
});
