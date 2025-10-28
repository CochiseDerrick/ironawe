
import { getProductBySlug, type Product } from "@/lib/database";
import { notFound } from "next/navigation";
import type { Metadata } from 'next';
import ProductDetails from "./product-details";

type Props = {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.slug
  const product = await getProductBySlug(slug)

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const productUrl = `${siteUrl}/products/${product.slug}`;
  const imageUrl = product.images[0];

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      url: productUrl,
      siteName: 'IronAwe',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      locale: 'en_GB',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: [imageUrl],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const slug = params.slug;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetails product={product} />;
}

