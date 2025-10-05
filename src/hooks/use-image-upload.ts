
"use client";

import { useState, useCallback, ChangeEvent } from 'react';
import { useToast } from './use-toast';

export interface UploadedImage {
    file: File;
    preview: string;
    isUploaded?: boolean; // To distinguish between new and existing images
}

export function useImageUpload() {
    const [images, setImages] = useState<UploadedImage[]>([]);
    const { toast } = useToast();

    const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            const imageFiles = files.filter(file => file.type.startsWith('image/'));

            if (imageFiles.length !== files.length) {
                toast({
                    variant: 'destructive',
                    title: 'Invalid File Type',
                    description: 'One or more selected files were not valid images.',
                });
            }

            const newImages: UploadedImage[] = imageFiles.map(file => ({
                file,
                preview: URL.createObjectURL(file),
            }));

            setImages(prevImages => [...prevImages, ...newImages]);
        }
        event.target.value = ''; // Reset file input
    }, [toast]);


    const handleRemoveImage = useCallback((index: number) => {
        setImages(prevImages => {
            const imageToRemove = prevImages[index];
            if (imageToRemove) {
                URL.revokeObjectURL(imageToRemove.preview);
            }
            return prevImages.filter((_, i) => i !== index);
        });
    }, []);

    const handleReorderImage = useCallback((index: number, direction: 'left' | 'right') => {
        setImages(prevImages => {
            const newImages = [...prevImages];
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

    return { 
        images, 
        setImages,
        handleFileChange, 
        handleRemoveImage, 
        handleReorderImage,
    };
}

    