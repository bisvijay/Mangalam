import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { eventTypes } from "@/lib/event-data";

export default function EventsPage() {
  return (
    <div className="py-12 lg:py-20">
      <div className="container mx-auto px-4 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-maroon-800">
            Events We Host
          </h1>
          <p className="text-muted-foreground text-lg">
            From grand weddings to corporate seminars — every occasion deserves
            the perfect venue. Explore our event types and find your ideal
            celebration space.
          </p>
        </div>

        {/* Event Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {eventTypes.map((event) => (
            <Card
              key={event.slug}
              className="group hover:shadow-lg transition-shadow"
            >
              <div className="h-40 bg-gradient-to-br from-maroon-100 to-gold-100 flex items-center justify-center">
                <span className="text-3xl font-bold text-maroon-200 group-hover:text-maroon-300 transition-colors">
                  {event.name}
                </span>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{event.name}</CardTitle>
                <CardDescription>{event.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {event.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {event.features.slice(0, 4).map((f) => (
                    <Badge key={f} variant="secondary" className="text-xs">
                      {f}
                    </Badge>
                  ))}
                  {event.features.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{event.features.length - 4} more
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    {event.capacity}
                  </span>
                  <Link href={`/events/${event.slug}`}>
                    <Button variant="ghost" size="sm" className="gap-1">
                      View Details <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center pt-8">
          <p className="text-muted-foreground mb-4">
            Don&apos;t see your event type? We can customize any venue for your
            needs.
          </p>
          <Button asChild className="bg-maroon-700 hover:bg-maroon-800">
            <Link href="/inquiry">Send an Inquiry</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
