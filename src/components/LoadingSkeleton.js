import React from 'react';

function Bone({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-xl bg-gray-200 dark:bg-[#111111] ${className}`} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-fade-in">
      <Bone className="h-36 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <Bone className="h-24 rounded-2xl" />
        <Bone className="h-24 rounded-2xl" />
      </div>
      <Bone className="h-32 rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        <Bone className="h-20 rounded-2xl" />
        <Bone className="h-20 rounded-2xl" />
        <Bone className="h-20 rounded-2xl" />
      </div>
      <Bone className="h-48 rounded-2xl" />
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex gap-3">
        <Bone className="h-10 w-40 rounded-xl" />
        <Bone className="h-10 w-32 rounded-xl" />
        <Bone className="h-10 w-24 rounded-xl ml-auto" />
      </div>
      <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-[#222222]">
        <Bone className="h-10 !rounded-none" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-t border-gray-50 dark:border-[#222222]">
            <Bone className="h-4 w-6 rounded-md" />
            <Bone className="h-4 w-32 rounded-md" />
            <Bone className="h-4 w-16 rounded-md ml-auto" />
            <Bone className="h-4 w-16 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardsSkeleton() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex gap-3">
        <Bone className="h-10 flex-1 rounded-xl" />
        <Bone className="h-10 w-24 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 dark:border-[#222222]">
            <Bone className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-3/4 rounded-md" />
              <Bone className="h-3 w-1/2 rounded-md" />
            </div>
            <Bone className="h-6 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-5 animate-fade-in">
      <Bone className="h-6 w-20 rounded-lg" />
      <div className="rounded-2xl border border-gray-100 dark:border-[#222222] p-5 text-center">
        <Bone className="h-24 rounded-t-2xl -mx-5 -mt-5 mb-6" />
        <Bone className="w-20 h-20 rounded-2xl mx-auto" />
        <Bone className="h-5 w-40 rounded-md mx-auto mt-4" />
        <Bone className="h-4 w-28 rounded-md mx-auto mt-2" />
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100 dark:border-[#222222]">
          <Bone className="h-12 rounded-xl" />
          <Bone className="h-12 rounded-xl" />
          <Bone className="h-12 rounded-xl" />
        </div>
      </div>
      <div className="rounded-2xl border border-gray-100 dark:border-[#222222] overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 dark:border-[#222222] last:border-0">
            <Bone className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Bone className="h-3 w-16 rounded-md" />
              <Bone className="h-4 w-40 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <Bone className="h-10 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-100 dark:border-[#222222] overflow-hidden">
          <Bone className="h-9 !rounded-none" />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-3 border-t border-gray-50 dark:border-[#222222]">
              <div className="flex items-center gap-2">
                <Bone className="h-4 w-5 rounded-md" />
                <div className="space-y-1.5">
                  <Bone className="h-4 w-24 rounded-md" />
                  <Bone className="h-3 w-16 rounded-md" />
                </div>
              </div>
              <Bone className="h-10 w-16 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-[#222222] overflow-hidden">
          <Bone className="h-9 !rounded-none" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-3 border-t border-gray-50 dark:border-[#222222]">
              <div className="flex items-center gap-2">
                <Bone className="h-4 w-5 rounded-md" />
                <div className="space-y-1.5">
                  <Bone className="h-4 w-24 rounded-md" />
                  <Bone className="h-3 w-16 rounded-md" />
                </div>
              </div>
              <Bone className="h-10 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoadingSkeleton({ type = 'dashboard' }) {
  switch (type) {
    case 'table': return <TableSkeleton />;
    case 'cards': return <CardsSkeleton />;
    case 'profile': return <ProfileSkeleton />;
    case 'order': return <OrderSkeleton />;
    default: return <DashboardSkeleton />;
  }
}
