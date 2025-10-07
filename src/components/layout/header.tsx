
"use client"

import Link from "next/link"
import {Flame, Heart, Menu, ShoppingCart, X} from "lucide-react"
import {useState, useEffect} from "react"
import {cn} from "@/lib/utils"
import {Button} from "@/components/ui/button"
import {useCart} from "@/hooks/use-cart"
import {useFavorites} from "@/hooks/use-favorites"
import {Settings} from "../settings"

const navItems = [
  {href: "/", label: "Home"},
  {href: "/about", label: "About"},
  {href: "/contact", label: "Contact"},
]

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {cartCount} = useCart();
  const {favoritesCount} = useFavorites();

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const hasFavorites = isClient && favoritesCount > 0;

  return (
    <header className="relative bg-card/80 backdrop-blur-lg border-b sticky top-0 z-50 overflow-hidden">
      {/* Subtle animated background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-l from-accent/5 via-transparent to-accent/10 animate-[pulse_4s_ease-in-out_infinite]"></div>
        <div className="absolute -inset-x-full h-full bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-[slide_8s_ease-in-out_infinite]"></div>
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-2xl font-headline font-bold text-primary">
              <Flame className="h-8 w-8" aria-hidden="true" />
              <span>IronAwe</span>
            </Link>
          </div>
          <nav className="hidden md:flex md:items-center md:space-x-8" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-medium hover:text-primary transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Settings />
            <Button variant="ghost" size="icon" asChild>
              <Link href="/favorites" className="relative" aria-label={`View favorites, ${favoritesCount} items`}>
                <Heart className={cn("h-5 w-5", hasFavorites ? "fill-primary text-primary" : "")} />
                <span className="sr-only">Favorites</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/cart" className="relative" aria-label={`View shopping cart, ${cartCount} items`}>
                {isClient && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground" aria-hidden="true">
                    {cartCount}
                  </span>
                )}
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Shopping Cart</span>
              </Link>
            </Button>
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-expanded={isMenuOpen} aria-controls="mobile-menu" aria-label="Toggle navigation menu">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      <div id="mobile-menu" className={cn("md:hidden", {"block": isMenuOpen, "hidden": !isMenuOpen})}>
        <nav className="px-2 pt-2 pb-4 space-y-1 sm:px-3 border-t" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-secondary">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
