/**
 * ABOUTME: Tests for TabGroup component.
 * ABOUTME: Validates tab rendering, active state, click handling, keyboard navigation, and a11y.
 */

import { fireEvent, render } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { describe, expect, it, vi } from 'vitest';
import type { Tab } from '../TabGroup';
import { TabGroup } from '../TabGroup';

const tabs: Tab[] = [
  { id: 'general', label: 'General' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'advanced', label: 'Advanced' },
];

describe('TabGroup', () => {
  describe('Rendering', () => {
    it('renders all tabs', () => {
      const { getByText } = render(() => (
        <TabGroup tabs={tabs} activeTab="general" onTabChange={() => {}} />
      ));
      expect(getByText('General')).toBeInTheDocument();
      expect(getByText('Appearance')).toBeInTheDocument();
      expect(getByText('Advanced')).toBeInTheDocument();
    });

    it('renders tablist role', () => {
      const { container } = render(() => (
        <TabGroup tabs={tabs} activeTab="general" onTabChange={() => {}} />
      ));
      expect(container.querySelector('[role="tablist"]')).toBeInTheDocument();
    });

    it('renders each tab with tab role', () => {
      const { container } = render(() => (
        <TabGroup tabs={tabs} activeTab="general" onTabChange={() => {}} />
      ));
      const tabElements = container.querySelectorAll('[role="tab"]');
      expect(tabElements).toHaveLength(3);
    });

    it('renders buttons with type="button"', () => {
      const { container } = render(() => (
        <TabGroup tabs={tabs} activeTab="general" onTabChange={() => {}} />
      ));
      const buttons = container.querySelectorAll('button[type="button"]');
      expect(buttons).toHaveLength(3);
    });
  });

  describe('Active State', () => {
    it('marks active tab with aria-selected=true', () => {
      const { container } = render(() => (
        <TabGroup tabs={tabs} activeTab="appearance" onTabChange={() => {}} />
      ));
      const activeTab = container.querySelector('#tab-appearance');
      expect(activeTab).toHaveAttribute('aria-selected', 'true');
    });

    it('marks inactive tabs with aria-selected=false', () => {
      const { container } = render(() => (
        <TabGroup tabs={tabs} activeTab="general" onTabChange={() => {}} />
      ));
      const inactiveTab = container.querySelector('#tab-appearance');
      expect(inactiveTab).toHaveAttribute('aria-selected', 'false');
    });

    it('sets tabIndex=0 on active tab', () => {
      const { container } = render(() => (
        <TabGroup tabs={tabs} activeTab="general" onTabChange={() => {}} />
      ));
      const activeTab = container.querySelector('#tab-general');
      expect(activeTab).toHaveAttribute('tabindex', '0');
    });

    it('sets tabIndex=-1 on inactive tabs', () => {
      const { container } = render(() => (
        <TabGroup tabs={tabs} activeTab="general" onTabChange={() => {}} />
      ));
      const inactiveTab = container.querySelector('#tab-appearance');
      expect(inactiveTab).toHaveAttribute('tabindex', '-1');
    });

    it('applies active styling classes to active tab', () => {
      const { container } = render(() => (
        <TabGroup tabs={tabs} activeTab="general" onTabChange={() => {}} />
      ));
      const activeTab = container.querySelector('#tab-general');
      expect(activeTab).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('applies inactive styling classes to inactive tab', () => {
      const { container } = render(() => (
        <TabGroup tabs={tabs} activeTab="general" onTabChange={() => {}} />
      ));
      const inactiveTab = container.querySelector('#tab-appearance');
      expect(inactiveTab).toHaveClass('bg-muted', 'text-foreground');
    });
  });

  describe('Accessibility', () => {
    it('has default aria-label', () => {
      const { container } = render(() => (
        <TabGroup tabs={tabs} activeTab="general" onTabChange={() => {}} />
      ));
      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).toHaveAttribute('aria-label', 'Settings tabs');
    });

    it('accepts custom aria-label', () => {
      const { container } = render(() => (
        <TabGroup tabs={tabs} activeTab="general" onTabChange={() => {}} aria-label="Custom tabs" />
      ));
      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).toHaveAttribute('aria-label', 'Custom tabs');
    });

    it('sets aria-controls on each tab', () => {
      const { container } = render(() => (
        <TabGroup tabs={tabs} activeTab="general" onTabChange={() => {}} />
      ));
      expect(container.querySelector('#tab-general')).toHaveAttribute(
        'aria-controls',
        'tabpanel-general',
      );
      expect(container.querySelector('#tab-appearance')).toHaveAttribute(
        'aria-controls',
        'tabpanel-appearance',
      );
      expect(container.querySelector('#tab-advanced')).toHaveAttribute(
        'aria-controls',
        'tabpanel-advanced',
      );
    });

    it('sets id on each tab', () => {
      const { container } = render(() => (
        <TabGroup tabs={tabs} activeTab="general" onTabChange={() => {}} />
      ));
      expect(container.querySelector('#tab-general')).toBeInTheDocument();
      expect(container.querySelector('#tab-appearance')).toBeInTheDocument();
      expect(container.querySelector('#tab-advanced')).toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('calls onTabChange when a tab is clicked', () => {
      const onTabChange = vi.fn();
      const { getByText } = render(() => (
        <TabGroup tabs={tabs} activeTab="general" onTabChange={onTabChange} />
      ));
      fireEvent.click(getByText('Appearance'));
      expect(onTabChange).toHaveBeenCalledWith('appearance');
    });

    it('calls onTabChange with correct tab id', () => {
      const onTabChange = vi.fn();
      const { getByText } = render(() => (
        <TabGroup tabs={tabs} activeTab="general" onTabChange={onTabChange} />
      ));
      fireEvent.click(getByText('Advanced'));
      expect(onTabChange).toHaveBeenCalledWith('advanced');
    });
  });

  describe('Keyboard Navigation', () => {
    it('moves to next tab on ArrowRight', () => {
      const onTabChange = vi.fn();
      const { container } = render(() => (
        <TabGroup tabs={tabs} activeTab="general" onTabChange={onTabChange} />
      ));
      const firstTab = container.querySelector('#tab-general')!;
      fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
      expect(onTabChange).toHaveBeenCalledWith('appearance');
    });

    it('moves to previous tab on ArrowLeft', () => {
      const onTabChange = vi.fn();
      const { container } = render(() => (
        <TabGroup tabs={tabs} activeTab="appearance" onTabChange={onTabChange} />
      ));
      const tab = container.querySelector('#tab-appearance')!;
      fireEvent.keyDown(tab, { key: 'ArrowLeft' });
      expect(onTabChange).toHaveBeenCalledWith('general');
    });

    it('wraps to first tab on ArrowRight from last tab', () => {
      const onTabChange = vi.fn();
      const { container } = render(() => (
        <TabGroup tabs={tabs} activeTab="advanced" onTabChange={onTabChange} />
      ));
      const lastTab = container.querySelector('#tab-advanced')!;
      fireEvent.keyDown(lastTab, { key: 'ArrowRight' });
      expect(onTabChange).toHaveBeenCalledWith('general');
    });

    it('wraps to last tab on ArrowLeft from first tab', () => {
      const onTabChange = vi.fn();
      const { container } = render(() => (
        <TabGroup tabs={tabs} activeTab="general" onTabChange={onTabChange} />
      ));
      const firstTab = container.querySelector('#tab-general')!;
      fireEvent.keyDown(firstTab, { key: 'ArrowLeft' });
      expect(onTabChange).toHaveBeenCalledWith('advanced');
    });
  });

  describe('Reactive Updates', () => {
    it('updates active tab styling when activeTab changes', () => {
      const [activeTab, setActiveTab] = createSignal('general');
      const { container } = render(() => (
        <TabGroup tabs={tabs} activeTab={activeTab()} onTabChange={(id) => setActiveTab(id)} />
      ));

      expect(container.querySelector('#tab-general')).toHaveAttribute('aria-selected', 'true');
      expect(container.querySelector('#tab-appearance')).toHaveAttribute('aria-selected', 'false');

      setActiveTab('appearance');

      expect(container.querySelector('#tab-general')).toHaveAttribute('aria-selected', 'false');
      expect(container.querySelector('#tab-appearance')).toHaveAttribute('aria-selected', 'true');
    });
  });
});
