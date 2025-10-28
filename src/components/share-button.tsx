
"use client";

import { useState, useEffect } from "react";
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

interface ShareButtonProps {
  product: Product;
}

export default function ShareButton({ product }: ShareButtonProps) {
  const { toast } = useToast();
  const [productUrl, setProductUrl] = useState("");

  useEffect(() => {
    // This ensures window.location.origin is only accessed on the client-side
    const url = `${window.location.origin}/products/${product.slug}`;
    setProductUrl(url);
  }, [product.slug]);

  const handleShare = async () => {
    if (!productUrl) return;

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
    if (!productUrl) return;
    
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
                        <Button type="button" size="sm" className="px-3" onClick={copyToClipboard} disabled={!productUrl}>
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
      disabled={!productUrl}
    >
      <Share2 className="h-5 w-5" />
      <span className="sr-only">Share</span>
    </Button>
  );
}
