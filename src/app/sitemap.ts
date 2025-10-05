
import { MetadataRoute } from 'next'
import { getProducts } from '@/lib/database';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ironawe-c2358.web.app';

  let productUrls: MetadataRoute.Sitemap = [];

  try {
    // Get all products
    const products = await getProducts();
    productUrls = products.map(product => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: new Date(),
    }));
  } catch (error) {
    console.error("Failed to fetch products for sitemap:", error);
    // Continue with static pages even if product fetching fails
  }


  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
    },
    ...productUrls,
  ]
}
