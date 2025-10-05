
"use client"

import Image from "next/image";
import { Button } from "@/components/ui/button";
import FavoriteButton from "@/components/favorite-button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, CheckCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/database";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

interface ProductDetailsProps {
    product: Product;
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  const [selectedImage, setSelectedImage] = useState<string>(product.images[0]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart.`,
        action: <CheckCircle className="text-primary" />,
      });
    }
  };

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="grid md:grid-cols-2 gap-8 md:gap-12">
      <section aria-labelledby="product-images">
        <h2 id="product-images" className="sr-only">Product Images</h2>
        <div className="space-y-4">
          <div className="aspect-square w-full overflow-hidden rounded-lg border">
            <Image
              src={selectedImage}
              alt={product.name}
              width={800}
              height={800}
              className="w-full h-full object-cover"
              priority
              unoptimized
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(image)}
                  className={cn(
                    "aspect-square w-full overflow-hidden rounded-md border-2",
                    selectedImage === image ? "border-primary" : "border-transparent"
                  )}
                  aria-label={`View image ${index + 1} of ${product.images.length}`}
                  aria-current={selectedImage === image}
                >
                  <Image
                    src={image}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="product-details" className="space-y-6">
        <div className="space-y-2">
           <div className="flex items-center gap-4">
              <h1 id="product-details" className="text-3xl md:text-4xl font-bold font-headline text-primary">{product.name}</h1>
              <Badge variant={isOutOfStock ? "destructive" : "outline"} aria-live="polite">
                {isOutOfStock ? "Out of Stock" : "In Stock"}
              </Badge>
           </div>
          <p>{product.description}</p>
        </div>
        
        <p className="text-4xl font-bold">
          {product.discountPrice ? (
            <span className="flex items-baseline gap-3">
               <span className="text-primary" aria-label={`Current price: £${product.discountPrice.toFixed(2)}`}>£{product.discountPrice.toFixed(2)}</span>
               <span className="text-2xl text-muted-foreground line-through" aria-label={`Original price: £${product.price.toFixed(2)}`}>£{product.price.toFixed(2)}</span>
               <Badge variant="destructive" className="text-base">SALE</Badge>
            </span>
          ) : (
            <span className="text-foreground" aria-label={`Price: £${product.price.toFixed(2)}`}>£{product.price.toFixed(2)}</span>
          )}
        </p>

        <div className="flex items-center gap-4">
          <Button 
            size="lg" 
            className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground" 
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            <ShoppingCart className="mr-2 h-5 w-5" aria-hidden="true" /> 
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>
          <FavoriteButton productId={product.id} />
        </div>
      </section>
    </div>
  );
}
