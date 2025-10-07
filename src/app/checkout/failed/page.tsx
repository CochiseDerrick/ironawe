"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import Link from "next/link";
import {AlertTriangle} from "lucide-react";

export default function PaymentFailedPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear any stored checkout data since payment failed
    localStorage.removeItem('checkout_reference');
    localStorage.removeItem('order_id');
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 rounded-full p-4 w-fit mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-3xl font-headline">Payment Failed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Unfortunately, your payment could not be processed.
          </p>
          <p className="text-muted-foreground">
            Please check your payment details and try again, or contact your bank if the issue persists.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button asChild className="flex-1">
              <Link href="/checkout">Try Again</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}