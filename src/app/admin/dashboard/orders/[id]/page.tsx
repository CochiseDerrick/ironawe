
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, Copy, Calendar, ShoppingBag, TrendingUp, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getOrderById, getCustomerById, type Order, type Customer } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;
    const { toast } = useToast();

    const [order, setOrder] = useState<Order | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) return;

        async function fetchOrderAndCustomer() {
            try {
                const fetchedOrder = await getOrderById(orderId);
                if (fetchedOrder) {
                    setOrder(fetchedOrder);
                    const fetchedCustomer = await getCustomerById(fetchedOrder.customerId);
                    if (fetchedCustomer) {
                        setCustomer(fetchedCustomer);
                    } else {
                         toast({
                            variant: "destructive",
                            title: "Customer not found",
                            description: "Could not find the customer associated with this order.",
                        });
                    }
                } else {
                    toast({
                        variant: "destructive",
                        title: "Order not found",
                        description: "The order you are looking for does not exist.",
                    });
                    router.push("/admin/dashboard/orders");
                }
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to fetch order details.",
                });
            } finally {
                setLoading(false);
            }
        }
        fetchOrderAndCustomer();
    }, [orderId, router, toast]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: "The text has been copied to your clipboard." });
    };

    if (loading) {
        return <OrderDetailsSkeleton />;
    }

    if (!order) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/admin/dashboard/orders">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back to orders</span>
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold">Order Details</h1>
                <Badge variant="outline" className="ml-auto sm:ml-0">
                    {order.status}
                </Badge>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                            <CardDescription className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                                <span>
                                    Order ID: {order.id}
                                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-1" onClick={() => handleCopy(order.id)}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </span>
                                <span className="flex items-center mt-1 sm:mt-0">
                                    <Calendar className="h-4 w-4 mr-1.5" />
                                    {format(new Date(order.createdAt), "dd MMMM yyyy, HH:mm")}
                                </span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-center">Quantity</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="text-center">{item.quantity}</TableCell>
                                            <TableCell className="text-right">£{(item.discountPrice || item.price).toFixed(2)}</TableCell>
                                            <TableCell className="text-right">£{((item.discountPrice || item.price) * item.quantity).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                        <CardFooter className="flex flex-col items-end space-y-2 bg-muted/50 p-6">
                            <div className="flex w-full justify-between">
                                <span>Subtotal</span>
                                <span>£{(order.total - order.shipping).toFixed(2)}</span>
                            </div>
                            <div className="flex w-full justify-between">
                                <span>Shipping</span>
                                <span>£{order.shipping.toFixed(2)}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex w-full justify-between font-semibold text-lg">
                                <span>Total</span>
                                <span>£{order.total.toFixed(2)}</span>
                            </div>
                        </CardFooter>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <p className="font-medium">{customer?.fullName || order.customerName}</p>
                                <p className="text-muted-foreground">{customer?.email || order.customer.email}</p>
                            </div>
                             <Separator />
                             <div>
                                <p className="font-medium mb-2">Shipping Address</p>
                                <address className="not-italic text-muted-foreground">
                                    {customer?.address || order.customer.address}<br />
                                    {customer?.city || order.customer.city}, {customer?.postcode || order.customer.postcode}
                                </address>
                            </div>
                            {customer && (
                                <>
                                    <Separator />
                                    <div className="space-y-3">
                                        <h3 className="font-medium">Customer History</h3>
                                        <div className="flex items-center">
                                            <ShoppingBag className="h-4 w-4 mr-2 text-muted-foreground" />
                                            <span>Total Orders: {customer.orderIds.length}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
                                            <span>Total Spent: £{customer.totalSpent.toFixed(2)}</span>
                                        </div>
                                         <div className="flex items-center">
                                            <History className="h-4 w-4 mr-2 text-muted-foreground" />
                                            <span>First Purchase: {format(new Date(customer.firstPurchase), 'dd MMM yyyy')}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

const OrderDetailsSkeleton = () => (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Skeleton className="h-7 w-7" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-20 ml-auto" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-1/3" />
                        <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-40 w-full" />
                    </CardContent>
                    <CardFooter className="flex flex-col items-end p-6">
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-5 w-1/2 mt-2" />
                        <Skeleton className="h-px w-full my-2" />
                        <Skeleton className="h-6 w-1/2 mt-2" />
                    </CardFooter>
                </Card>
            </div>
            <div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-px w-full my-2" />
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-px w-full my-2" />
                         <Skeleton className="h-4 w-1/3" />
                         <Skeleton className="h-4 w-2/3" />
                         <Skeleton className="h-4 w-2/3" />

                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
);
