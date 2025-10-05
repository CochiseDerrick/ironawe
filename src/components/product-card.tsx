
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/database";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import FavoriteButton from "./favorite-button";
import { Badge } from "./ui/badge";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <Link href={`/products/${product.slug}`} aria-label={`View details for ${product.name}`}>
        <div className="overflow-hidden">
          <Image
            src={product.images[0]}
            alt={product.description}
            width={600}
            height={400}
            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        </div>
        <CardContent className="p-4">
          <h3 className="text-lg font-headline font-bold truncate">{product.name}</h3>
          <p className="text-sm text-muted-foreground mt-1 h-10 overflow-hidden">{product.description}</p>
        </CardContent>
      </Link>
      <CardFooter className="flex justify-between items-center p-4 pt-0">
        <p className="font-bold text-lg">
          {product.discountPrice ? (
            <span className="flex items-center gap-2">
               <span className="text-primary" aria-label={`Current price: £${product.discountPrice.toFixed(2)}`}>£{product.discountPrice.toFixed(2)}</span>
               <span className="text-sm text-muted-foreground line-through" aria-label={`Original price: £${product.price.toFixed(2)}`}>£{product.price.toFixed(2)}</span>
            </span>
          ) : (
            <span className="text-foreground" aria-label={`Price: £${product.price.toFixed(2)}`}>£{product.price.toFixed(2)}</span>
          )}
        </p>
        <FavoriteButton productId={product.id} />
      </CardFooter>
    </Card>
  );
}
