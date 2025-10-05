import { db } from './firebase';
import { ref, get, set, child, remove, push, update, query, orderByChild, equalTo } from 'firebase/database';
import type { CheckoutFormValues } from '@/app/checkout/page';
import type { CartItem } from '@/hooks/use-cart';

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
  customer: {
    email: string;
    address: string;
    city: string;
    postcode: string;
  };
};

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
): Promise<{ customerId: string, isNewCustomer: boolean }> {
    if (!db) throw new Error("Database not initialized");

    const customersRef = ref(db, 'customers');
    const q = query(customersRef, orderByChild('email'), equalTo(customerData.email));
    
    const snapshot = await get(q);

    if (snapshot.exists()) {
        const customerId = Object.keys(snapshot.val())[0];
        return { customerId, isNewCustomer: false };
    } else {
        const now = new Date().toISOString();
        const newCustomerRef = push(customersRef);
        const newCustomer: Omit<Customer, 'id'> = {
            ...customerData,
            orderIds: [],
            totalSpent: 0,
            firstPurchase: now,
            lastPurchase: now,
        };
        await set(newCustomerRef, newCustomer);
        return { customerId: newCustomerRef.key!, isNewCustomer: true };
    }
}

interface OrderCreationData {
    customerId: string;
    customerName: string;
    items: CartItem[];
    total: number;
    shipping: number;
}

export async function addOrder(
  orderData: OrderCreationData,
  customerDetails: CheckoutFormValues
): Promise<string> {
    if (!db) throw new Error("Database not initialized");

    const ordersRef = ref(db, 'orders');
    const newOrderRef = push(ordersRef);
    const now = new Date().toISOString();
    
    const { fullName, ...customerInfoForOrder } = customerDetails;

    const newOrder: Omit<Order, 'id'> = {
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        items: orderData.items,
        total: orderData.total,
        shipping: orderData.shipping,
        status: 'Pending',
        createdAt: now,
        customer: customerInfoForOrder,
    };
    
    await set(newOrderRef, newOrder);
    const orderId = newOrderRef.key!;

    const customerRef = ref(db, `customers/${orderData.customerId}`);
    const customerSnapshot = await get(customerRef);

    if (customerSnapshot.exists()) {
        const customer = customerSnapshot.val();
        
        const updates: { [key: string]: any } = {};
        const newOrderIds = [...(customer.orderIds || []), orderId];
        updates['orderIds'] = newOrderIds;
        updates['totalSpent'] = (customer.totalSpent || 0) + orderData.total;
        updates['lastPurchase'] = now;

        await update(customerRef, updates);
    } else {
        const errorMsg = `Customer with ID ${orderData.customerId} not found when trying to update order details.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
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


export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    if (!db) {
        throw new Error("Database not initialized. Cannot update order status.");
    }
    try {
        const orderRef = ref(db, `orders/${orderId}`);
        await update(orderRef, { status: status });
        console.log(`Order ${orderId} status updated to ${status}.`);
    } catch (error) {
        console.error(`Error updating status for order ${orderId}:`, error);
        throw error;
    }
}