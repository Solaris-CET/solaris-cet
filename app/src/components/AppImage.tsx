import type { ImgHTMLAttributes } from 'react';
import { forwardRef, useState } from 'react';

import { cn } from '@/lib/utils';

const AppImage = forwardRef<HTMLImageElement, ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, loading = 'lazy', decoding = 'async', onLoad, onError, ...props }, ref) => {
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);
    return (
      <img
        {...props}
        ref={ref}
        loading={loading}
        decoding={decoding}
        data-loaded={loaded ? '1' : '0'}
        data-error={failed ? '1' : '0'}
        onLoad={(e) => {
          setLoaded(true);
          setFailed(false);
          onLoad?.(e);
        }}
        onError={(e) => {
          setFailed(true);
          onError?.(e);
        }}
        className={cn(
          'w-full h-auto app-image bg-[radial-gradient(circle_at_20%_20%,rgba(242,201,76,0.12)_0%,transparent_55%),radial-gradient(circle_at_80%_70%,rgba(46,231,255,0.10)_0%,transparent_50%)]',
          !loaded && !failed ? 'animate-pulse' : '',
          className,
        )}
      />
    );
  },
);

AppImage.displayName = 'AppImage';

export default AppImage;
