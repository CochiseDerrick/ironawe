
import { ContactForm } from "@/components/contact-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Jade at IronAwe',
  description: 'Get in touch with Jade at IronAwe for custom fabrication, welding repairs, or mobile welding services. Based in Poole, Dorset.',
  openGraph: {
    title: 'Contact Jade at IronAwe',
    description: 'Have a question or a project in mind for Dorset-based artist Jade? We\'d love to hear from you.',
  },
};

export default function ContactPage() {
  return (
    <div className="space-y-12">
      <header className="text-center">
        <h1 className="text-4xl font-headline font-bold text-primary sm:text-5xl md:text-6xl">
          Get In Touch
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-foreground/80">
          Have a question or a project in mind? We'd love to hear from you.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <section aria-labelledby="send-message-heading" className="md:col-span-2">
          <Card>
            <CardHeader>
              <h2 id="send-message-heading" className="text-2xl font-semibold">Send Us a Message</h2>
              <CardDescription>Fill out the form below and we'll get back to you as soon as possible.</CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="contact-info-heading" className="space-y-6">
          <Card>
            <CardHeader>
              <h2 id="contact-info-heading" className="text-2xl font-semibold">Contact Information</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 mt-1 text-primary flex-shrink-0" aria-hidden="true" />
                <div className="min-w-0">
                  <h3 className="font-semibold">Email</h3>
                  <a href="mailto:jade.ironawe@gmail.com" className="text-muted-foreground hover:text-primary break-words">jade.ironawe@gmail.com</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 mt-1 text-primary" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold">Phone</h3>
                  <a href="tel:07879633207" className="text-muted-foreground hover:text-primary">07879 633207</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-1 text-primary" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold">Location</h3>
                  <p className="text-muted-foreground">Poole, Dorset</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
