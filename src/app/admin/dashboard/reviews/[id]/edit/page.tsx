
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getReviewById, updateReview } from "@/lib/database";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditReviewPage() {
    const router = useRouter();
    const params = useParams();
    const reviewId = params.id as string;
    
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [loadingReview, setLoadingReview] = useState(true);

    const [author, setAuthor] = useState("");
    const [location, setLocation] = useState("");
    const [text, setText] = useState("");

    useEffect(() => {
        if (!reviewId) return;

        const fetchReview = async () => {
            try {
                const review = await getReviewById(reviewId);
                if (review) {
                    setAuthor(review.author);
                    setLocation(review.location);
                    setText(review.text);
                } else {
                    toast({
                        variant: "destructive",
                        title: "Review not found",
                    });
                    router.push('/admin/dashboard/reviews');
                }
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Error fetching review",
                });
            } finally {
                setLoadingReview(false);
            }
        };

        fetchReview();
    }, [reviewId, router, toast]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!author || !location || !text) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please fill out all fields.",
            });
            return;
        }

        setLoading(true);
        try {
            await updateReview(reviewId, { author, location, text });

            toast({
                title: "Review Updated",
                description: `The review from "${author}" has been updated.`,
            });
            router.push("/admin/dashboard/reviews");

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: `Could not update review: ${errorMessage}`,
            });
        } finally {
            setLoading(false);
        }
    };

    if (loadingReview) {
        return <EditReviewSkeleton />;
    }

    return (
        <div className="mx-auto grid max-w-2xl flex-1 auto-rows-max gap-4">
            <form onSubmit={handleSubmit}>
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                        <Link href="/admin/dashboard/reviews">
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Back</span>
                        </Link>
                    </Button>
                    <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight">
                        Edit Review
                    </h1>
                </div>
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Review Details</CardTitle>
                        <CardDescription>
                            Update the details for this review.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="author">Author Name</Label>
                                <Input
                                    id="author"
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Author Location</Label>
                                <Input
                                    id="location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="text">Review Text</Label>
                            <Textarea
                                id="text"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                required
                                rows={6}
                            />
                        </div>
                    </CardContent>
                </Card>
                <div className="flex items-center justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm" type="button" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button size="sm" type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
}

const EditReviewSkeleton = () => (
    <div className="mx-auto grid max-w-2xl flex-1 auto-rows-max gap-4">
         <div className="flex items-center gap-4">
            <Skeleton className="h-7 w-7" />
            <Skeleton className="h-6 w-36" />
        </div>
        <Card className="mt-4">
            <CardHeader>
                <Skeleton className="h-7 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </CardContent>
        </Card>
        <div className="flex items-center justify-end gap-2 mt-4">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-28" />
        </div>
    </div>
);
