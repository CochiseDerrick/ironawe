
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
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, ensuring window is available.
    setProductUrl(`${window.location.origin}/products/${product.slug}`);
    // Check if the browser supports the native Web Share API.
    // If not, we'll show the copy-link popover on desktop.
    if (typeof navigator.share === 'undefined') {
        setIsDesktop(true);
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

    const shareData = {
      title: product.name,
      text: `Check out this amazing sculpture from IronAwe: ${product.name}`,
      url: productUrl,
    };

    try {
        await navigator.share(shareData);
    } catch (error) {
        console.error("Error using Web Share API:", error);
        // This fallback is mostly for when a user cancels the share dialog.
        // The main copy-to-clipboard logic is handled by the Popover for desktop.
    }
  };

  // On desktop (or browsers without navigator.share), show a Popover with a copy button.
  if (isDesktop) {
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

  // On mobile (or browsers with navigator.share), use the native share functionality.
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

