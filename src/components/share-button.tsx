
"use client";

import { useState, useEffect } from "react";
import { Share2, Copy, X as TwitterIcon, Facebook, Linkedin, Image as PinterestIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/database";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

interface ShareButtonProps {
  product: Product;
}

interface SocialLink {
    name: string;
    url: string;
    icon: React.ElementType;
}

export default function ShareButton({ product }: ShareButtonProps) {
  const { toast } = useToast();
  const [productUrl, setProductUrl] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, ensuring window is available.
    setProductUrl(`${window.location.origin}/products/${product.slug}`);
  }, [product.slug]);

  const copyToClipboard = () => {
    if (!productUrl) return;
    
    navigator.clipboard.writeText(productUrl).then(() => {
        toast({
            title: "Link Copied!",
            description: "The product link has been copied to your clipboard.",
        });
        setIsSheetOpen(false); // Close sheet on success
    }, (err) => {
        console.error("Failed to copy text: ", err);
        toast({
            variant: "destructive",
            title: "Copy Failed",
            description: "Could not copy the link. Please try again.",
        });
    });
  }

  const encodedUrl = encodeURIComponent(productUrl);
  const encodedTitle = encodeURIComponent(product.name);
  const encodedDescription = encodeURIComponent(product.description);
  const encodedImage = encodeURIComponent(product.images[0]);

  const socialLinks: SocialLink[] = [
    { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, icon: Facebook },
    { name: 'Twitter', url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, icon: TwitterIcon },
    { name: 'Pinterest', url: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedDescription}`, icon: PinterestIcon },
    { name: 'LinkedIn', url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`, icon: Linkedin },
  ];

  const handleSocialShare = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsSheetOpen(false);
  }

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Share this product"
              disabled={!productUrl}
            >
              <Share2 className="h-5 w-5" />
              <span className="sr-only">Share</span>
            </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
                <SheetTitle>Share Sculpture</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-3">
                {socialLinks.map((link) => (
                    <Button
                        key={link.name}
                        variant="outline"
                        className="w-full justify-start gap-3"
                        onClick={() => handleSocialShare(link.url)}
                    >
                        <link.icon className="h-5 w-5" />
                        Share on {link.name}
                    </Button>
                ))}
                <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={copyToClipboard}
                >
                    <Copy className="h-5 w-5" />
                    Copy Link
                </Button>
            </div>
        </SheetContent>
    </Sheet>
  );
}
