import React from 'react';

const TableSkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between">
      <div className="h-8 w-48 skeleton" />
      <div className="h-10 w-36 skeleton" />
    </div>
    <div className="h-20 rounded-3xl skeleton" />
    <div className="rounded-3xl overflow-hidden">
      <div className="h-14 skeleton mb-px" />
      {[...Array(5)].map((_, i) => <div key={i} className="h-20 skeleton mt-px" />)}
    </div>
  </div>
);

export default TableSkeleton;
