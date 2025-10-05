
"use client"

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LineChart, Users, DollarSign, CreditCard } from "lucide-react"
import { getOrders, getCustomers, Order, Customer } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

type ChartData = {
  label: string;
  sales: number;
};

type TimePeriod = "monthly" | "weekly" | "daily";

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--primary))",
  },
}

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("monthly");
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        const [fetchedOrders, fetchedCustomers] = await Promise.all([
          getOrders(),
          getCustomers(),
        ]);
        setOrders(fetchedOrders);
        setCustomers(fetchedCustomers);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load analytics data",
          description: "Could not fetch data from the database.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalSales = orders.length;

  const chartData: ChartData[] = orders.reduce((acc, order) => {
    const date = new Date(order.createdAt);
    let key: string;

    switch (timePeriod) {
        case "daily":
            key = format(date, 'yyyy-MM-dd');
            break;
        case "weekly":
            const weekStart = format(new Date(date.getFullYear(), 0, 1 + (parseInt(format(date, 'w')) - 1) * 7), 'MMM d');
            key = `Week of ${weekStart}`;
            break;
        case "monthly":
        default:
            key = format(date, 'MMM yyyy');
            break;
    }

    const existingEntry = acc.find(item => item.label === key);
    if (existingEntry) {
      existingEntry.sales += order.total;
    } else {
      acc.push({ label: key, sales: order.total });
    }
    return acc;
  }, [] as ChartData[]).sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Analytics Overview</h1>
        <p className="text-muted-foreground">Insights into your store's performance.</p>
      </div>
       <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">£{totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">from {totalSales} orders</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{customers.length}</div>
                <p className="text-xs text-muted-foreground">customers</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <CreditCard className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">+{totalSales}</div>
                 <p className="text-xs text-muted-foreground">transactions</p>
            </CardContent>
        </Card>
      </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Sales Over Time</CardTitle>
              <CardDescription>A summary of your store's sales by month.</CardDescription>
            </div>
             <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                <BarChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar dataKey="sales" fill="var(--color-sales)" radius={8} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg">
                  <LineChart className="w-10 h-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No sales data available yet.
                  </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <div className="text-sm text-muted-foreground">
              Sales data will update as you make sales.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
