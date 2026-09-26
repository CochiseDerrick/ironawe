"use server";

import {logWebhookEventAdmin, type WebhookEvent} from '@/lib/database-admin';

export type {WebhookEvent};

// Uses the Admin SDK because this is called from the Stripe webhook route, which is never
// authenticated as anyone, and /webhook_events writes are locked to the admin's own
// account in the security rules.
export async function logWebhookEvent(event: Omit<WebhookEvent, 'id' | 'timestamp'>): Promise<void> {
  await logWebhookEventAdmin(event);
}
