import {NextRequest, NextResponse} from 'next/server';
import {headers} from 'next/headers';
import Stripe from 'stripe';
import {getOrderByStripeSessionId, updateOrderPaymentStatus} from '@/lib/database';
import {updateOrderStatus} from '@/actions/update-order-status';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const headersList = await headers();
        const signature = headersList.get('stripe-signature');

        if (!signature) {
            console.error('Missing Stripe webhook signature');
            return NextResponse.json({error: 'Missing signature'}, {status: 400});
        }

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET!
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err);
            return NextResponse.json({error: 'Invalid signature'}, {status: 400});
        }

        console.log('Received Stripe webhook:', {
            type: event.type,
            id: event.id,
        });

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
                break;

            case 'checkout.session.expired':
                await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({received: true}, {status: 200});

    } catch (error) {
        console.error('Error processing Stripe webhook:', error);
        return NextResponse.json({
            error: 'Internal server error'
        }, {status: 500});
    }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    console.log('Checkout session completed:', session.id);

    if (!session.id) return;

    const order = await getOrderByStripeSessionId(session.id);
    if (!order) {
        console.error('Order not found for Stripe session:', session.id);
        return;
    }

    // Update payment status to paid
    await updateOrderPaymentStatus(order.id, 'paid');

    console.log(`Order ${order.id} payment confirmed via Stripe session ${session.id}`);
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    console.log('Payment intent succeeded:', paymentIntent.id);

    // If we have order metadata, update the order
    if (paymentIntent.metadata?.orderId) {
        await updateOrderPaymentStatus(paymentIntent.metadata.orderId, 'paid');
        console.log(`Order ${paymentIntent.metadata.orderId} payment confirmed via payment intent ${paymentIntent.id}`);
    }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    console.log('Payment intent failed:', paymentIntent.id);

    // If we have order metadata, update the order
    if (paymentIntent.metadata?.orderId) {
        await updateOrderPaymentStatus(paymentIntent.metadata.orderId, 'failed');

        // Also update order status to cancelled
        const orderResult = await updateOrderStatus(paymentIntent.metadata.orderId, 'Cancelled');
        if (!orderResult.success) {
            console.error('Failed to update order status to cancelled:', orderResult.error);
        }

        console.log(`Order ${paymentIntent.metadata.orderId} payment failed via payment intent ${paymentIntent.id}`);
    }
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
    console.log('Checkout session expired:', session.id);

    if (!session.id) return;

    const order = await getOrderByStripeSessionId(session.id);
    if (!order) {
        console.error('Order not found for expired Stripe session:', session.id);
        return;
    }

    // Update payment status to cancelled
    await updateOrderPaymentStatus(order.id, 'cancelled');

    // Also update order status to cancelled
    const orderResult = await updateOrderStatus(order.id, 'Cancelled');
    if (!orderResult.success) {
        console.error('Failed to update order status to cancelled:', orderResult.error);
    }

    console.log(`Order ${order.id} cancelled due to expired Stripe session ${session.id}`);
}

// Handle GET requests for webhook endpoint verification
export async function GET() {
    return NextResponse.json({
        message: 'Stripe webhook endpoint is active',
        endpoint: '/api/stripe/webhook',
        timestamp: new Date().toISOString()
    });
}