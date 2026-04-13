"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toISODateString } from "@/lib/utils";

interface HallAvailability {
  hallId: string;
  hallName: string;
  type: string;
  capacity: number;
  available: boolean;
}

interface AvailabilityResponse {
  date: string;
  status: string;
  halls: HallAvailability[];
}

export default function AvailabilityPage() {
  const [date, setDate] = useState("");
  const [result, setResult] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheck() {
    if (!date) {
      setError("Please select a date");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/public/availability?date=${date}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to check availability");
        return;
      }
      const data: AvailabilityResponse = await res.json();
      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Minimum date: today
  const today = toISODateString();

  return (
    <div className="py-12 lg:py-20">
      <div className="container mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-maroon-800">
            Check Availability
          </h1>
          <p className="text-muted-foreground text-lg">
            Select your preferred date to see which venues are available for
            your event.
          </p>
        </div>

        {/* Check form */}
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Select Event Date
            </CardTitle>
            <CardDescription>
              Choose your preferred date to check venue availability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Event Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={today}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              onClick={handleCheck}
              className="w-full bg-maroon-700 hover:bg-maroon-800"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check Availability"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              {result.status === "available" ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 border border-green-200">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">
                    Venues available on{" "}
                    {new Date(result.date + "T00:00:00").toLocaleDateString(
                      "en-IN",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-700 border border-red-200">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">
                    All venues booked on{" "}
                    {new Date(result.date + "T00:00:00").toLocaleDateString(
                      "en-IN",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {result.halls.map((hall) => (
                <Card
                  key={hall.hallId}
                  className={
                    hall.available
                      ? "border-green-200 bg-green-50/50"
                      : "border-red-200 bg-red-50/50 opacity-75"
                  }
                >
                  <CardContent className="pt-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{hall.hallName}</h3>
                      {hall.available ? (
                        <Badge className="bg-green-100 text-green-700 border-green-300">
                          Available
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Booked</Badge>
                      )}
                    </div>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      <span>{hall.type}</span>
                      <span>·</span>
                      <span>Up to {hall.capacity} guests</span>
                    </div>
                    {hall.available && (
                      <Button asChild size="sm" variant="outline" className="mt-2">
                        <Link
                          href={`/inquiry?date=${result.date}&hall=${hall.hallId}`}
                        >
                          Book This Venue
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {result.status === "fully-booked" && (
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Try a different date, or contact us for alternative
                  arrangements.
                </p>
                <Button asChild variant="outline">
                  <Link href="/inquiry">Contact Us</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
