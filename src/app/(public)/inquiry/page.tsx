"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, Loader2, Send, Phone, Clock } from "lucide-react";
import { toISODateString } from "@/lib/utils";

const eventTypes = [
  "Wedding",
  "Reception",
  "Engagement",
  "Birthday",
  "Anniversary",
  "Corporate",
  "Other",
];

const hallOptions = [
  { id: "", label: "No preference" },
  { id: "H-01", label: "Mangalam Grand Hall (500 guests)" },
  { id: "H-02", label: "Celebration Hall (300 guests)" },
  { id: "H-03", label: "Royal Hall (200 guests)" },
  { id: "H-04", label: "Mangalam Lawn (1000 guests)" },
];

interface FormData {
  name: string;
  phone: string;
  email: string;
  eventType: string;
  preferredDate: string;
  guestsEstimate: string;
  hallPreference: string;
  roomsNeeded: boolean;
  message: string;
}

export default function InquiryPage() {
  return (
    <Suspense>
      <InquiryForm />
    </Suspense>
  );
}

function InquiryForm() {
  const searchParams = useSearchParams();
  const presetEvent = searchParams.get("event") ?? "";
  const presetDate = searchParams.get("date") ?? "";
  const presetHall = searchParams.get("hall") ?? "";

  const [form, setForm] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    eventType: presetEvent
      ? eventTypes.find(
          (e) => e.toLowerCase() === presetEvent.toLowerCase()
        ) ?? ""
      : "",
    preferredDate: presetDate,
    guestsEstimate: "",
    hallPreference: presetHall,
    roomsNeeded: false,
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function updateField(field: keyof FormData, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!form.name.trim() || form.name.trim().length < 2)
      errs.name = "Name is required (at least 2 characters)";
    if (!form.phone.trim() || form.phone.trim().length < 10)
      errs.phone = "Valid phone number required (at least 10 digits)";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Invalid email address";
    if (!form.eventType) errs.eventType = "Please select an event type";
    if (!form.preferredDate) errs.preferredDate = "Please select a date";
    if (
      !form.guestsEstimate ||
      isNaN(Number(form.guestsEstimate)) ||
      Number(form.guestsEstimate) < 1
    )
      errs.guestsEstimate = "Please enter estimated number of guests";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    setSubmitting(true);

    try {
      const res = await fetch("/api/public/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          eventType: form.eventType,
          preferredDate: form.preferredDate,
          guestsEstimate: Number(form.guestsEstimate),
          hallPreference: form.hallPreference,
          roomsNeeded: form.roomsNeeded,
          message: form.message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setSubmitError(
            "Too many submissions. Please try again after some time."
          );
        } else {
          setSubmitError(data.error || "Something went wrong. Please try again.");
        }
        return;
      }

      setSubmitted(true);
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Success state
  if (submitted) {
    return (
      <div className="py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-lg mx-auto text-center">
            <CardContent className="pt-8 pb-8 space-y-6">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-maroon-800">
                  Inquiry Submitted!
                </h2>
                <p className="text-muted-foreground">
                  Thank you for your interest in Mangalam. Our team will contact
                  you within 24 hours with more details and a quote.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Expected response: within 24 hours
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="outline">
                  <Link href="/">Back to Home</Link>
                </Button>
                <Button asChild className="bg-maroon-700 hover:bg-maroon-800">
                  <Link href="/availability">Check More Dates</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const today = toISODateString();

  return (
    <div className="py-12 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-maroon-800">
                  Send an Inquiry
                </CardTitle>
                <CardDescription>
                  Fill in the details below and our team will get back to you
                  with a personalized quote.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Contact Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      Contact Details
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          Full Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="name"
                          value={form.name}
                          onChange={(e) => updateField("name", e.target.value)}
                          placeholder="Your full name"
                        />
                        {errors.name && (
                          <p className="text-xs text-destructive">
                            {errors.name}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          Phone Number{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={form.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                          placeholder="Your phone number"
                        />
                        {errors.phone && (
                          <p className="text-xs text-destructive">
                            {errors.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="your@email.com"
                      />
                      {errors.email && (
                        <p className="text-xs text-destructive">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      Event Details
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="eventType">
                          Event Type{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          id="eventType"
                          value={form.eventType}
                          onChange={(e) =>
                            updateField("eventType", e.target.value)
                          }
                        >
                          <option value="">Select event type</option>
                          {eventTypes.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </Select>
                        {errors.eventType && (
                          <p className="text-xs text-destructive">
                            {errors.eventType}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="preferredDate">
                          Preferred Date{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="preferredDate"
                          type="date"
                          value={form.preferredDate}
                          onChange={(e) =>
                            updateField("preferredDate", e.target.value)
                          }
                          min={today}
                        />
                        {errors.preferredDate && (
                          <p className="text-xs text-destructive">
                            {errors.preferredDate}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="guests">
                          Estimated Guests{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="guests"
                          type="number"
                          min="1"
                          max="10000"
                          value={form.guestsEstimate}
                          onChange={(e) =>
                            updateField("guestsEstimate", e.target.value)
                          }
                          placeholder="e.g. 300"
                        />
                        {errors.guestsEstimate && (
                          <p className="text-xs text-destructive">
                            {errors.guestsEstimate}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hall">Hall Preference</Label>
                        <Select
                          id="hall"
                          value={form.hallPreference}
                          onChange={(e) =>
                            updateField("hallPreference", e.target.value)
                          }
                        >
                          {hallOptions.map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="rooms"
                        type="checkbox"
                        checked={form.roomsNeeded}
                        onChange={(e) =>
                          updateField("roomsNeeded", e.target.checked)
                        }
                        className="h-4 w-4 rounded border-input"
                      />
                      <Label htmlFor="rooms" className="font-normal">
                        I also need hotel rooms for guests
                      </Label>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">
                      Additional Message (optional)
                    </Label>
                    <Textarea
                      id="message"
                      value={form.message}
                      onChange={(e) => updateField("message", e.target.value)}
                      placeholder="Tell us more about your event — special requirements, decoration preferences, catering needs, etc."
                      rows={4}
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {form.message.length}/1000
                    </p>
                  </div>

                  {submitError && (
                    <p className="text-sm text-destructive text-center">
                      {submitError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-maroon-700 hover:bg-maroon-800"
                    disabled={submitting}
                    size="lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Submit Inquiry
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-maroon-50 border-maroon-200">
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold text-maroon-800">
                  Prefer to Talk?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Call us directly for immediate assistance. Our team is
                  available 9 AM – 9 PM.
                </p>
                <a
                  href="tel:+918383981280"
                  className="flex items-center gap-2 text-maroon-700 font-semibold"
                >
                  <Phone className="h-5 w-5" />
                  83839 81280
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-semibold">What Happens Next?</h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-maroon-100 text-maroon-700 text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <span>
                      We receive your inquiry and review the details.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-maroon-100 text-maroon-700 text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <span>
                      Our team calls you within 24 hours to discuss your event.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-maroon-100 text-maroon-700 text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <span>
                      We send you a detailed quote with venue options and
                      pricing.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-maroon-100 text-maroon-700 text-xs font-bold flex items-center justify-center">
                      4
                    </span>
                    <span>
                      Confirm your booking with an advance payment.
                    </span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/availability">Check Date Availability</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
