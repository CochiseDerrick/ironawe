"use server";

import {updateOrderStatusAdmin} from "@/lib/database-admin";
import type {Order} from "@/lib/database";

// Uses the Admin SDK because this action is shared by two unauthenticated callers: the
// admin's "Mark as Shipped" button (Server Actions never carry the browser's Firebase Auth
// session) and the Stripe webhook (never authenticated as anyone). /orders writes are
// locked to the admin's own account in the security rules, so both callers need this.
export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<{ success: boolean; error?: string }> {
    try {
        await updateOrderStatusAdmin(orderId, status);
        return { success: true };
    } catch (error) {
        console.error("Failed to update order status:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}
