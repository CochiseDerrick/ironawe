"use client";

import {useEffect, useState} from 'react';
import ProductCard from '@/components/product-card';
import {getProducts, type Product} from '@/lib/database';
import {Skeleton} from '@/components/ui/skeleton';

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

  // Group products by category
  const groupedProducts = products.reduce((acc, product) => {
    const category = product.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Sort categories alphabetically, but put "Uncategorized" last
  const sortedCategories = Object.keys(groupedProducts).sort((a, b) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });

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

      {loading ? (
        <section aria-label="Loading products">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({length: 6}).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        </section>
      ) : (
        <div className="space-y-12">
          {sortedCategories.map((category) => (
            <section key={category} aria-labelledby={`${category}-heading`}>
              <h2
                id={`${category}-heading`}
                className="text-2xl font-headline font-bold text-primary mb-6 border-b border-primary/20 pb-2"
              >
                {category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {groupedProducts[category].map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ))}

          {sortedCategories.length === 0 && (
            <section aria-label="No products available" className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                No products available at the moment. Check back soon for new sculptures!
              </p>
            </section>
          )}
        </div>
      )}
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
