import 'server-only';
import {adminDb} from './firebase-admin';
import type {CheckoutFormValues} from '@/app/checkout/page';
import type {Customer, Order} from '@/lib/database';

/**
 * Admin-SDK-backed equivalents of the handful of `src/lib/database.ts` functions that are
 * only ever called from trusted server code (checkout, the Stripe webhook, order
 * fulfillment) rather than from a logged-in admin's browser session. These bypass Realtime
 * Database security rules entirely, which is what lets an anonymous shopper's checkout
 * write an order/customer record, and lets the Stripe webhook mark it paid and decrement
 * stock, while the rules themselves stay locked down to the admin's own account for every
 * other path.
 *
 * Do not use these from client components - they will fail (adminDb is server-only) and
 * more importantly, they intentionally have no per-user authorization check of their own,
 * so they must only be reachable from code that already fully controls what gets written
 * (Server Actions / route handlers in this app, never arbitrary client input).
 */

function requireAdminDb() {
    if (!adminDb) {
        throw new Error(
            'Firebase Admin SDK is not configured. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.'
        );
    }
    return adminDb;
}

export async function addOrUpdateCustomerAdmin(
    customerData: CheckoutFormValues
): Promise<{customerId: string; isNewCustomer: boolean}> {
    const db = requireAdminDb();

    const customersRef = db.ref('customers');
    const snapshot = await customersRef.orderByChild('email').equalTo(customerData.email).once('value');

    if (snapshot.exists()) {
        const customerId = Object.keys(snapshot.val())[0];
        return {customerId, isNewCustomer: false};
    }

    const newCustomerRef = customersRef.push();
    if (!newCustomerRef.key) {
        throw new Error('Failed to generate a new customer key.');
    }
    // Return a key for a customer that doesn't exist yet - addOrderAdmin creates them.
    return {customerId: newCustomerRef.key, isNewCustomer: true};
}

interface OrderCreationData {
    customerId: string;
    customerName: string;
    items: Order['items'];
    total: number;
    shipping: number;
    stripeSessionId?: string;
    paymentStatus?: Order['paymentStatus'];
}

export async function addOrderAdmin(
    orderData: OrderCreationData,
    customerDetails: CheckoutFormValues
): Promise<string> {
    const db = requireAdminDb();

    const ordersRef = db.ref('orders');
    const newOrderRef = ordersRef.push();
    const orderId = newOrderRef.key;
    if (!orderId) {
        throw new Error('Failed to generate a new order key.');
    }
    const now = new Date().toISOString();

    const {fullName, ...customerInfoForOrder} = customerDetails;

    const baseOrder = {
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        items: orderData.items,
        total: orderData.total,
        shipping: orderData.shipping,
        status: 'Pending' as const,
        createdAt: now,
        paymentStatus: orderData.paymentStatus || ('pending' as const),
        customer: customerInfoForOrder,
    };

    const newOrder = orderData.stripeSessionId
        ? {...baseOrder, stripeSessionId: orderData.stripeSessionId}
        : baseOrder;

    await newOrderRef.set(newOrder);

    const customerRef = db.ref(`customers/${orderData.customerId}`);
    const customerSnapshot = await customerRef.once('value');

    if (customerSnapshot.exists()) {
        const customer = customerSnapshot.val();
        await customerRef.update({
            orderIds: [...(customer.orderIds || []), orderId],
            totalSpent: (customer.totalSpent || 0) + orderData.total,
            lastPurchase: now,
        });
    } else {
        const newCustomerRecord: Omit<Customer, 'id'> = {
            ...customerDetails,
            orderIds: [orderId],
            totalSpent: orderData.total,
            firstPurchase: now,
            lastPurchase: now,
        };
        await customerRef.set(newCustomerRecord);
    }

    return orderId;
}

export async function getOrderByIdAdmin(id: string): Promise<Order | null> {
    const db = requireAdminDb();
    const snapshot = await db.ref(`orders/${id}`).once('value');
    if (!snapshot.exists()) return null;
    return {...snapshot.val(), id};
}

export async function getOrderByStripeSessionIdAdmin(stripeSessionId: string): Promise<Order | null> {
    const db = requireAdminDb();
    const snapshot = await db
        .ref('orders')
        .orderByChild('stripeSessionId')
        .equalTo(stripeSessionId)
        .once('value');

    if (!snapshot.exists()) return null;

    const orders = snapshot.val();
    const orderId = Object.keys(orders)[0];
    return {...orders[orderId], id: orderId};
}

export async function updateOrderPaymentStatusAdmin(
    orderId: string,
    paymentStatus: Order['paymentStatus']
): Promise<void> {
    const db = requireAdminDb();
    await db.ref(`orders/${orderId}`).update({paymentStatus});
    console.log(`[admin] Order ${orderId} payment status updated to ${paymentStatus}.`);
}

export async function updateOrderStatusAdmin(orderId: string, status: Order['status']): Promise<void> {
    const db = requireAdminDb();
    await db.ref(`orders/${orderId}`).update({status});
    console.log(`[admin] Order ${orderId} status updated to ${status}.`);
}

export async function updateOrderWithStripeSessionIdAdmin(
    orderId: string,
    stripeSessionId: string
): Promise<void> {
    const db = requireAdminDb();
    await db.ref(`orders/${orderId}`).update({stripeSessionId, paymentStatus: 'pending'});
    console.log(`[admin] Order ${orderId} updated with Stripe session ID: ${stripeSessionId}`);
}

/**
 * Atomically decrements a product's stock by `quantity`, floored at 0. Uses the Admin
 * SDK's transaction so concurrent purchases can't race each other or push stock negative.
 */
export async function decrementProductStockAdmin(productId: string, quantity: number): Promise<void> {
    const db = requireAdminDb();
    if (quantity <= 0) return;

    const stockRef = db.ref(`products/${productId}/stock`);
    const result = await stockRef.transaction((currentStock: number | null) => {
        const current = typeof currentStock === 'number' ? currentStock : 0;
        return Math.max(0, current - quantity);
    });
    console.log(`[admin] Stock for product ${productId} decremented by ${quantity}. New stock: ${result.snapshot.val()}.`);
}

/**
 * Marks an order as paid and decrements stock for each purchased item, in one place.
 * Idempotent: if the order is already marked 'paid' (Stripe often fires both
 * `checkout.session.completed` and `payment_intent.succeeded` for one purchase), this is a
 * no-op, so stock is never decremented twice for the same order.
 */
export async function fulfillOrderPaymentAdmin(orderId: string): Promise<void> {
    const order = await getOrderByIdAdmin(orderId);
    if (!order) {
        console.error(`[admin] Cannot fulfill payment: order ${orderId} not found.`);
        return;
    }

    if (order.paymentStatus === 'paid') {
        console.log(`[admin] Order ${orderId} is already marked as paid; skipping duplicate stock decrement.`);
        return;
    }

    await updateOrderPaymentStatusAdmin(orderId, 'paid');

    const results = await Promise.allSettled(
        order.items.map(item => decrementProductStockAdmin(item.id, item.quantity))
    );

    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            const item = order.items[index];
            console.error(
                `[admin] Order ${orderId} marked as paid, but failed to decrement stock for product ${item.id} (${item.name}). ` +
                `Stock for this item may need to be corrected manually.`,
                result.reason
            );
        }
    });
}

export interface WebhookEvent {
    id?: string;
    timestamp: string;
    source: 'stripe';
    event_type: string;
    order_id?: string;
    status: string;
    processed: boolean;
    raw_payload: unknown;
}

export async function logWebhookEventAdmin(event: Omit<WebhookEvent, 'id' | 'timestamp'>): Promise<void> {
    if (!adminDb) {
        console.warn('[admin] Firebase Admin SDK not configured. Cannot log webhook event.');
        return;
    }
    try {
        const newEventRef = adminDb.ref('webhook_events').push();
        await newEventRef.set({
            ...event,
            timestamp: new Date().toISOString(),
        });
        console.log('[admin] Webhook event logged:', newEventRef.key);
    } catch (error) {
        // Logging should never break webhook processing.
        console.error('[admin] Failed to log webhook event:', error);
    }
}
