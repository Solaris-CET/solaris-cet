import { cetAiQueryCharCountToneClass, formatCetAiQueryCharCountAria } from '@/lib/cetAiQueryUi';

export function CetAiQueryCharCountLine({
  id,
  length,
  max,
  ariaTemplate,
}: {
  id: string;
  length: number;
  max: number;
  ariaTemplate: string;
}) {
  if (length === 0) return null;
  return (
    <p
      id={id}
      data-testid="cet-ai-query-char-count"
      aria-label={formatCetAiQueryCharCountAria(ariaTemplate, length, max)}
      className={`mt-1 text-right text-[10px] font-mono tabular-nums ${cetAiQueryCharCountToneClass(length, max)}`}
    >
      {length}/{max}
    </p>
  );
}
