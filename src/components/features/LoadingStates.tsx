'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  /**
   * Loading state - 'idle', 'loading', 'success', 'error'
   */
  state: 'idle' | 'loading' | 'success' | 'error';
  /**
   * Message to display
   */
  message?: string;
  /**
   * Custom loading component
   */
  variant?: 'spinner' | 'dots' | 'skeleton' | 'pulse';
  /**
   * Size of the loader
   */
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({
  state,
  message = 'Loading...',
  variant = 'dots',
  size = 'md',
}: LoadingStateProps) {
  if (state !== 'loading') return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {variant === 'spinner' && (
        <Loader2
          className={`${sizeClasses[size]} text-figma-navy animate-spin`}
        />
      )}

      {variant === 'dots' && (
        <div className="flex gap-1.5">
          {[0, 150, 300].map((delay) => (
            <div
              key={delay}
              className={`${sizeClasses[size]} rounded-full bg-figma-navy animate-bounce`}
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      )}

      {variant === 'pulse' && (
        <div
          className={`${sizeClasses[size]} rounded-full bg-figma-navy animate-pulse`}
        />
      )}

      {variant === 'skeleton' && (
        <div
          className={`${sizeClasses[size]} rounded bg-gray-200 animate-pulse`}
        />
      )}

      {message && (
        <span className={`${textSize[size]} text-gray-600 font-medium`}>
          {message}
        </span>
      )}
    </div>
  );
}

export function SkeletonGrid({
  count = 4,
  columns = 1,
}: {
  count?: number;
  columns?: number;
}) {
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 animate-pulse">
          <div className="h-48 bg-gray-200 rounded-lg" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function SuspenseWrapper({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <React.Suspense
      fallback={
        fallback || (
          <div className="flex items-center justify-center py-12">
            <LoadingState
              state="loading"
              variant="dots"
              size="lg"
              message="Loading properties..."
            />
          </div>
        )
      }
    >
      {children}
    </React.Suspense>
  );
}
