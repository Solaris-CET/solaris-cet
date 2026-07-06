export const TWIN_WEBHOOK_DELIVERY_SCHEMA = 'solaris-twin-webhook-delivery-v1';

export type TwinWebhookDelivery = {
  schema: string;
  delivery_id: string;
  direction: 'inbound' | 'outbound';
  status: string;
  event_type: string;
  report_id: string;
  http_status?: number | null;
  detail?: string;
  payload?: Record<string, unknown>;
  timestamp: string;
};

export type TwinWebhookDeliveriesResponse = {
  platform?: string;
  total: number;
  deliveries: TwinWebhookDelivery[];
};