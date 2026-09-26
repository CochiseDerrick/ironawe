
import {db} from './firebase';
import {ref, get, set, child, remove, push, update} from 'firebase/database';
import type {CartItem} from '@/hooks/use-cart';

export type Product = {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    discountPrice?: number;
    promoEligible?: boolean;
    shippingCost?: number;
    images: string[];
    stock: number;
    category: string;
};

export type Customer = {
    id: string;
    fullName: string;
    email: string;
    address: string;
    city: string;
    postcode: string;
    orderIds: string[];
    totalSpent: number;
    firstPurchase: string;
    lastPurchase: string;
};

export type Order = {
    id: string;
    customerId: string;
    customerName: string;
    items: CartItem[];
    total: number;
    shipping: number;
    status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
    createdAt: string;
    stripeSessionId?: string; // Stripe checkout session ID for payment tracking
    paymentStatus?: 'pending' | 'paid' | 'failed' | 'cancelled';
    customer: {
        email: string;
        address: string;
        city: string;
        postcode: string;
    };
};

export type Review = {
    id: string;
    author: string;
    location: string;
    text: string;
};

export type AppSettings = {
    defaultTheme?: string;
    categoryOrder?: string[];
}

export async function getSettings(): Promise<AppSettings | null> {
    if (!db) {
        console.warn("Database not initialized. Cannot fetch settings.");
        return null;
    }
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, 'settings'));
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching settings:", error);
        throw error;
    }
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<void> {
    if (!db) {
        throw new Error("Database not initialized. Cannot update settings.");
    }
    try {
        const settingsRef = ref(db, 'settings');
        await update(settingsRef, settings);
        console.log("Settings updated successfully.");
    } catch (error) {
        console.error("Error updating settings:", error);
        throw error;
    }
}


export async function getProducts(): Promise<Product[]> {
    if (!db) {
        console.warn("Database not initialized. Returning empty product list.");
        return [];
    }
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, 'products'));
        if (snapshot.exists()) {
            const productsObject = snapshot.val();
            // Convert the object of products into an array
            return Object.keys(productsObject).map(key => ({
                ...productsObject[key],
                id: key,
                category: productsObject[key].category || 'uncategorized', // Handle legacy products without category
                stock: typeof productsObject[key].stock === 'number' ? productsObject[key].stock : 0 // Handle legacy products without stock
            }));
        } else {
            console.log("No products data available, returning empty array.");
            return []; // Return empty array if no products exist
        }
    } catch (error) {
        console.error("Error fetching products:", error);
        throw error;
    }
}

export async function getProductById(id: string): Promise<Product | null> {
    if (!db) {
        console.warn("Database not initialized. Cannot fetch product by ID.");
        return null;
    }
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, `products/${id}`));
        if (snapshot.exists()) {
            const productData = snapshot.val();
            return {
                ...productData,
                id: id,
                category: productData.category || 'uncategorized', // Handle legacy products without category
                stock: typeof productData.stock === 'number' ? productData.stock : 0 // Handle legacy products without stock
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error(`Error fetching product by ID ${id}:`, error);
        throw error;
    }
}


export async function getProductBySlug(slug: string): Promise<Product | null> {
    if (!db) {
        console.warn("Database not initialized. Cannot fetch product by slug.");
        return null;
    }
    try {
        const products = await getProducts();
        const product = products.find(p => p.slug === slug);
        return product || null;
    } catch (error) {
        console.error(`Error fetching product by slug ${slug}:`, error);
        throw error;
    }
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
    if (!db) {
        console.warn("Database not initialized. Cannot fetch products by IDs.");
        return [];
    }
    try {
        const allProducts = await getProducts();
        return allProducts.filter(product => ids.includes(product.id));
    } catch (error) {
        console.error("Error fetching products by IDs:", error);
        throw error;
    }
}

export type StockIssue = {
    productId: string;
    name: string;
    requested: number;
    available: number;
};

/**
 * Authoritative, live stock check. Given a list of { id, quantity } requests (e.g. a
 * customer's cart), fetches the *current* stock for those products directly from the
 * database and returns any items where the requested quantity exceeds what's actually
 * available (including items that no longer exist or are sold out, i.e. available <= 0).
 *
 * An empty array means every requested item is fully available. This should always be
 * re-checked server-side (e.g. in the createOrder action) immediately before creating an
 * order, since client-side cart state can be stale or tampered with.
 */
export async function checkStockAvailability(
    items: {id: string; quantity: number}[]
): Promise<StockIssue[]> {
    if (items.length === 0) return [];

    const products = await getProductsByIds(items.map(item => item.id));
    const issues: StockIssue[] = [];

    for (const item of items) {
        const product = products.find(p => p.id === item.id);
        if (!product) {
            issues.push({productId: item.id, name: 'This item', requested: item.quantity, available: 0});
            continue;
        }
        if (item.quantity > product.stock) {
            issues.push({
                productId: item.id,
                name: product.name,
                requested: item.quantity,
                available: Math.max(0, product.stock),
            });
        }
    }

    return issues;
}

export async function deleteProduct(productId: string): Promise<void> {
    if (!db) {
        throw new Error("Database not initialized. Cannot delete product.");
    }
    try {
        const productRef = ref(db, `products/${productId}`);
        await remove(productRef);
        console.log(`Product ${productId} deleted successfully.`);
    } catch (error) {
        console.error(`Error deleting product ${productId}:`, error);
        throw error;
    }
}

function createSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with a single one
}

export async function addProduct(productData: Omit<Product, 'id' | 'slug'>): Promise<void> {
    if (!db) {
        throw new Error("Database not initialized. Cannot add product.");
    }
    try {
        const productsRef = ref(db, 'products');
        const newProductRef = push(productsRef);

        const slug = createSlug(productData.name);

        const newProduct: Omit<Product, 'id'> = {
            ...productData,
            slug: slug,
            category: productData.category || 'uncategorized'
        };

        await set(newProductRef, newProduct);
        console.log("Product added successfully with ID:", newProductRef.key);
    } catch (error) {
        console.error("Error adding product:", error);
        throw error;
    }
}

export async function updateProduct(productId: string, productData: Omit<Product, 'id' | 'slug'>): Promise<void> {
    if (!db) {
        throw new Error("Database not initialized. Cannot update product.");
    }
    try {
        const productRef = ref(db, `products/${productId}`);

        const slug = createSlug(productData.name);

        const updatedProduct: Omit<Product, 'id'> = {
            ...productData,
            slug: slug,
            category: productData.category || 'uncategorized'
        };

        await update(productRef, updatedProduct);
        console.log(`Product ${productId} updated successfully.`);
    } catch (error) {
        console.error(`Error updating product ${productId}:`, error);
        throw error;
    }
}

// NOTE: customer/order creation (addOrUpdateCustomer/addOrder), stock decrementing
// (decrementProductStock), and order payment/status mutation (updateOrderPaymentStatus,
// fulfillOrderPayment, updateOrderStatus, getOrderByStripeSessionId) all now live in
// `src/lib/database-admin.ts`. Those code paths only ever run from Server Actions/route
// handlers on behalf of anonymous shoppers or the Stripe webhook - there's no browser-auth
// admin session to rely on there, so they must use the Firebase Admin SDK rather than this
// client SDK, which is subject to the same Realtime Database security rules as the browser.

export async function getCustomers(): Promise<Customer[]> {
    if (!db) {
        console.warn("Database not initialized. Returning empty customer list.");
        return [];
    }
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, 'customers'));
        if (snapshot.exists()) {
            const customersObject = snapshot.val();
            return Object.keys(customersObject).map(key => ({
                ...customersObject[key],
                id: key
            }));
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error fetching customers:", error);
        throw error;
    }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
    if (!db) {
        console.warn("Database not initialized. Cannot fetch customer by ID.");
        return null;
    }
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, `customers/${id}`));
        if (snapshot.exists()) {
            return {
                ...snapshot.val(),
                id: id,
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error(`Error fetching customer by ID ${id}:`, error);
        throw error;
    }
}


export async function getOrders(): Promise<Order[]> {
    if (!db) {
        console.warn("Database not initialized. Returning empty order list.");
        return [];
    }
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, 'orders'));
        if (snapshot.exists()) {
            const ordersObject = snapshot.val();
            return Object.keys(ordersObject).map(key => ({
                ...ordersObject[key],
                id: key
            }));
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;
    }
}

export async function getOrderById(id: string): Promise<Order | null> {
    if (!db) {
        console.warn("Database not initialized. Cannot fetch order by ID.");
        return null;
    }
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, `orders/${id}`));
        if (snapshot.exists()) {
            return {
                ...snapshot.val(),
                id: id,
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error(`Error fetching order by ID ${id}:`, error);
        throw error;
    }
}

// *** Reviews CRUD Functions ***

export async function getReviews(): Promise<Review[]> {
    if (!db) {
        console.warn("Database not initialized. Returning empty review list.");
        return [];
    }
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, 'reviews'));
        if (snapshot.exists()) {
            const reviewsObject = snapshot.val();
            return Object.keys(reviewsObject).map(key => ({
                ...reviewsObject[key],
                id: key,
            }));
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error fetching reviews:", error);
        throw error;
    }
}

export async function getReviewById(id: string): Promise<Review | null> {
    if (!db) {
        console.warn("Database not initialized. Cannot fetch review by ID.");
        return null;
    }
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, `reviews/${id}`));
        if (snapshot.exists()) {
            return {
                ...snapshot.val(),
                id: id,
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error(`Error fetching review by ID ${id}:`, error);
        throw error;
    }
}

export async function addReview(reviewData: Omit<Review, 'id'>): Promise<string> {
    if (!db) throw new Error("Database not initialized");
    const reviewsRef = ref(db, 'reviews');
    const newReviewRef = push(reviewsRef);
    await set(newReviewRef, reviewData);
    if (!newReviewRef.key) {
        throw new Error("Failed to get key for new review");
    }
    return newReviewRef.key;
}

export async function updateReview(reviewId: string, reviewData: Omit<Review, 'id'>): Promise<void> {
    if (!db) throw new Error("Database not initialized");
    const reviewRef = ref(db, `reviews/${reviewId}`);
    await update(reviewRef, reviewData);
}

export async function deleteReview(reviewId: string): Promise<void> {
    if (!db) throw new Error("Database not initialized");
    const reviewRef = ref(db, `reviews/${reviewId}`);
    await remove(reviewRef);
}
