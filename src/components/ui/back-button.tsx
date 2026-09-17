'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface BackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  onClick?: () => void;
}

export function BackButton({ className, onClick, ...props }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Go back"
      className={cn(
        "w-14 h-14 rounded-full bg-[#FFFEF9] border border-[#CDCDCD] shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex items-center justify-center flex-shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95 hover:shadow-[0_4px_25px_rgba(0,0,0,0.12)]",
        className
      )}
      {...props}
    >
      <svg
        width="20"
        height="16"
        viewBox="0 0 20 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-[#004772] transition-transform group-hover:-translate-x-0.5"
      >
        <path
          d="M19 8H1M1 8L8 1M1 8L8 15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export default BackButton;
