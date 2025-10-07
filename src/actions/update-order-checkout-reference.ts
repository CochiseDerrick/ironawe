"use server";

import {updateOrderPaymentStatus, getOrderById, updateOrderStatus} from "@/lib/database";

export async function updateOrderWithStripeSessionId(
  orderId: string,
  stripeSessionId: string
): Promise<{success: boolean; error?: string}> {
  try {
    const orderRef = await import('@/lib/firebase');
    const {db} = orderRef;
    const {ref, update} = await import('firebase/database');

    if (!db) {
      throw new Error("Database not initialized");
    }

    const orderDbRef = ref(db, `orders/${orderId}`);
    await update(orderDbRef, {
      stripeSessionId,
      paymentStatus: 'pending'
    });

    console.log(`Order ${orderId} updated with Stripe session ID: ${stripeSessionId}`);
    return {success: true};
  } catch (error) {
    console.error("Failed to update order with Stripe session ID:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {success: false, error: errorMessage};
  }
}

// Legacy function for backward compatibility (if needed)
export async function updateOrderWithCheckoutReference(
  orderId: string,
  checkoutReference: string
): Promise<{success: boolean; error?: string}> {
  try {
    const orderRef = await import('@/lib/firebase');
    const {db} = orderRef;
    const {ref, update} = await import('firebase/database');

    if (!db) {
      throw new Error("Database not initialized");
    }

    const orderDbRef = ref(db, `orders/${orderId}`);
    await update(orderDbRef, {
      checkoutReference,
      paymentStatus: 'pending'
    });

    console.log(`Order ${orderId} updated with checkout reference: ${checkoutReference}`);
    return {success: true};
  } catch (error) {
    console.error("Failed to update order with checkout reference:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {success: false, error: errorMessage};
  }
}