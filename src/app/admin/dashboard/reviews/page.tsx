
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  Loader2,
  Trash2,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Review } from "@/lib/database";
import { getReviews, deleteReview } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchReviews() {
      try {
        const fetchedReviews = await getReviews();
        setReviews(fetchedReviews);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load reviews",
          description: "Could not fetch reviews from the database.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [toast]);
  
  const handleDeleteClick = (review: Review) => {
    setReviewToDelete(review);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!reviewToDelete) return;

    setDeleting(true);
    try {
      await deleteReview(reviewToDelete.id);
      setReviews(reviews.filter(r => r.id !== reviewToDelete.id));
      toast({
        title: "Review Deleted",
        description: `The review from "${reviewToDelete.author}" has been deleted.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "Could not delete the review. Please try again.",
      });
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
      setReviewToDelete(null);
    }
  };

  return (
    <>
      <div className="flex items-center">
          <h1 className="text-3xl font-bold font-headline">Reviews</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1" asChild>
              <Link href="/admin/dashboard/reviews/new">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Add Review
                </span>
              </Link>
            </Button>
          </div>
      </div>
        <Card>
        <CardHeader>
            <CardTitle>Manage Reviews</CardTitle>
            <CardDescription>
            Add, edit, or delete customer reviews shown on your homepage.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            ) : (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Author</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="hidden md:table-cell">
                    Review Text
                    </TableHead>
                    <TableHead>
                    <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {reviews.map(review => (
                    <TableRow key={review.id}>
                    <TableCell className="font-medium">
                        {review.author}
                    </TableCell>
                     <TableCell>
                        {review.location}
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-sm">
                        <p className="truncate">{review.text}</p>
                    </TableCell>
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
                                <Link href={`/admin/dashboard/reviews/${review.id}/edit`} className="cursor-pointer">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                                onClick={() => handleDeleteClick(review)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            )}
        </CardContent>
        </Card>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the review from "{reviewToDelete?.author}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
