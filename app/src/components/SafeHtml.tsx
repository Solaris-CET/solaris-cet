import DOMPurify from 'dompurify';
import React from 'react';

export type SafeHtmlConfig =
  | {
      kind: 'limited';
      allowedTags: string[];
      allowedAttributes: string[];
    }
  | {
      kind: 'svg';
    };

export function SafeHtml({
  html,
  config,
  className,
  dataTestId,
  role,
  ariaLive,
  ariaAtomic,
}: {
  html: string;
  config: SafeHtmlConfig;
  className?: string;
  dataTestId?: string;
  role?: React.AriaRole;
  ariaLive?: 'off' | 'polite' | 'assertive';
  ariaAtomic?: boolean;
}) {
  const sanitized = React.useMemo(() => {
    if (config.kind === 'svg') {
      return DOMPurify.sanitize(html, {
        USE_PROFILES: { svg: true, svgFilters: true, html: true },
      });
    }
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: config.allowedTags,
      ALLOWED_ATTR: config.allowedAttributes,
    });
  }, [html, config]);

  return (
    <div
      className={className}
      data-testid={dataTestId}
      role={role}
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
