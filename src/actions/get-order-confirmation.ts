"use server";

import {getOrderByIdAdmin, getOrderByStripeSessionIdAdmin} from "@/lib/database-admin";

export interface OrderConfirmation {
    id: string;
    total: number;
    itemCount: number;
    paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled' | undefined;
}

interface GetOrderConfirmationArgs {
    orderId?: string;
    stripeSessionId?: string;
}

/**
 * Looks up an order for the checkout success page, which is viewed by an anonymous shopper
 * right after paying. Uses the Admin SDK because /orders reads are locked to the admin's
 * own account in the security rules - there's no legitimate browser-auth identity for a
 * one-off shopper to read their own order under.
 *
 * Only returns a minimal, non-sensitive subset of the order (no customer name/address/email,
 * no line-item details) - this is reachable by anyone who knows/guesses an order or Stripe
 * session ID, so it intentionally reveals as little as possible.
 */
export async function getOrderConfirmation(
    args: GetOrderConfirmationArgs
): Promise<{success: boolean; order?: OrderConfirmation; error?: string}> {
    const {orderId, stripeSessionId} = args;

    if (!orderId && !stripeSessionId) {
        return {success: false, error: 'Missing payment verification data'};
    }

    try {
        const order = orderId
            ? await getOrderByIdAdmin(orderId)
            : await getOrderByStripeSessionIdAdmin(stripeSessionId!);

        if (!order) {
            return {success: false, error: 'Order not found'};
        }

        return {
            success: true,
            order: {
                id: order.id,
                total: order.total,
                itemCount: order.items.length,
                paymentStatus: order.paymentStatus,
            },
        };
    } catch (error) {
        console.error('Failed to fetch order confirmation:', error);
        return {success: false, error: 'Failed to verify payment status'};
    }
}
