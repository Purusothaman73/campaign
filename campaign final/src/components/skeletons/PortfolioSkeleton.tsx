import React from 'react';

const PortfolioSkeleton = () => (
  <div className="space-y-12">
    <div className="h-64 lg:h-80 rounded-[3rem] skeleton" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {[...Array(4)].map((_, i) => <div key={i} className="h-36 rounded-3xl skeleton" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div className="h-64 rounded-3xl skeleton" />
      <div className="h-64 rounded-3xl skeleton" />
    </div>
  </div>
);

export default PortfolioSkeleton;
