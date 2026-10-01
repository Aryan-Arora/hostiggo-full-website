'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const PALETTE = ['#004772', '#0B7A75', '#7A4B00', '#6B3FA0', '#9C2F4E', '#2F6B2F'];

function initialsOf(name?: string | null) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function colorFor(name?: string | null) {
  let h = 0;
  for (const ch of String(name ?? '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/**
 * A person's photo, or their initials on a stable colour when there is no
 * photo (or it fails to load). Never a stock face -- a random photo next to a
 * real person's name reads as fake.
 */
export function UserAvatar({
  src,
  name,
  size = 40,
  className,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.38)) };

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? ''}
        style={style}
        onError={() => setFailed(true)}
        className={cn('flex-shrink-0 rounded-full object-cover', className)}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={name ?? 'User'}
      style={{ ...style, backgroundColor: colorFor(name) }}
      className={cn(
        'inline-flex flex-shrink-0 select-none items-center justify-center rounded-full font-semibold text-white',
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

export default UserAvatar;
