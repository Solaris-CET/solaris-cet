import { SafeHtml } from '@/components/SafeHtml';
import { companyProfile } from '@/data/companyProfile';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

type SafeEmailLinkProps = {
  anchorClassName?: string;
  wrapperClassName?: string;
  email?: string;
  label?: string;
  subject?: string;
  ariaLabel?: string;
};

export function SafeEmailLink({
  anchorClassName,
  wrapperClassName,
  email = companyProfile.email,
  label = companyProfile.email,
  subject,
  ariaLabel,
}: SafeEmailLinkProps) {
  const href = subject ? `mailto:${email}?subject=${encodeURIComponent(subject)}` : `mailto:${email}`;
  const classAttr = anchorClassName ? ` class="${escapeHtml(anchorClassName)}"` : '';
  const ariaLabelAttr = ariaLabel ? ` aria-label="${escapeHtml(ariaLabel)}"` : '';
  const html = `<!--email_off--><a${classAttr}${ariaLabelAttr} href="${escapeHtml(href)}">${escapeHtml(label)}</a><!--/email_off-->`;

  return (
    <SafeHtml
      html={html}
      className={wrapperClassName}
      config={{ kind: 'limited', allowedTags: ['a'], allowedAttributes: ['href', 'class', 'aria-label'] }}
    />
  );
}
