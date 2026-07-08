import { CHAT_MESSAGES_PROBE } from './chatMessages';

export const CHAT_MODERATE_PATH = '/api/chat/moderate';
export const CHAT_MODERATE_METHODS = 'POST, OPTIONS';

export const CHAT_MODERATE_ACTIONS = ['hide', 'approve'] as const;
export type ChatModerateAction = (typeof CHAT_MODERATE_ACTIONS)[number];

export const CHAT_MODERATE_PROBE = {
  path: CHAT_MODERATE_PATH,
  methods: ['POST', 'OPTIONS'] as const,
  authRequired: true,
  unauthenticatedStatus: 401,
  forbiddenStatus: 403,
  moderatorRoles: CHAT_MESSAGES_PROBE.moderatorRoles,
  actions: CHAT_MODERATE_ACTIONS,
  invalidRequestError: 'Invalid request' as const,
  invalidActionError: 'Invalid action' as const,
  invalidJsonError: 'Invalid JSON body' as const,
};

export function isChatModeratorRole(role: string): boolean {
  return (CHAT_MODERATE_PROBE.moderatorRoles as readonly string[]).includes(role);
}

export function parseChatModerateAction(action: string): 'hidden' | 'visible' | null {
  if (action === 'hide') return 'hidden';
  if (action === 'approve') return 'visible';
  return null;
}

export type ChatModeratePostBody = { messageId: string; action: string };

export function parseChatModeratePostBody(body: unknown): ChatModeratePostBody {
  const messageId =
    typeof body === 'object' && body !== null && 'messageId' in body && typeof (body as { messageId?: unknown }).messageId === 'string'
      ? (body as { messageId: string }).messageId.trim()
      : '';
  const action =
    typeof body === 'object' && body !== null && 'action' in body && typeof (body as { action?: unknown }).action === 'string'
      ? (body as { action: string }).action.trim()
      : '';
  return { messageId, action };
}