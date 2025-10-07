
"use server";

import {addOrder, addOrUpdateCustomer, Customer} from "@/lib/database";
import type {CheckoutFormValues} from "@/app/checkout/page";
import type {CartItem} from "@/hooks/use-cart";

interface CreateOrderArgs {
    customer: CheckoutFormValues;
    items: CartItem[];
    total: number;
    shipping: number;
    stripeSessionId?: string;
}

export async function createOrder(args: CreateOrderArgs): Promise<{success: boolean; orderId?: string; error?: string}> {
    const {customer, items, total, shipping, stripeSessionId} = args;

    try {
        // Step 1: Create or update the customer record.
        const {customerId} = await addOrUpdateCustomer(customer);
        console.log(`Customer record processed for: ${customerId}`);

        // Step 2: Create the order and link it to the customer.
        const orderData = {
            customerId,
            customerName: customer.fullName,
            items,
            total,
            shipping,
            stripeSessionId,
            paymentStatus: 'pending' as const,
        };

        // Step 3: This function now also updates the customer record with the order details.
        const finalOrderId = await addOrder(orderData, customer);
        console.log(`Order ${finalOrderId} created and linked to customer ${customerId}`);

        return {success: true, orderId: finalOrderId};
    } catch (error) {
        console.error("Failed to create order:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while creating the order.";
        return {success: false, error: errorMessage};
    }
}
