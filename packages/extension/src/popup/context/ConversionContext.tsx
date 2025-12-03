/**
 * Conversion Context
 * Context provider for ConversionHandlers to avoid prop drilling
 *
 * Provides conversion-related handlers to all components
 */

import type React from 'react';
import { createContext, use } from 'react';
import type { ConversionHandlers } from '../hooks/conversion/useConversionHandlers';

const ConversionContext = createContext<ConversionHandlers | null>(null);

export function ConversionProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: ConversionHandlers;
}) {
  return <ConversionContext value={value}>{children}</ConversionContext>;
}

export function useConversion(): ConversionHandlers {
  const context = use(ConversionContext);
  if (!context) {
    throw new Error('useConversion must be used within ConversionProvider');
  }
  return context;
}
