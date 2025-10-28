
"use server";

import { updateSettings, AppSettings } from "@/lib/database";
import { revalidatePath } from "next/cache";

export async function updateTheme(theme: string): Promise<{ success: boolean; error?: string }> {
    try {
        await updateSettings({ defaultTheme: theme });
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error("Failed to update theme:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

export async function updateCategoryOrder(categories: string[]): Promise<{ success: boolean; error?: string }> {
    try {
        await updateSettings({ categoryOrder: categories });
        revalidatePath('/'); // Revalidate the homepage to show new order
        return { success: true };
    } catch (error) {
        console.error("Failed to update category order:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

