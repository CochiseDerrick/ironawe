
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, Upload, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { addProduct, type Product } from "@/lib/database";
import { Badge } from "@/components/ui/badge";

declare global {
    interface Window {
        cloudinary: any;
    }
}

export default function NewProductPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    
    // State for form fields
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [discountPrice, setDiscountPrice] = useState("");
    const [shippingCost, setShippingCost] = useState("");
    const [stock, setStock] = useState("");
    const [promoEligible, setPromoEligible] = useState(false);

    const [images, setImages] = useState<string[]>([]);
    
    const openUploadWidget = useCallback(() => {
        if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
            toast({
                variant: 'destructive',
                title: 'Cloudinary Not Configured',
                description: 'Please configure Cloudinary cloud name and upload preset in your environment variables.',
            });
            return;
        }

        window.cloudinary.createUploadWidget(
            {
                cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
            },
            (error: any, result: any) => {
                if (!error && result && result.event === 'success') {
                    setImages(prev => [...prev, result.info.secure_url]);
                    toast({
                        title: 'Image Uploaded',
                        description: 'Your image has been successfully added.',
                    })
                }
            }
        ).open();
    }, [toast]);

    const handleRemoveImage = useCallback((index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleReorderImage = useCallback((index: number, direction: 'left' | 'right') => {
        setImages(prev => {
            const newImages = [...prev];
            const [movedImage] = newImages.splice(index, 1);
            const newIndex = direction === 'left' ? index - 1 : index + 1;
            
            if (newIndex >= 0 && newIndex <= newImages.length) {
                newImages.splice(newIndex, 0, movedImage);
            } else {
                newImages.splice(index, 0, movedImage);
            }
            return newImages;
        });
    }, []);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!name || !description || !price || !stock) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please fill out all required fields.",
            });
            return;
        }

        if (images.length === 0) {
            toast({
                variant: "destructive",
                title: "No Images",
                description: "Please add at least one image for the product.",
            });
            return;
        }

        setLoading(true);
        try {
            const productData: Omit<Product, 'id' | 'slug'> & { discountPrice?: number, shippingCost?: number } = {
                name,
                description,
                price: parseFloat(price),
                stock: parseInt(stock, 10),
                images: images,
                promoEligible,
            };

            const parsedDiscountPrice = parseFloat(discountPrice);
            if (!isNaN(parsedDiscountPrice) && parsedDiscountPrice > 0) {
                productData.discountPrice = parsedDiscountPrice;
            }

            const parsedShippingCost = parseFloat(shippingCost);
            if (!isNaN(parsedShippingCost) && parsedShippingCost >= 0) {
                productData.shippingCost = parsedShippingCost;
            }

            await addProduct(productData);
            
            toast({
                title: "Product Created",
                description: `"${name}" has been successfully added.`,
            });
            router.push("/admin/dashboard/products");

        } catch (error) {
            console.error("Error adding product:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                variant: "destructive",
                title: "Creation Failed",
                description: `Could not add the product: ${errorMessage}`,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto grid max-w-full flex-1 auto-rows-max gap-4">
            <form onSubmit={handleSubmit}>
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                        <Link href="/admin/dashboard/products" aria-label="Back to products">
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Back</span>
                        </Link>
                    </Button>
                    <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                        Add New Product
                    </h1>
                </div>
                <div className="grid gap-4 md:grid-cols-3 lg:gap-8 mt-4">
                    <div className="grid auto-rows-max items-start gap-4 lg:gap-8 md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Product Details</CardTitle>
                                <CardDescription>
                                    Fill in the information for your new sculpture.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Product Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., Molten Core Guardian"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe the sculpture..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Promo Codes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="promo-switch" className="text-base">
                                            Enable Promo Codes
                                        </Label>
                                        <p id="promo-description" className="text-sm text-muted-foreground">
                                            Allow promo codes to be used for this product.
                                        </p>
                                    </div>
                                    <Switch
                                        id="promo-switch"
                                        checked={promoEligible}
                                        onCheckedChange={setPromoEligible}
                                        aria-describedby="promo-description"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="grid auto-rows-max items-start gap-4 lg:gap-8 md:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pricing & Inventory</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        min="0"
                                        placeholder="1250.00"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        required
                                        aria-label="Price in pounds"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="discountPrice">Discount Price (Optional)</Label>
                                    <Input
                                        id="discountPrice"
                                        type="number"
                                        min="0"
                                        placeholder="1100.00"
                                        value={discountPrice}
                                        onChange={(e) => setDiscountPrice(e.target.value)}
                                        aria-label="Discount price in pounds"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="shippingCost">Shipping & Handling</Label>
                                    <Input
                                        id="shippingCost"
                                        type="number"
                                        min="0"
                                        placeholder="250.00"
                                        value={shippingCost}
                                        onChange={(e) => setShippingCost(e.target.value)}
                                        aria-label="Shipping cost in pounds"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stock">Stock Quantity</Label>
                                    <Input
                                        id="stock"
                                        type="number"
                                        min="0"
                                        placeholder="1"
                                        value={stock}
                                        onChange={(e) => setStock(e.target.value)}
                                        required
                                        aria-label="Stock quantity"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="md:col-span-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Product Images</CardTitle>
                                <CardDescription>
                                    Use the widget to upload images. The first image in the list will be the main one.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                     {images.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            {images.map((image, index) => (
                                                image && (
                                                    <div key={`${image}-${index}`} className="relative group border rounded-lg overflow-hidden aspect-square">
                                                        <Image
                                                            src={image}
                                                            alt={`Product image ${index + 1}`}
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 space-y-2">
                                                            <div className="flex-grow flex items-center justify-center gap-2">
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    type="button"
                                                                    onClick={() => handleRemoveImage(index)}
                                                                    aria-label={`Remove image ${index + 1}`}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    <span className="sr-only">Remove Image</span>
                                                                </Button>
                                                            </div>
                                                            <div className="flex justify-between w-full">
                                                                <Button
                                                                    variant="secondary"
                                                                    size="icon"
                                                                    className="h-7 w-7"
                                                                    type="button"
                                                                    onClick={() => handleReorderImage(index, 'left')}
                                                                    disabled={index === 0}
                                                                    aria-label={`Move image ${index + 1} left`}
                                                                >
                                                                    <ArrowLeft className="h-4 w-4" />
                                                                    <span className="sr-only">Move Left</span>
                                                                </Button>
                                                                <Button
                                                                    variant="secondary"
                                                                    size="icon"
                                                                    className="h-7 w-7"
                                                                    type="button"
                                                                    onClick={() => handleReorderImage(index, 'right')}
                                                                    disabled={images.length - 1 === index}
                                                                    aria-label={`Move image ${index + 1} right`}
                                                                >
                                                                    <ArrowRight className="h-4 w-4" />
                                                                    <span className="sr-only">Move Right</span>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        {index === 0 && (
                                                            <Badge className="absolute top-2 left-2">Main</Badge>
                                                        )}
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    )}
                                    <div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full mt-4"
                                            onClick={openUploadWidget}
                                            disabled={loading}
                                        >
                                            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                                            Upload
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm" type="button" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button size="sm" type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                        Save Product
                    </Button>
                </div>
            </form>
        </div>
    );
}
