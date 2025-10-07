
"use client";

import {useState, useEffect} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import Image from "next/image";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import {Loader2, ShieldAlert} from "lucide-react";

import {Card, CardContent, CardHeader, CardTitle, CardFooter} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {useCart} from "@/hooks/use-cart";
import {useToast} from "@/hooks/use-toast";
import {createOrder} from "@/actions/create-order";
import {createStripeCheckout} from "@/actions/create-stripe-checkout";
import {updateOrderWithStripeSessionId} from "@/actions/update-order-checkout-reference";
import {Alert, AlertTitle, AlertDescription} from "@/components/ui/alert";
import type {CartItem} from "@/hooks/use-cart";

const checkoutSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postcode: z.string().min(1, "Postcode is required"),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const {cartItems, cartTotal, shippingTotal, clearCart} = useCart();
  const router = useRouter();
  const {toast} = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<CheckoutFormValues | null>(null);
  const [processingStage, setProcessingStage] = useState<'idle' | 'creating-order' | 'initializing-payment' | 'redirecting'>('idle');

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      email: "",
      address: "",
      city: "",
      postcode: "",
    },
  });

  const total = cartTotal + shippingTotal;

  const onSubmit = async (data: CheckoutFormValues) => {
    setIsSubmitting(true);
    setCustomerDetails(data);
    setProcessingStage('creating-order');

    try {
      // First, create the order in our database with a 'Pending' status
      const orderResult = await createOrder({
        customer: data,
        items: cartItems,
        total,
        shipping: shippingTotal,
      });

      if (!orderResult.success || !orderResult.orderId) {
        throw new Error(orderResult.error || "Failed to save order before payment.");
      }

      setProcessingStage('initializing-payment');

      // If the order is saved, proceed to create the Stripe checkout
      const checkoutResult = await createStripeCheckout({
        totalAmount: total,
        customer: data,
        cartItems: cartItems,
        orderId: orderResult.orderId,
      });

      if (checkoutResult.success && checkoutResult.url) {
        setProcessingStage('redirecting');

        // Update the order with the Stripe session ID
        if (checkoutResult.sessionId) {
          const updateResult = await updateOrderWithStripeSessionId(orderResult.orderId, checkoutResult.sessionId);
          if (!updateResult.success) {
            console.error("Failed to update order with Stripe session ID:", updateResult.error);
            // Continue anyway since payment can still proceed
          }

          // Store session ID for verification on success page
          localStorage.setItem('stripe_session_id', checkoutResult.sessionId);
          localStorage.setItem('order_id', orderResult.orderId);
        }

        // Small delay to show the redirecting message
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Redirect the user to the Stripe payment page
        window.location.href = checkoutResult.url;
      } else {
        throw new Error(checkoutResult.error || "Failed to initialize payment.");
      }

    } catch (error) {
      console.error("Checkout process failed:", error);

      let errorMessage = "An unknown error occurred during checkout.";
      let userFriendlyTitle = "Checkout Error";

      if (error instanceof Error) {
        if (error.message.includes("Stripe")) {
          userFriendlyTitle = "Payment System Error";
          errorMessage = "There was an issue connecting to our payment system. Please try again in a moment.";
        } else if (error.message.includes("Failed to save order")) {
          userFriendlyTitle = "Order Creation Error";
          errorMessage = "We couldn't save your order. Please check your connection and try again.";
        } else if (error.message.includes("credentials")) {
          userFriendlyTitle = "System Configuration Error";
          errorMessage = "Our payment system is temporarily unavailable. Please try again later or contact support.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        variant: "destructive",
        title: userFriendlyTitle,
        description: errorMessage,
      });
      setIsSubmitting(false);
      setProcessingStage('idle');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">Your cart is empty.</h1>
        <p className="text-muted-foreground">Add items to your cart to proceed to checkout.</p>
        <Button asChild className="mt-4">
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-headline font-bold text-primary sm:text-5xl md:text-6xl">
          Checkout
        </h1>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Shipping & Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@example.com" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main Street" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Poole" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postcode"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>Postcode</FormLabel>
                        <FormControl>
                          <Input placeholder="BH15 1AB" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="divide-y text-sm">
                  {cartItems.map(item => (
                    <li key={item.id} className="flex items-center py-2">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                        <Image
                          src={item.images[0]}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover object-center"
                          unoptimized
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p>£{(item.discountPrice || item.price).toFixed(2)}</p>
                    </li>
                  ))}
                </ul>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>£{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>£{shippingTotal.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>£{total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {processingStage === 'creating-order' && 'Creating Order...'}
                  {processingStage === 'initializing-payment' && 'Setting up Payment...'}
                  {processingStage === 'redirecting' && 'Redirecting to Payment...'}
                  {processingStage === 'idle' && !isSubmitting && 'Proceed to Payment'}
                  {processingStage === 'idle' && isSubmitting && 'Processing...'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  )
}
