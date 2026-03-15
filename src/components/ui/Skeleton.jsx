import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn("animate-pulse-slow rounded-md bg-gray-200/80", className)}
      {...props}
    />
  )
}

export { Skeleton }
