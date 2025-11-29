/**
 * useValidation Hook
 * Reusable validation state management
 * Fixed infinite loop by using ref for rules
 *
 * React 19 pattern: Uses render-phase setState to synchronize validation
 * instead of setState in useEffect to avoid cascading renders
 *
 * Supports multiple validation rules, touched state,
 * and automatic validation on change.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

interface UseValidationOptions<T> {
  rules: ValidationRule<T>[];
  validateOnChange?: boolean;
}

export function useValidation<T>(
  value: T,
  options: UseValidationOptions<T>,
) {
  const [errors, setErrors] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const [lastValidatedValue, setLastValidatedValue] = useState(value);

  // Use ref to store rules without causing dependency issues
  // Rules often contain functions which can't be easily memoized
  const rulesRef = useRef(options.rules);
  const validateOnChangeRef = useRef(options.validateOnChange);

  // Update refs on every render to always use latest rules
  useEffect(() => {
    rulesRef.current = options.rules;
    validateOnChangeRef.current = options.validateOnChange;
  });

  // React 19 pattern: Render-phase setState to synchronize validation with value
  // This is allowed when deriving state from props/state (getDerivedStateFromProps equivalent)
  // Note: We access options.rules directly instead of ref to avoid "ref access during render" error
  if (touched && options.validateOnChange && value !== lastValidatedValue) {
    const validationErrors: string[] = [];
    for (const rule of options.rules) {
      if (!rule.validate(value)) {
        validationErrors.push(rule.message);
      }
    }
    setErrors(validationErrors);
    setLastValidatedValue(value);
  }

  const validate = useCallback(() => {
    const validationErrors: string[] = [];

    // Use ref to access current rules without adding to dependencies
    for (const rule of rulesRef.current) {
      if (!rule.validate(value)) {
        validationErrors.push(rule.message);
      }
    }

    setErrors(validationErrors);
    setLastValidatedValue(value);
    return validationErrors.length === 0;
  }, [value]); // Only depend on value, not rules

  const touch = useCallback(() => setTouched(true), []);
  const reset = useCallback(() => {
    setErrors([]);
    setTouched(false);
    setLastValidatedValue(value);
  }, [value]);

  return {
    errors,
    isValid: errors.length === 0,
    touched,
    validate,
    touch,
    reset,
  };
}
