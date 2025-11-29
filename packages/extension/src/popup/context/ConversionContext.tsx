/**
 * Conversion Context
 * Context provider for ConversionHandlers to avoid prop drilling
 * 
 * Provides conversion-related handlers to all components
 */

import type { ConversionHandlers } from '../hooks/conversion/useConversionHandlers';
import React, { createContext, use } from 'react';

const ConversionContext = createContext<ConversionHandlers | null>(null);

export function ConversionProvider({ 
  children, 
  value 
}: { 
  children: React.ReactNode; 
  value: ConversionHandlers;
}) {
  return <ConversionContext value={value}>{children}</ConversionContext>;
}

// eslint-disable-next-line react-refresh/only-export-components -- Hook must be co-located with context
export function useConversion(): ConversionHandlers {
  const context = use(ConversionContext);
  if (!context) {
    throw new Error('useConversion must be used within ConversionProvider');
  }
  return context;
}
