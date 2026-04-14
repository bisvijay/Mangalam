"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  MapPin,
  Star,
  Users,
  BedDouble,
  PartyPopper,
  Building2,
  CalendarDays,
} from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { formatDate } from "@/lib/utils";

interface HomeContentProps {
  heroTitle: string;
  heroSubtitle: string;
  heroImages: string[];
  aboutText: string;
  phone: string;
  email: string;
  address: string;
}

const venues = [
  {
    name: "Mangalam Grand Hall",
    capacity: 500,
    features: ["Stage", "AC", "Sound System", "LED Lighting", "Bridal Room"],
    type: "Indoor" as const,
  },
  {
    name: "Celebration Hall",
    capacity: 300,
    features: ["Stage", "AC", "Sound System", "LED Lighting"],
    type: "Indoor" as const,
  },
  {
    name: "Royal Hall",
    capacity: 200,
    features: ["AC", "Sound System", "Projector"],
    type: "Indoor" as const,
  },
  {
    name: "Mangalam Lawn",
    capacity: 1000,
    features: ["Open Air", "Tent Setup", "Parking", "Generator"],
    type: "Outdoor" as const,
  },
];

export function HomeContent({
  heroTitle,
  heroSubtitle,
  heroImages,
  aboutText,
  phone,
  email,
  address,
}: HomeContentProps) {
  const { t } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-rotate hero images every 5 seconds
  useEffect(() => {
    if (heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const [upcomingEvents, setUpcomingEvents] = useState<{ id: string; name: string; date: string; details: string }[]>([]);
  useEffect(() => {
    fetch("/api/public/events")
      .then((r) => r.json())
      .then((data) => setUpcomingEvents(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[600px] lg:min-h-[700px] text-white overflow-hidden">
        {/* Background Images */}
        {heroImages.map((img, index) => (
          <div
            key={img}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{
              backgroundImage: `url(${img})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ))}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-maroon-900/80 via-maroon-900/70 to-maroon-950/80" />
        
        {/* Image indicators */}
        {heroImages.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentImageIndex
                    ? "bg-gold-400 w-6"
                    : "bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Show image ${index + 1}`}
              />
            ))}
          </div>
        )}
        
        <div className="relative container mx-auto px-4 py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge className="bg-gold-500/20 text-gold-300 border-gold-500/30 hover:bg-gold-500/30">
              {t.hero.badge}
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              {heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-maroon-200 max-w-2xl mx-auto">
              {heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                asChild
                size="lg"
                className="bg-gold-500 text-maroon-900 hover:bg-gold-400 font-semibold"
              >
                <Link href="/inquiry">{t.hero.bookEvent}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-gold-500/50 text-gold-300 hover:bg-gold-500/10"
              >
                <Link href="/#venues">{t.hero.exploreVenues}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events */
      {upcomingEvents.length > 0 && (
        <section id="upcoming-events" className="py-10 bg-gradient-to-br from-maroon-50 to-gold-50 dark:from-maroon-950/30 dark:to-gold-950/20 border-b">
          <div className="container mx-auto px-4 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-maroon-800">Upcoming Events</h2>
              <p className="text-muted-foreground text-sm">
                Join us for these upcoming celebrations at Mangalam
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((evt) => (
                <Card key={evt.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-sm text-maroon-600 mb-1">
                      <CalendarDays className="h-4 w-4" />
                      <span className="font-medium">{formatDate(evt.date)}</span>
                    </div>
                    <CardTitle className="text-lg">{evt.name}</CardTitle>
                  </CardHeader>
                  {evt.details && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{evt.details}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="py-12 bg-background border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Building2, value: "4", label: t.stats.banquetHalls },
              { icon: BedDouble, value: "18", label: t.stats.hotelRooms },
              { icon: Users, value: "1000+", label: t.stats.guestCapacity },
              { icon: PartyPopper, value: "50,000", label: t.stats.sqFtLawn },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="space-y-2">
                <Icon className="h-8 w-8 text-maroon-600 mx-auto" />
                <div className="text-2xl font-bold text-maroon-800">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold text-maroon-800">
              {t.about.heading}
            </h2>
            <p className="text-muted-foreground leading-relaxed">{aboutText}</p>
          </div>
        </div>
      </section>

      {/* Venues */}
      <section id="venues" className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-maroon-800">
              {t.venues.heading}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t.venues.subheading}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {venues.map((venue) => (
              <Card key={venue.name} className="overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-maroon-100 to-gold-100 flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-maroon-300" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{venue.name}</CardTitle>
                  <CardDescription>
                    {venue.type === "Indoor" ? t.venues.indoor : t.venues.outdoor}{" "}
                    · {t.venues.upTo} {venue.capacity} {t.venues.guests}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {venue.features.map((f) => (
                      <Badge key={f} variant="secondary" className="text-xs">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Event Types */}
      <section id="events" className="py-16 lg:py-24">
        <div className="container mx-auto px-4 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-maroon-800">
              {t.eventsSection.heading}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t.eventsSection.subheading}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {t.eventsSection.items.map((event) => (
              <Card key={event.name}>
                <CardHeader>
                  <CardTitle className="text-lg">{event.name}</CardTitle>
                  <CardDescription>{event.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {event.features.map((f) => (
                      <Badge key={f} variant="outline" className="text-xs">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-maroon-800">
              {t.testimonials.heading}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {t.testimonials.items.map((testimonial) => (
              <Card key={testimonial.name}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-gold-400 text-gold-400"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.text}
                  </p>
                  <div>
                    <p className="text-sm font-medium">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.event}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <h2 className="text-3xl font-bold text-maroon-800">
              {t.contact.heading}
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="flex flex-col items-center gap-2">
                <Phone className="h-8 w-8 text-maroon-600" />
                <p className="text-sm font-medium">{phone}</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Mail className="h-8 w-8 text-maroon-600" />
                <p className="text-sm font-medium">{email}</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <MapPin className="h-8 w-8 text-maroon-600" />
                <p className="text-sm font-medium">{address}</p>
              </div>
            </div>
            <Button
              asChild
              size="lg"
              className="bg-maroon-700 hover:bg-maroon-800"
            >
              <Link href="/inquiry">{t.contact.sendInquiry}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
