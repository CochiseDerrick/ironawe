
"use server";

import type { CheckoutFormValues } from "@/app/checkout/page";
import type { CartItem } from "@/hooks/use-cart";

interface SumupCheckoutResponse {
    id: string;
    status: string;
    checkout_reference: string;
    amount: number;
    currency: string;
    next_step?: {
        url: string;
    }
}

interface CreateSumupCheckoutArgs {
    totalAmount: number;
    customer: CheckoutFormValues;
    cartItems: CartItem[];
}

// This function first gets an access token, then creates a checkout.
export async function createSumupCheckout({ totalAmount, customer, cartItems }: CreateSumupCheckoutArgs): Promise<{ success: boolean; redirectUrl?: string; error?: string }> {
    const clientId = process.env.SUMUP_CLIENT_ID;
    const clientSecret = process.env.SUMUP_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    if (!clientId || !clientSecret) {
        const errorMsg = "SumUp API credentials are not configured in environment variables.";
        console.error(errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        // Step 1: Get an Access Token from SumUp
        const tokenResponse = await fetch('https://api.sumup.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret,
            }),
        });

        if (!tokenResponse.ok) {
            const errorBody = await tokenResponse.json();
            console.error("SumUp token error response:", errorBody);
            throw new Error(`Failed to get SumUp access token: ${errorBody.error_description || tokenResponse.statusText}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Step 2: Create a Checkout using the Access Token for a hosted payment page
        const checkoutData = {
            checkout_reference: `ironawe-${Date.now()}`,
            amount: totalAmount,
            currency: 'GBP',
            hosted_checkout: {
                enabled: true,
                return_url: `${baseUrl}/checkout/success`
            }
        };
        
        console.log("Sending SumUp checkout payload:", JSON.stringify(checkoutData, null, 2));

        const checkoutResponse = await fetch('https://api.sumup.com/v0.1/checkouts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(checkoutData),
        });

        if (!checkoutResponse.ok) {
            const errorBody = await checkoutResponse.json();
            console.error("SumUp checkout error response:", errorBody);
            throw new Error(`Failed to create SumUp checkout: ${errorBody.error_message || checkoutResponse.statusText}`);
        }

        const checkout: SumupCheckoutResponse = await checkoutResponse.json();
        console.log("Successful SumUp checkout response:", JSON.stringify(checkout, null, 2));
        
        if (checkout.next_step?.url) {
            return { success: true, redirectUrl: checkout.next_step.url };
        } else {
            // Sometimes the URL is at the top level if it's a simple redirect
            const paymentUrl = (checkout as any).pay_link?.url || (checkout as any).redirect_url;
            if (paymentUrl) {
                 return { success: true, redirectUrl: paymentUrl };
            }
            // If the checkout was created but there's no redirect URL, we still need to handle it.
            // This might happen if the total is 0, for instance.
            if (checkout.status === 'PAID') {
                return { success: true, redirectUrl: `${baseUrl}/checkout/success` };
            }
            console.error("SumUp response did not include a payment URL.", checkout);
            throw new Error("SumUp response did not include a payment URL.");
        }

    } catch (error) {
        console.error("SumUp checkout creation failed:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred with SumUp.";
        return { success: false, error: errorMessage };
    }
}
