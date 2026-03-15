import React from 'react';
import { Skeleton } from './Skeleton';

function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 p-4">
      <Skeleton className="w-full h-48 rounded-xl mb-4" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
        <div className="flex gap-4 pt-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
        </div>
        <div className="pt-4 mt-2 border-t border-gray-50 flex justify-between items-center">
            <Skeleton className="h-6 w-24 rounded" />
            <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export { PropertyCardSkeleton };
