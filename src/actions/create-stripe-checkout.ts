"use server";

import Stripe from 'stripe';
import type {CheckoutFormValues} from "@/app/checkout/page";
import type {CartItem} from "@/hooks/use-cart";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface CreateStripeCheckoutArgs {
    totalAmount: number;
    customer: CheckoutFormValues;
    cartItems: CartItem[];
    orderId: string;
}

export async function createStripeCheckout({
    totalAmount,
    customer,
    cartItems,
    orderId
}: CreateStripeCheckoutArgs): Promise<{
    success: boolean;
    sessionId?: string;
    url?: string;
    error?: string
}> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        // Create line items for Stripe
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cartItems.map(item => ({
            price_data: {
                currency: 'gbp',
                product_data: {
                    name: item.name,
                    description: item.description || 'Custom fabrication item',
                    images: item.images?.slice(0, 1) || [], // Stripe allows max 8 images, we'll use first one
                },
                unit_amount: Math.round((item.discountPrice || item.price) * 100), // Convert to pence
            },
            quantity: item.quantity,
        }));

        // Add shipping as a line item if there's shipping cost
        const shippingTotal = cartItems.reduce((total, item) => {
            return total + (item.shippingCost || 0) * item.quantity;
        }, 0);

        if (shippingTotal > 0) {
            lineItems.push({
                price_data: {
                    currency: 'gbp',
                    product_data: {
                        name: 'Shipping & Handling',
                        description: 'Delivery to your address',
                    },
                    unit_amount: Math.round(shippingTotal * 100),
                },
                quantity: 1,
            });
        }

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            customer_email: customer.email,
            metadata: {
                orderId: orderId,
                customerName: customer.fullName,
                customerAddress: `${customer.address}, ${customer.city}, ${customer.postcode}`,
            },
            shipping_address_collection: {
                allowed_countries: ['GB'], // UK only for now
            },
            success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/checkout?cancelled=true`,
            automatic_tax: {
                enabled: false, // Set to true if you want Stripe to calculate tax
            },
        });

        console.log('Stripe checkout session created:', session.id);

        return {
            success: true,
            sessionId: session.id,
            url: session.url || undefined,
        };

    } catch (error) {
        console.error('Stripe checkout creation failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred with Stripe.';
        return {success: false, error: errorMessage};
    }
}