
"use client";

import { Share2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/database";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface ShareButtonProps {
  product: Product;
}

export default function ShareButton({ product }: ShareButtonProps) {
  const { toast } = useToast();
  const productUrl = `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/products/${product.slug}`;

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Check out this amazing sculpture: ${product.name}`,
      url: productUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error("Error using Web Share API:", error);
        // Fallback to copy link if user cancels or there's an error
        copyToClipboard();
      }
    } else {
        // Fallback for desktop browsers
        copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(productUrl).then(() => {
        toast({
            title: "Link Copied!",
            description: "The product link has been copied to your clipboard.",
        });
    }, (err) => {
        console.error("Failed to copy text: ", err);
        toast({
            variant: "destructive",
            title: "Copy Failed",
            description: "Could not copy the link. Please try again.",
        });
    });
  }

  // Use Popover for desktop to show the link, and direct share on mobile
  if (typeof window !== 'undefined' && !navigator.share) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Share this product">
                    <Share2 className="h-5 w-5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Share this Sculpture</h4>
                        <p className="text-sm text-muted-foreground">
                            Copy the link below to share.
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Input
                            id="product-link"
                            value={productUrl}
                            readOnly
                            className="h-9 flex-1"
                        />
                        <Button type="button" size="sm" className="px-3" onClick={copyToClipboard}>
                            <span className="sr-only">Copy</span>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleShare}
      className="rounded-full"
      aria-label="Share this product"
    >
      <Share2 className="h-5 w-5" />
      <span className="sr-only">Share</span>
    </Button>
  );
}
