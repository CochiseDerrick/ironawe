
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOrders, type Order } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Pencil, Ship } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { updateOrderStatus } from "@/actions/update-order-status";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchOrders() {
      try {
        const fetchedOrders = await getOrders();
        // Sort by most recent
        fetchedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(fetchedOrders);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load orders",
          description: "Could not fetch orders from the database.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [toast]);

  const handleMarkAsShipped = async (orderId: string) => {
    const originalOrders = [...orders];
    
    // Optimistically update the UI
    setOrders(prevOrders => 
        prevOrders.map(o => o.id === orderId ? { ...o, status: 'Shipped' } : o)
    );

    const result = await updateOrderStatus(orderId, 'Shipped');

    if (result.success) {
        toast({
            title: "Order Updated",
            description: `Order has been marked as shipped.`,
        });
    } else {
        // Revert the UI on failure
        setOrders(originalOrders);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: result.error || "Could not update the order status.",
        });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Orders</h1>
        <p className="text-muted-foreground">View and manage customer orders.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            A list of all transactions made in your store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : orders.length > 0 ? (
                orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.customerName}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {format(new Date(order.createdAt), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={order.status === 'Shipped' ? 'default' : 'outline'}>{order.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {order.items.reduce((acc, item) => acc + item.quantity, 0)}
                    </TableCell>
                    <TableCell className="text-right">£{order.total.toFixed(2)}</TableCell>
                    <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link href={`/admin/dashboard/orders/${order.id}`} className="cursor-pointer">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleMarkAsShipped(order.id)} disabled={order.status === 'Shipped'}>
                                <Ship className="mr-2 h-4 w-4" />
                                Mark as Shipped
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
