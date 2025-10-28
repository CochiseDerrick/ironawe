
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
  const [isShareApiAvailable, setIsShareApiAvailable] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, ensuring window is available.
    setProductUrl(`${window.location.origin}/products/${product.slug}`);
    // Check if the browser supports the native Web Share API.
    if (typeof navigator.share === 'function') {
        setIsShareApiAvailable(true);
    }
  }, [product.slug]);

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

  const handleShare = async () => {
    if (!productUrl) return;

    // Use Web Share API if available
    if (isShareApiAvailable) {
        const shareData = {
          title: product.name,
          text: `Check out this amazing sculpture from IronAwe: ${product.name}`,
          url: productUrl,
        };

        try {
            await navigator.share(shareData);
            return; // Exit if share is successful
        } catch (error) {
            // This error occurs if the user cancels the share, or if the API is blocked (e.g., non-HTTPS)
            // We don't need to show an error for a user cancellation.
            // If the error is NotAllowedError, we let it fall through to the popover logic below.
            if (error instanceof DOMException && error.name === 'AbortError') {
              return;
            }
            console.error("Error using Web Share API:", error);
        }
    }
    
    // Fallback for desktop or when navigator.share fails: Copy link
    copyToClipboard();
  };
  
  // Always render the Popover for desktop users or as a fallback.
  // The mobile share sheet will be triggered by `handleShare` if available.
  if (!isShareApiAvailable) {
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

  // On browsers with navigator.share, use the native share functionality.
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
