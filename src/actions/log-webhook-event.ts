"use server";

import {db} from '@/lib/firebase';
import {ref, push, set} from 'firebase/database';

export interface WebhookEvent {
  id?: string;
  timestamp: string;
  source: 'sumup';
  event_type: string;
  checkout_reference?: string;
  order_id?: string;
  status: string;
  processed: boolean;
  raw_payload: any;
}

export async function logWebhookEvent(event: Omit<WebhookEvent, 'id' | 'timestamp'>): Promise<void> {
  if (!db) {
    console.warn("Database not initialized. Cannot log webhook event.");
    return;
  }

  try {
    const webhookLogsRef = ref(db, 'webhook_events');
    const newEventRef = push(webhookLogsRef);

    const webhookEvent: WebhookEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    await set(newEventRef, webhookEvent);
    console.log('Webhook event logged:', newEventRef.key);
  } catch (error) {
    console.error('Failed to log webhook event:', error);
    // Don't throw error - logging should not break webhook processing
  }
}