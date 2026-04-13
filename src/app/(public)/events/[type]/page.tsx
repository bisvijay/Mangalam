import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Building2, Users, IndianRupee } from "lucide-react";
import { eventTypes, getEventBySlug } from "@/lib/event-data";

export function generateStaticParams() {
  return eventTypes.map((e) => ({ type: e.slug }));
}

export function generateMetadata({ params }: { params: { type: string } }) {
  const event = getEventBySlug(params.type);
  if (!event) return { title: "Event Not Found" };
  return {
    title: `${event.name} - Mangalam Banquet Hall & Hotel`,
    description: event.description,
  };
}

export default function EventTypePage({
  params,
}: {
  params: { type: string };
}) {
  const event = getEventBySlug(params.type);
  if (!event) notFound();

  return (
    <div className="py-12 lg:py-20">
      <div className="container mx-auto px-4 space-y-12">
        {/* Back link */}
        <Link
          href="/events"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Events
        </Link>

        {/* Hero */}
        <div className="relative rounded-xl bg-gradient-to-br from-maroon-800 via-maroon-900 to-maroon-950 text-white p-8 lg:p-16">
          <div className="max-w-2xl space-y-4">
            <Badge className="bg-gold-500/20 text-gold-300 border-gold-500/30">
              {event.capacity}
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              {event.name}
            </h1>
            <p className="text-lg text-maroon-200">{event.tagline}</p>
            <div className="flex gap-3 pt-2">
              <Button
                asChild
                className="bg-gold-500 text-maroon-900 hover:bg-gold-400"
              >
                <Link href={`/inquiry?event=${event.slug}`}>
                  Book This Event
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-gold-500/50 text-gold-300 hover:bg-gold-500/10"
              >
                <Link href="/availability">Check Availability</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="prose prose-gray max-w-none">
              {event.longDescription.split("\n\n").map((para, i) => (
                <p key={i} className="text-muted-foreground leading-relaxed">
                  {para}
                </p>
              ))}
            </div>

            {/* Features */}
            <div>
              <h2 className="text-xl font-semibold text-maroon-800 mb-4">
                What We Offer
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {event.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick info card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Capacity</p>
                    <p className="text-sm text-muted-foreground">
                      {event.capacity}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <IndianRupee className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Price Range</p>
                    <p className="text-sm text-muted-foreground">
                      {event.priceRange}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Recommended Venues</p>
                    <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                      {event.halls.map((hall) => (
                        <li key={hall}>• {hall}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA card */}
            <Card className="bg-maroon-50 border-maroon-200">
              <CardContent className="pt-6 space-y-4 text-center">
                <h3 className="font-semibold text-maroon-800">
                  Ready to Book?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Send us an inquiry and our team will get back to you within 24
                  hours with a personalized quote.
                </p>
                <Button
                  asChild
                  className="w-full bg-maroon-700 hover:bg-maroon-800"
                >
                  <Link href={`/inquiry?event=${event.slug}`}>
                    Send Inquiry
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground">
                  Or call us at{" "}
                  <a
                    href="tel:+918383981280"
                    className="font-medium text-maroon-700"
                  >
                    83839 81280
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
