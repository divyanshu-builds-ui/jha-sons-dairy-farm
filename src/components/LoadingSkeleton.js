import React, { useState, useEffect } from 'react';

function DelayedSpinner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 400);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-5 h-5 border-2 border-gray-200 dark:border-[#333333] border-t-royal-600 dark:border-t-royal-400 rounded-full animate-spin" />
    </div>
  );
}

export function DashboardSkeleton() { return <DelayedSpinner />; }
export function TableSkeleton() { return <DelayedSpinner />; }
export function CardsSkeleton() { return <DelayedSpinner />; }
export function ProfileSkeleton() { return <DelayedSpinner />; }
export function OrderSkeleton() { return <DelayedSpinner />; }
export default function LoadingSkeleton() { return <DelayedSpinner />; }
