
"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Users,
} from "lucide-react"
import Link from "next/link";
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getOrders, type Order } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchOrders() {
            try {
                const fetchedOrders = await getOrders();
                // Sort orders by most recent
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
    
    const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
    const totalSales = orders.length;

    const recentOrders = orders.slice(0, 5);

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Revenue
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">£{totalRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      from {totalSales} orders
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Sales
                    </CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+{totalSales}</div>
                    <p className="text-xs text-muted-foreground">
                      total sales
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+0</div>
                    <p className="text-xs text-muted-foreground">
                      No live visitors
                    </p>
                  </CardContent>
                </Card>
                 <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      New Customers
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+{totalSales}</div>
                    <p className="text-xs text-muted-foreground">
                      since last order
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                  <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-2">
                      <CardTitle>Recent Orders</CardTitle>
                      <CardDescription>
                        Recent transactions from your store.
                      </CardDescription>
                    </div>
                    <Button asChild size="sm" className="ml-auto gap-1">
                      <Link href="#">
                        View All
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead className="hidden xl:table-column">
                            Status
                          </TableHead>
                          <TableHead className="hidden xl:table-column">
                            Date
                          </TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                         {recentOrders.length > 0 ? (
                            recentOrders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell>
                                        <div className="font-medium">{order.customerName}</div>
                                    </TableCell>
                                    <TableCell className="hidden xl:table-column">
                                        <Badge variant="outline">{order.status}</Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell lg:hidden xl:table-column">
                                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                                    </TableCell>
                                    <TableCell className="text-right">£{order.total.toFixed(2)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                          <TableRow>
                              <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                  No recent orders
                              </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Sales</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-8">
                    {recentOrders.length > 0 ? (
                       recentOrders.map(order => (
                         <div key={order.id} className="flex items-center gap-4">
                            <div className="grid gap-1">
                                <p className="text-sm font-medium">{order.customerName}</p>
                                <p className="text-sm text-muted-foreground">
                                    Purchased {order.items.map(i => `${i.quantity} x ${i.name}`).join(', ')}
                                </p>
                            </div>
                            <div className="ml-auto font-medium">+£{order.total.toFixed(2)}</div>
                         </div>
                       ))
                    ) : (
                         <div className="flex items-center justify-center h-24 text-muted-foreground">
                           <p>No recent sales</p>
                         </div>
                    )}
                  </CardContent>
                </Card>
              </div>
        </>
    )
}
