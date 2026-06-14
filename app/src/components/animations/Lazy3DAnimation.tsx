import React, { Suspense, lazy } from 'react';

const Lazy3DAnimation = ({ component: Component, fallback }: { component: React.LazyExoticComponent<any>, fallback?: React.ReactNode }) => {
  return (
    <Suspense fallback={fallback || <div className="animate-pulse bg-gray-800 rounded-lg w-full h-full min-h-[200px]"></div>}>
      <Component />
    </Suspense>
  );
};

export default Lazy3DAnimation;
