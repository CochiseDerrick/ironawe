
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { addReview } from "@/lib/database";

export default function NewReviewPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [author, setAuthor] = useState("");
    const [location, setLocation] = useState("");
    const [text, setText] = useState("");

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
            await addReview({ author, location, text });

            toast({
                title: "Review Created",
                description: `The review from "${author}" has been successfully added.`,
            });
            router.push("/admin/dashboard/reviews");

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                variant: "destructive",
                title: "Creation Failed",
                description: `Could not add the review: ${errorMessage}`,
            });
        } finally {
            setLoading(false);
        }
    };

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
                        Add New Review
                    </h1>
                </div>
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Review Details</CardTitle>
                        <CardDescription>
                            Fill in the details for the new review.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="author">Author Name</Label>
                                <Input
                                    id="author"
                                    placeholder="e.g., Jane Smith"
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                    required
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="location">Author Location</Label>
                                <Input
                                    id="location"
                                    placeholder="e.g., Dorset, UK"
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
                                placeholder="Write the review content here..."
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
                        Save Review
                    </Button>
                </div>
            </form>
        </div>
    );
}
