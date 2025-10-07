
"use client";

import {useState, useEffect} from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import Link from "next/link";
import {CheckCircle, AlertCircle, Loader2} from "lucide-react";
import {getOrderById, getOrderByStripeSessionId} from "@/lib/database";
import {useCart} from "@/hooks/use-cart";

interface PaymentVerificationState {
  status: 'loading' | 'verified' | 'pending' | 'failed';
  orderData?: any;
  error?: string;
}

export default function CheckoutSuccessPage() {
  const [verificationState, setVerificationState] = useState<PaymentVerificationState>({
    status: 'loading'
  });
  const { clearCart } = useCart();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // First, try to get session ID from URL parameters (Stripe redirects with this)
        const urlParams = new URLSearchParams(window.location.search);
        const sessionIdFromUrl = urlParams.get('session_id');

        // Fallback to localStorage
        const stripeSessionId = sessionIdFromUrl || localStorage.getItem('stripe_session_id');
        const orderId = localStorage.getItem('order_id');

        if (!stripeSessionId) {
          setVerificationState({
            status: 'failed',
            error: 'Missing payment verification data'
          });
          return;
        }

        // If we have session ID but no order ID, try to find the order by session ID
        let order;
        if (orderId) {
          order = await getOrderById(orderId);
        } else {
          // Try to find order by Stripe session ID
          order = await getOrderByStripeSessionId(stripeSessionId);
        }

        if (!order) {
          setVerificationState({
            status: 'failed',
            error: 'Order not found'
          });
          return;
        }

        // Clear localStorage after successful verification
        localStorage.removeItem('stripe_session_id');
        localStorage.removeItem('order_id');

        const paymentStatus = order.paymentStatus === 'paid' ? 'verified' : 'pending';
        
        setVerificationState({
          status: paymentStatus,
          orderData: order
        });

        // Clear the shopping cart after successful payment verification
        if (paymentStatus === 'verified') {
          clearCart();
          console.log('Shopping cart cleared after successful payment');
        }

      } catch (error) {
        console.error('Payment verification failed:', error);
        setVerificationState({
          status: 'failed',
          error: 'Failed to verify payment status'
        });
      }
    };

    verifyPayment();
  }, []);

  if (verificationState.status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
            <CardTitle className="text-3xl font-headline">Verifying Payment...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please wait while we confirm your payment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationState.status === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto bg-destructive/10 rounded-full p-4 w-fit mb-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-3xl font-headline">Payment Issue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {verificationState.error || 'There was an issue verifying your payment.'}
            </p>
            <p className="text-muted-foreground">
              Please contact support if you believe this is an error.
            </p>
            <Button asChild className="mt-6">
              <Link href="/contact">Contact Support</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationState.status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto bg-yellow-100 rounded-full p-4 w-fit mb-4">
              <AlertCircle className="h-12 w-12 text-yellow-600" />
            </div>
            <CardTitle className="text-3xl font-headline">Payment Pending</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your order has been placed, but payment is still being processed.
            </p>
            <p className="text-muted-foreground">
              You will receive an email confirmation once payment is complete.
            </p>
            <Button asChild className="mt-6">
              <Link href="/">Continue Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Thank You!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your payment has been confirmed and your order is being processed.
          </p>
          <p className="text-muted-foreground">
            We've sent a confirmation email to you and will start processing your order right away.
          </p>
          {verificationState.orderData && (
            <div className="bg-muted p-3 rounded-md text-sm">
              <p><strong>Order Total:</strong> £{verificationState.orderData.total.toFixed(2)}</p>
              <p><strong>Items:</strong> {verificationState.orderData.items.length} item{verificationState.orderData.items.length > 1 ? 's' : ''}</p>
            </div>
          )}
          <Button asChild className="mt-6">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
