export function CetSymbol({
  className,
  ariaLabel = 'C-E-T token',
}: {
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <abbr
      title="Cetățuia Equity Token"
      aria-label={ariaLabel}
      className={className ? `no-underline ${className}` : 'no-underline'}
    >
      CET
    </abbr>
  );
}

