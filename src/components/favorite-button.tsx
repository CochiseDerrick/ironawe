
"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  productId: string;
}

export default function FavoriteButton({ productId }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(productId);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => toggleFavorite(productId)}
      aria-pressed={favorite}
      className="rounded-full hover:bg-destructive/10"
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart className={cn("h-6 w-6 transition-all", 
        favorite ? "fill-destructive stroke-destructive" : "stroke-foreground"
      )} />
      <span className="sr-only">Favorite</span>
    </Button>
  );
}
