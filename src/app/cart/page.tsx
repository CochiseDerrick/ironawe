
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, shippingTotal } = useCart();
  const { toast } = useToast();
  
  const total = cartTotal + shippingTotal;
  const isPromoEligible = cartItems.some(item => item.promoEligible);

  const handleRemoveFromCart = (item: any) => {
    removeFromCart(item.id);
    toast({
      title: "Item Removed",
      description: `${item.name} has been removed from your cart.`,
    });
  };
  
  if (cartItems.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center">
            <h1 className="text-4xl font-headline font-bold text-primary sm:text-5xl md:text-6xl">
            Shopping Cart
            </h1>
        </div>
        <div role="region" aria-labelledby="empty-cart-heading" className="text-center border-2 border-dashed rounded-lg p-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
            <h2 id="empty-cart-heading" className="mt-4 text-xl font-semibold">Your Cart is Empty</h2>
            <p className="mt-2 text-muted-foreground">
                Looks like you haven't added any sculptures yet.
            </p>
            <Button asChild className="mt-6">
                <Link href="/">Browse Gallery</Link>
            </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-headline font-bold text-primary sm:text-5xl md:text-6xl">
          Shopping Cart
        </h1>
      </header>
      <div className="grid lg:grid-cols-3 gap-8">
        <section aria-labelledby="cart-items-heading" className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 id="cart-items-heading" className="text-2xl font-semibold">Your Items ({cartItems.length})</h2>
            </CardHeader>
            <CardContent>
              <ul aria-label="Items in your shopping cart" className="divide-y">
                {cartItems.map(item => (
                  <li key={item.id} className="flex py-6">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border">
                      <Image
                        src={item.images[0]}
                        alt={item.name}
                        width={100}
                        height={100}
                        className="h-full w-full object-cover object-center"
                        unoptimized
                      />
                    </div>
                    <div className="ml-4 flex flex-1 flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium">
                          <h3 className="font-headline">{item.name}</h3>
                          <p className="ml-4">£{(item.discountPrice || item.price).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex flex-1 items-end justify-between text-sm">
                        <div className="flex items-center border rounded-md">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Decrease quantity of ${item.name}`}><Minus className="h-4 w-4" /></Button>
                          <span className="px-2" aria-live="polite"> {item.quantity}</span>
                           <Label htmlFor={`quantity-${item.id}`} className="sr-only">Quantity</Label>
                           <input type="hidden" id={`quantity-${item.id}`} value={item.quantity} />
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Increase quantity of ${item.name}`}><Plus className="h-4 w-4" /></Button>
                        </div>
                        <div className="flex">
                          <Button variant="ghost" type="button" className="font-medium text-destructive hover:text-destructive" onClick={() => handleRemoveFromCart(item)} aria-label={`Remove ${item.name} from cart`}>
                            <Trash2 className="h-4 w-4 mr-1"/> Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="order-summary-heading">
          <Card>
            <CardHeader>
              <h2 id="order-summary-heading" className="text-2xl font-semibold">Order Summary</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>£{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping & Handling</span>
                <span>£{shippingTotal.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>£{total.toFixed(2)}</span>
              </div>
              <div className="space-y-2 pt-4">
                 <Label htmlFor="promo-code">Promo Code</Label>
                 <div className="flex gap-2">
                   <Input id="promo-code" placeholder="Enter code" disabled={!isPromoEligible} aria-describedby="promo-description" />
                   <Button variant="outline" disabled={!isPromoEligible}>Apply</Button>
                 </div>
                 <p id="promo-description" className="text-xs text-muted-foreground">
                    {!isPromoEligible ? "Promo codes cannot be applied to the items in your cart." : "Enter a promo code to apply a discount."}
                 </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full bg-accent hover:bg-accent/90">
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
            </CardFooter>
          </Card>
        </section>
      </div>
    </div>
  )
}
