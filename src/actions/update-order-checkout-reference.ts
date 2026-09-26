"use server";

import {updateOrderWithStripeSessionIdAdmin} from "@/lib/database-admin";

// Uses the Admin SDK because this runs from checkout, triggered by an anonymous shopper -
// there's no browser-authenticated admin session available here, and /orders writes are
// locked to the admin's own account in the security rules.
export async function updateOrderWithStripeSessionId(
  orderId: string,
  stripeSessionId: string
): Promise<{success: boolean; error?: string}> {
  try {
    await updateOrderWithStripeSessionIdAdmin(orderId, stripeSessionId);
    return {success: true};
  } catch (error) {
    console.error("Failed to update order with Stripe session ID:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {success: false, error: errorMessage};
  }
}
