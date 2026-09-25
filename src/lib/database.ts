
import {db} from './firebase';
import {ref, get, set, child, remove, push, update, query, orderByChild, equalTo, runTransaction} from 'firebase/database';
import type {CheckoutFormValues} from '@/app/checkout/page';
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

/**
 * Atomically decrements a product's stock by `quantity`, floored at 0, using a Firebase
 * transaction so concurrent purchases can't push stock negative or race each other.
 *
 * NOTE: this is called from the Stripe webhook (unauthenticated request context). If your
 * Firebase Realtime Database rules require auth for writes under /products, this call will
 * fail with a permission error - check your rules allow this path to be decremented by the
 * webhook, or move this logic behind an authenticated server context (e.g. Firebase Admin SDK)
 * if you need it to be fully tamper-proof.
 */
export async function decrementProductStock(productId: string, quantity: number): Promise<void> {
    if (!db) {
        throw new Error("Database not initialized. Cannot update stock.");
    }
    if (quantity <= 0) return;

    const stockRef = ref(db, `products/${productId}/stock`);
    try {
        const result = await runTransaction(stockRef, (currentStock) => {
            const current = typeof currentStock === 'number' ? currentStock : 0;
            return Math.max(0, current - quantity);
        });
        console.log(`Stock for product ${productId} decremented by ${quantity}. New stock: ${result.snapshot.val()}.`);
    } catch (error) {
        console.error(`Error decrementing stock for product ${productId}:`, error);
        throw error;
    }
}


export async function addOrUpdateCustomer(
    customerData: CheckoutFormValues
): Promise<{customerId: string, isNewCustomer: boolean}> {
    if (!db) throw new Error("Database not initialized");

    // Fetch all customers and find by email in the application code
    const customers = await getCustomers();
    const existingCustomer = customers.find(c => c.email === customerData.email);

    if (existingCustomer) {
        // Found an existing customer, return their ID
        return {customerId: existingCustomer.id, isNewCustomer: false};
    } else {
        // No existing customer, create a new one
        const customersRef = ref(db, 'customers');
        const newCustomerRef = push(customersRef);
        if (!newCustomerRef.key) {
            throw new Error("Failed to generate a new customer key.");
        }

        // Return a key for a customer that doesn't exist yet. `addOrder` will create them.
        return {customerId: newCustomerRef.key, isNewCustomer: true};
    }
}

interface OrderCreationData {
    customerId: string;
    customerName: string;
    items: CartItem[];
    total: number;
    shipping: number;
    stripeSessionId?: string;
    paymentStatus?: 'pending' | 'paid' | 'failed' | 'cancelled';
}

export async function addOrder(
    orderData: OrderCreationData,
    customerDetails: CheckoutFormValues
): Promise<string> {
    if (!db) throw new Error("Database not initialized");

    const ordersRef = ref(db, 'orders');
    const newOrderRef = push(ordersRef);
    const orderId = newOrderRef.key!;
    const now = new Date().toISOString();

    const {fullName, ...customerInfoForOrder} = customerDetails;

    const baseOrder = {
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        items: orderData.items,
        total: orderData.total,
        shipping: orderData.shipping,
        status: 'Pending' as const,
        createdAt: now,
        paymentStatus: orderData.paymentStatus || 'pending' as const,
        customer: customerInfoForOrder,
    };

    // Only include stripeSessionId if it's defined
    const newOrder = orderData.stripeSessionId
        ? {...baseOrder, stripeSessionId: orderData.stripeSessionId}
        : baseOrder;

    await set(newOrderRef, newOrder);

    const customerRef = ref(db, `customers/${orderData.customerId}`);
    const customerSnapshot = await get(customerRef);

    if (customerSnapshot.exists()) {
        // This is a returning customer, update their record
        const customer = customerSnapshot.val();

        const updates: {[key: string]: any} = {};
        updates['orderIds'] = [...(customer.orderIds || []), orderId];
        updates['totalSpent'] = (customer.totalSpent || 0) + orderData.total;
        updates['lastPurchase'] = now;

        await update(customerRef, updates);
    } else {
        // This is a new customer, create their full record
        const newCustomerRecord: Omit<Customer, 'id'> = {
            ...customerDetails,
            orderIds: [orderId],
            totalSpent: orderData.total,
            firstPurchase: now,
            lastPurchase: now,
        };
        await set(customerRef, newCustomerRecord);
    }

    return orderId;
}


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

export async function getOrderByStripeSessionId(stripeSessionId: string): Promise<Order | null> {
    if (!db) {
        console.warn("Database not initialized. Cannot fetch order by Stripe session ID.");
        return null;
    }

    try {
        const ordersRef = ref(db, 'orders');
        const ordersQuery = query(ordersRef, orderByChild('stripeSessionId'), equalTo(stripeSessionId));
        const snapshot = await get(ordersQuery);

        if (snapshot.exists()) {
            const orders = snapshot.val();
            const orderId = Object.keys(orders)[0]; // Get the first (and should be only) matching order
            return {
                ...orders[orderId],
                id: orderId,
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error(`Error fetching order by Stripe session ID ${stripeSessionId}:`, error);
        throw error;
    }
}

export async function updateOrderPaymentStatus(orderId: string, paymentStatus: Order['paymentStatus']): Promise<void> {
    if (!db) {
        throw new Error("Database not initialized. Cannot update order payment status.");
    }
    try {
        const orderRef = ref(db, `orders/${orderId}`);
        await update(orderRef, {paymentStatus: paymentStatus});
        console.log(`Order ${orderId} payment status updated to ${paymentStatus}.`);
    } catch (error) {
        console.error(`Error updating payment status for order ${orderId}:`, error);
        throw error;
    }
}

/**
 * Marks an order as paid and decrements stock for each purchased item, in one place.
 * Idempotent: if the order is already marked 'paid' (e.g. Stripe sent both
 * `checkout.session.completed` and `payment_intent.succeeded` for the same purchase),
 * this is a no-op so stock is never decremented twice for the same order.
 */
export async function fulfillOrderPayment(orderId: string): Promise<void> {
    const order = await getOrderById(orderId);
    if (!order) {
        console.error(`Cannot fulfill payment: order ${orderId} not found.`);
        return;
    }

    if (order.paymentStatus === 'paid') {
        console.log(`Order ${orderId} is already marked as paid; skipping duplicate stock decrement.`);
        return;
    }

    await updateOrderPaymentStatus(orderId, 'paid');

    const results = await Promise.allSettled(
        order.items.map(item => decrementProductStock(item.id, item.quantity))
    );

    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            const item = order.items[index];
            console.error(
                `Order ${orderId} marked as paid, but failed to decrement stock for product ${item.id} (${item.name}). ` +
                `Stock for this item may need to be corrected manually.`,
                result.reason
            );
        }
    });
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    if (!db) {
        throw new Error("Database not initialized. Cannot update order status.");
    }
    try {
        const orderRef = ref(db, `orders/${orderId}`);
        await update(orderRef, {status: status});
        console.log(`Order ${orderId} status updated to ${status}.`);
    } catch (error) {
        console.error(`Error updating status for order ${orderId}:`, error);
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
