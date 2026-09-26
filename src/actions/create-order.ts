
"use server";

import {checkStockAvailability} from "@/lib/database";
import {addOrderAdmin, addOrUpdateCustomerAdmin} from "@/lib/database-admin";
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
        // Step 0: Re-validate stock against the live database. Client-side cart state can be
        // stale (another customer may have bought the item, or the admin may have marked it
        // sold out) or tampered with, so this is the authoritative check before we create an
        // order or charge anyone.
        const stockIssues = await checkStockAvailability(items.map(item => ({id: item.id, quantity: item.quantity})));
        if (stockIssues.length > 0) {
            const message = stockIssues
                .map(issue =>
                    issue.available <= 0
                        ? `${issue.name} is now sold out.`
                        : `${issue.name}: only ${issue.available} left (you requested ${issue.requested}).`
                )
                .join(' ');
            return {success: false, error: message};
        }

        // Step 1: Create or update the customer record. Uses the Admin SDK because this
        // action runs unauthenticated (it's triggered by an anonymous shopper) and
        // /customers is locked to the admin's own account in the security rules.
        const {customerId} = await addOrUpdateCustomerAdmin(customer);
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
        const finalOrderId = await addOrderAdmin(orderData, customer);
        console.log(`Order ${finalOrderId} created and linked to customer ${customerId}`);

        return {success: true, orderId: finalOrderId};
    } catch (error) {
        console.error("Failed to create order:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while creating the order.";
        return {success: false, error: errorMessage};
    }
}
