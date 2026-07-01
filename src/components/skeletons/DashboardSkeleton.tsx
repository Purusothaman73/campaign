import React from 'react';

const DashboardSkeleton = () => (
  <div className="space-y-10">
    <div className="h-10 w-64 skeleton" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {[...Array(4)].map((_, i) => <div key={i} className="h-40 rounded-3xl skeleton" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      <div className="lg:col-span-2 h-[450px] rounded-3xl skeleton" />
      <div className="h-[450px] rounded-3xl skeleton" />
    </div>
    <div className="h-[400px] rounded-3xl skeleton" />
  </div>
);

export default DashboardSkeleton;
