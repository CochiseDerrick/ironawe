
import {db} from './firebase';
import {ref, get, set, child, remove, push, update, query, orderByChild, equalTo} from 'firebase/database';
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

export type AppSettings = {
    defaultTheme: string;
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
                id: key
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
            return {
                ...snapshot.val(),
                id: id,
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
            slug: slug
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
            slug: slug
        };

        await update(productRef, updatedProduct);
        console.log(`Product ${productId} updated successfully.`);
    } catch (error) {
        console.error(`Error updating product ${productId}:`, error);
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
