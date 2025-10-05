"use client";

import { useEffect, useState } from 'react';
import ProductCard from '@/components/product-card';
import { getProducts, type Product } from '@/lib/database';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="space-y-8">
      <section aria-labelledby="gallery-heading" className="text-center">
        <h1 id="gallery-heading" className="text-4xl font-headline font-bold text-primary sm:text-5xl md:text-6xl">
          Gallery of Sculptures
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-foreground/80">
          Discover unique, hand-forged metal art. Each piece tells a story of fire, steel, and artistry.
        </p>
      </section>
      
      <section aria-label="Product list">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))
          ) : (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

const CardSkeleton = () => (
  <div className="space-y-4" aria-live="polite" aria-busy="true">
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
