
"use client";

import { useEffect, useState } from "react";
import { useFavorites } from "@/hooks/use-favorites";
import { getProductsByIds, type Product } from "@/lib/database";
import ProductCard from "@/components/product-card";
import { Heart, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (favorites.length > 0) {
      const fetchFavoriteProducts = async () => {
        try {
          const products = await getProductsByIds(favorites);
          setFavoriteProducts(products);
        } catch (error) {
          console.error("Failed to fetch favorite products:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchFavoriteProducts();
    } else {
      setLoading(false);
      setFavoriteProducts([]);
    }
  }, [favorites]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-headline font-bold text-primary sm:text-5xl md:text-6xl">
          Your Favorites
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-foreground/80">
          A collection of the pieces you love.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
           {Array.from({ length: 3 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : favoriteProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {favoriteProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center border-2 border-dashed rounded-lg p-12">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">No Favorites Yet</h3>
          <p className="mt-2 text-muted-foreground">
            Click the heart icon on any sculpture to add it to your favorites.
          </p>
        </div>
      )}
    </div>
  );
}

const CardSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-64 w-full" />
    <div className="space-y-2">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
    </div>
    <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-10 w-10 rounded-full" />
    </div>
  </div>
)
