import React, { useState, useEffect } from 'react';

function DelayedSpinner() {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 400); return () => clearTimeout(t); }, []);
  if (!show) return null;
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-5 h-5 border-2 border-warm-200 dark:border-[#2e2d2b] border-t-navy-700 dark:border-t-navy-400 rounded-full animate-spin" />
    </div>
  );
}

export function DashboardSkeleton() { return <DelayedSpinner />; }
export function TableSkeleton() { return <DelayedSpinner />; }
export function CardsSkeleton() { return <DelayedSpinner />; }
export function ProfileSkeleton() { return <DelayedSpinner />; }
export function OrderSkeleton() { return <DelayedSpinner />; }
export default function LoadingSkeleton() { return <DelayedSpinner />; }
