
"use server";

import { updateOrderStatus as dbUpdateOrderStatus, type Order } from "@/lib/database";

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<{ success: boolean; error?: string }> {
    try {
        await dbUpdateOrderStatus(orderId, status);
        return { success: true };
    } catch (error) {
        console.error("Failed to update order status:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}
