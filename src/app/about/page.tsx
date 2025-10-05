
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Jade - The Artist Behind IronAwe',
  description: 'Meet Jade, the Dorset-based artist and welder behind IronAwe. Learn about her passion for transforming reclaimed metal into awe-inspiring sculptures.',
  openGraph: {
    title: 'About Jade at IronAwe',
    description: 'Forging passion into permanent art in the heart of Dorset.',
    images: [{
      url: 'https://picsum.photos/seed/welder/1200/630',
      width: 1200,
      height: 630,
      alt: 'Artist Jade welding a metal sculpture in her Dorset workshop.',
    }],
  },
};

export default function AboutPage() {
  return (
    <div className="space-y-12">
      <section aria-labelledby="about-hero-title" className="text-center">
        <h1 id="about-hero-title" className="text-4xl font-headline font-bold text-primary sm:text-5xl md:text-6xl">
          About IronAwe
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-foreground/80">
          Forging passion into permanent art, from the heart of Dorset.
        </p>
      </section>

      <Card className="overflow-hidden">
        <article className="grid md:grid-cols-2">
          <div className="p-8 md:p-12 order-2 md:order-1">
            <h2 className="font-headline text-3xl font-bold mb-4">Meet Jade</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                IronAwe is the creative forge of Jade, a passionate artist and certified welder based in Dorset. It was born from a simple yet powerful fascination: the transformation of raw, unyielding metal into something that evokes emotion and wonder. What started in a small, dusty workshop has grown into a studio dedicated to the craft of metal sculpting.
              </p>
              <p>
                Jade believes that steel and iron possess a hidden beauty, a voice that can only be unlocked through the intense heat of the forge and the focused energy of a welder's torch. For her, each hammer strike and every molten bead is a word in a story she tells through metal.
              </p>
              <p>
                With a deep respect for the materials, Jade primarily works with reclaimed and industrial metals, giving them a new life and purpose. This commitment to sustainability is woven into her art, creating a dialogue between an industrial past and an artistic future. Whether it's a monumental outdoor sculpture or a delicate interior piece, every creation is a testament to durability, creativity, and the awe-inspiring power of metal.
              </p>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <Image
              src="https://picsum.photos/seed/welder/800/1000"
              alt="Artist Jade at work in the IronAwe workshop in Dorset, sparks flying from a welding torch."
              width={800}
              height={1000}
              className="w-full h-full object-cover min-h-[300px]"
              data-ai-hint="female welder artist"
              unoptimized
            />
          </div>
        </article>
      </Card>
    </div>
  );
}
