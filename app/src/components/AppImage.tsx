import { forwardRef } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const AppImage = forwardRef<HTMLImageElement, ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, loading = 'lazy', decoding = 'async', ...props }, ref) => {
    return (
      <img
        {...props}
        ref={ref}
        loading={loading}
        decoding={decoding}
        className={cn('w-full h-auto', className)}
      />
    );
  },
);

AppImage.displayName = 'AppImage';

export default AppImage;
