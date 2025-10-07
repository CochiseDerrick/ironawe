
"use client";

import {useState, useEffect} from "react";
import {useRouter, useParams} from "next/navigation";
import Link from "next/link";
import {ChevronLeft, Loader2, Upload, Trash2, ArrowLeft, ArrowRight} from "lucide-react";
import Image from "next/image";

import {Button} from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Switch} from "@/components/ui/switch";
import {useToast} from "@/hooks/use-toast";
import {getProductById, updateProduct, type Product} from "@/lib/database";
import {Badge} from "@/components/ui/badge";
import {useImageUpload, type UploadedImage} from "@/hooks/use-image-upload";
import {uploadImage} from "@/actions/upload-image";
import {Skeleton} from "@/components/ui/skeleton";

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;

    const {toast} = useToast();
    const [loading, setLoading] = useState(false);
    const [loadingProduct, setLoadingProduct] = useState(true);
    const {
        images,
        setImages,
        handleFileChange,
        handleRemoveImage,
        handleReorderImage,
    } = useImageUpload();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [discountPrice, setDiscountPrice] = useState("");
    const [shippingCost, setShippingCost] = useState("");
    const [stock, setStock] = useState("");
    const [promoEligible, setPromoEligible] = useState(false);
    const [category, setCategory] = useState("");

    useEffect(() => {
        if (!productId) return;

        const fetchProduct = async () => {
            try {
                setLoadingProduct(true);
                const product = await getProductById(productId);
                if (product) {
                    setName(product.name);
                    setDescription(product.description);
                    setPrice(product.price.toString());
                    setDiscountPrice(product.discountPrice?.toString() || "");
                    setShippingCost(product.shippingCost?.toString() || "");
                    setStock(product.stock.toString());
                    setPromoEligible(product.promoEligible || false);
                    setCategory(product.category || "");
                    const existingImages: UploadedImage[] = product.images.map(url => ({
                        file: new File([], ""), // Dummy file
                        preview: url,
                        isUploaded: true,
                    }));
                    setImages(existingImages);

                } else {
                    toast({
                        variant: "destructive",
                        title: "Product not found",
                        description: "The product you are trying to edit does not exist.",
                    });
                    router.push('/admin/dashboard/products');
                }
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Error fetching product",
                    description: "Could not load product details. Please try again.",
                });
            } finally {
                setLoadingProduct(false);
            }
        };

        fetchProduct();
    }, [productId, router, toast, setImages]);


    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!name || !description || !price || !stock || !category) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please fill out all required fields including category.",
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
            const uploadPromises = images.map(image => {
                if (image.isUploaded) {
                    return Promise.resolve({success: true, url: image.preview});
                }
                const formData = new FormData();
                formData.append('file', image.file);
                return uploadImage(formData);
            });

            const uploadResults = await Promise.all(uploadPromises);

            const imageUrls: string[] = [];
            for (const result of uploadResults) {
                if (result.success && result.url) {
                    imageUrls.push(result.url);
                } else {
                    const errorMessage = 'error' in result ? result.error : "An unknown error occurred during image upload.";
                    throw new Error(errorMessage || "An unknown error occurred during image upload.");
                }
            }

            const productData: Omit<Product, 'id' | 'slug'> & {discountPrice?: number, shippingCost?: number} = {
                name,
                description,
                price: parseFloat(price),
                stock: parseInt(stock, 10),
                images: imageUrls,
                promoEligible,
                category,
            };

            const parsedDiscountPrice = parseFloat(discountPrice);
            if (!isNaN(parsedDiscountPrice) && parsedDiscountPrice > 0) {
                productData.discountPrice = parsedDiscountPrice;
            }

            const parsedShippingCost = parseFloat(shippingCost);
            if (!isNaN(parsedShippingCost) && parsedShippingCost >= 0) {
                productData.shippingCost = parsedShippingCost;
            }

            await updateProduct(productId, productData);

            toast({
                title: "Product Updated",
                description: `"${name}" has been successfully updated.`,
            });
            router.push("/admin/dashboard/products");

        } catch (error) {
            console.error("Error updating product:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: `Could not update the product: ${errorMessage}`,
            });
        } finally {
            setLoading(false);
        }
    };

    if (loadingProduct) {
        return <EditProductPageSkeleton />;
    }

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
                        Edit Product
                    </h1>
                    <div className="hidden items-center gap-2 md:ml-auto md:flex">
                        <Button variant="outline" size="sm" type="button" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button size="sm" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                            Save Changes
                        </Button>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3 md:gap-8 mt-4">
                    <div className="grid auto-rows-max items-start gap-4 lg:gap-8 md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Product Details</CardTitle>
                                <CardDescription>
                                    Update the information for your sculpture.
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
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Input
                                        id="category"
                                        placeholder="e.g., Abstract, Animals, Garden Sculptures..."
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        required
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
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
                                        placeholder="1"
                                        value={stock}
                                        onChange={(e) => setStock(e.target.value)}
                                        required
                                        aria-label="Stock quantity"
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
                    <div className="md:col-span-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Product Images</CardTitle>
                                <CardDescription>
                                    Add and manage images for your sculpture. The first image is the main one.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                    {images.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                            {images.map((image, index) => (
                                                <div key={image.preview} className="relative group aspect-square">
                                                    <Image
                                                        src={image.preview}
                                                        alt={`Product image ${index + 1}`}
                                                        fill
                                                        className="rounded-md object-cover"
                                                        unoptimized
                                                    />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-md p-2">
                                                        <div className="flex-grow flex items-center justify-center">
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
                                                                disabled={index === images.length - 1}
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
                                            ))}
                                        </div>
                                    )}
                                    <div className="relative">
                                        <label htmlFor="image-upload" className="sr-only">Add Images</label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => document.getElementById('image-upload')?.click()}
                                            disabled={loading}
                                        >
                                            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                                            Add Image(s)
                                        </Button>
                                        <input
                                            id="image-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                            disabled={loading}
                                            multiple
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-2 md:hidden mt-4">
                    <Button variant="outline" size="sm" type="button" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button size="sm" type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
}


const EditProductPageSkeleton = () => (
    <div className="mx-auto grid max-w-full flex-1 auto-rows-max gap-4">
        <div className="flex items-center gap-4">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-6 w-48" />
            <div className="hidden items-center gap-2 md:ml-auto md:flex">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-24" />
            </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3 md:gap-8 mt-4">
            <div className="grid auto-rows-max items-start gap-4 lg:gap-8 md:col-span-2">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-1/3" />
                        <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-20 w-full" />
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-3">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-1/4" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-24 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
);

