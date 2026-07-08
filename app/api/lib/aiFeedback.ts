export const AI_FEEDBACK_PATH = '/api/ai/feedback';
export const AI_FEEDBACK_METHODS = 'POST, OPTIONS';

export const AI_FEEDBACK_PROBE = {
  path: AI_FEEDBACK_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: false,
  rateLimitKey: 'cet-ai-feedback' as const,
  rateLimit: 30,
  rateWindowSeconds: 10,
  maxCommentLength: 2000,
  minIdLength: 10,
  maxIdLength: 80,
  validRatings: [-1, 0, 1] as const,
  invalidRatingError: 'Invalid rating. Expected -1, 0, or 1.' as const,
};

export function safeFeedbackText(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export function safeFeedbackId(v: unknown): string | null {
  const s = safeFeedbackText(v, AI_FEEDBACK_PROBE.maxIdLength);
  return s.length >= AI_FEEDBACK_PROBE.minIdLength ? s : null;
}

export function parseFeedbackRating(body: unknown): number | null {
  const ratingRaw =
    typeof body === 'object' && body !== null && 'rating' in body ? (body as { rating: unknown }).rating : null;
  const rating = typeof ratingRaw === 'number' ? Math.trunc(ratingRaw) : Number(ratingRaw);
  return AI_FEEDBACK_PROBE.validRatings.includes(rating as -1 | 0 | 1) ? rating : null;
}

export type FeedbackBodyParse = {
  rating: number;
  messageId: string | null;
  queryLogId: string | null;
  comment: string;
};

export function parseFeedbackBody(body: unknown): FeedbackBodyParse | null {
  const rating = parseFeedbackRating(body);
  if (rating === null) return null;
  return {
    rating,
    messageId:
      typeof body === 'object' && body !== null && 'messageId' in body
        ? safeFeedbackId((body as { messageId: unknown }).messageId)
        : null,
    queryLogId:
      typeof body === 'object' && body !== null && 'queryLogId' in body
        ? safeFeedbackId((body as { queryLogId: unknown }).queryLogId)
        : null,
    comment:
      typeof body === 'object' && body !== null && 'comment' in body
        ? safeFeedbackText((body as { comment: unknown }).comment, AI_FEEDBACK_PROBE.maxCommentLength)
        : '',
  };
}