import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { BrandAsset } from './brandAssetsCatalog';

export function BrandAssetCard({ asset, downloadLabel }: { asset: BrandAsset; downloadLabel: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 hover:bg-black/40 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-solaris-text truncate">{asset.name}</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-solaris-muted">
              {asset.type.toUpperCase()}
            </span>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-solaris-muted">
              {asset.format}
            </span>
          </div>
        </div>
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <a href={asset.href} download>
            <Download className="w-4 h-4" aria-hidden />
            {downloadLabel}
          </a>
        </Button>
      </div>
      {asset.previewHref ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3 flex items-center justify-center">
          <img
            src={asset.previewHref}
            alt={asset.name}
            loading="lazy"
            className={cn(
              'max-h-24 w-auto',
              asset.format === 'SVG' ? 'invert-[0.08] opacity-90' : 'opacity-95',
            )}
          />
        </div>
      ) : null}
    </div>
  );
}

