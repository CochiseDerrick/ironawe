
"use client";

import { useEffect, useState } from "react";
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
import { getCustomers, type Customer } from "@/lib/database";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { format } from 'date-fns';


export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const fetchedCustomers = await getCustomers();
        setCustomers(fetchedCustomers);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load customers",
          description: "Could not fetch customers from the database.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, [toast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Customers</h1>
        <p className="text-muted-foreground">View and manage your customers.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>
            A list of all customers who have made a purchase.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Orders</TableHead>
                  <TableHead className="hidden md:table-cell">Total Spent</TableHead>
                   <TableHead className="hidden md:table-cell">
                    First Purchase
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        </TableCell>
                    </TableRow>
                ) : customers.length > 0 ? (
                  customers.map(customer => (
                    <TableRow key={customer.id}>
                      <TableCell>{customer.fullName}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell className="hidden md:table-cell">{customer.orderIds.length}</TableCell>
                      <TableCell className="hidden md:table-cell">£{customer.totalSpent.toFixed(2)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(new Date(customer.firstPurchase), 'PPP')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                            No customers yet
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
