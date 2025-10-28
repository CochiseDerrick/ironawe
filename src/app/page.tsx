
"use client";

import {useEffect, useState} from 'react';
import ProductCard from '@/components/product-card';
import {getProducts, getReviews, getSettings, type Product, type Review} from '@/lib/database';
import {Skeleton} from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { MessageSquare } from 'lucide-react';
import Autoplay from "embla-carousel-autoplay";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedProducts, fetchedReviews, fetchedSettings] = await Promise.all([
          getProducts(),
          getReviews(),
          getSettings()
        ]);
        setProducts(fetchedProducts);
        setReviews(fetchedReviews);
        if(fetchedSettings?.categoryOrder) {
          setCategoryOrder(fetchedSettings.categoryOrder);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  // Sort categories based on the order from settings
  const sortedCategories = Object.keys(groupedProducts).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB; // Both are in the ordered list
    }
    if (indexA !== -1) {
      return -1; // A is in the list, B is not
    }
    if (indexB !== -1) {
      return 1; // B is in the list, A is not
    }
    // Neither are in the list, sort alphabetically
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-16">
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
          {sortedCategories.length > 0 ? sortedCategories.map((category) => (
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
          )) : (
            <section aria-label="No products available" className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                No products available at the moment. Check back soon for new sculptures!
              </p>
            </section>
          )}
        </div>
      )}

      {!loading && reviews.length > 0 && (
        <section aria-labelledby="reviews-heading" className="text-center">
          <h2 id="reviews-heading" className="text-3xl font-headline font-bold text-primary sm:text-4xl">
            What Our Clients Say
          </h2>
           <p className="mt-4 max-w-2xl mx-auto text-lg text-foreground/80">
            Hear from those who have commissioned a piece of IronAwe.
          </p>
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 5000,
              }),
            ]}
            className="w-full max-w-4xl mx-auto mt-8"
          >
            <CarouselContent>
              {reviews.map((review) => (
                <CarouselItem key={review.id} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-1 h-full">
                    <Card className="h-full flex flex-col">
                      <CardContent className="p-6 flex-grow flex flex-col justify-center items-center">
                         <MessageSquare className="h-8 w-8 text-primary/50 mb-4" />
                        <p className="text-muted-foreground text-center italic">
                          "{review.text}"
                        </p>
                      </CardContent>
                       <div className="p-6 pt-0 text-center">
                          <p className="font-semibold font-headline">{review.author}</p>
                          <p className="text-sm text-muted-foreground">{review.location}</p>
                        </div>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </section>
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
