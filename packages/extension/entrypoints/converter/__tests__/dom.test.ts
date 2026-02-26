// ABOUTME: Tests for the DOM element query helper.
// ABOUTME: Verifies null-safe element lookup throws clearly when an element is missing.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getElement } from '../dom';

describe('getElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="test-el"></div><input id="test-input" />';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns the element when it exists', () => {
    const el = getElement('test-el');
    expect(el.id).toBe('test-el');
  });

  it('throws when the element does not exist', () => {
    expect(() => getElement('missing-el')).toThrow('Required element #missing-el not found');
  });

  it('returns element typed as the specified generic', () => {
    const input = getElement<HTMLInputElement>('test-input');
    expect(input.tagName).toBe('INPUT');
  });
});
