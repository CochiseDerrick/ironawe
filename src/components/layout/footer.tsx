import Link from "next/link"
import {Flame} from "lucide-react"

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Flame className="h-6 w-6 text-primary" />
            <span className="font-headline text-xl font-bold">IronAwe</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-4 md:mb-0">
            <Link href="/about" className="text-sm hover:text-primary">About</Link>
            <Link href="/contact" className="text-sm hover:text-primary">Contact</Link>
            <Link href="/admin" className="text-sm hover:text-primary">Admin</Link>
            <Link href="https://dorsetcreative.online" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-primary">Web Design</Link>
          </nav>
          <p className="text-sm text-muted-foreground">
            © {year} IronAwe. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
