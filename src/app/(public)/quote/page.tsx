"use client";

import { useState } from "react";
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
import { CheckCircle2, Loader2, Send, Clock } from "lucide-react";
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

export default function QuotePage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    eventType: "",
    preferredDate: "",
    guestsEstimate: "",
    hallPreference: "",
    roomsNeeded: false,
    roomCount: "",
    roomNights: "",
    decorationNeeded: false,
    decorationBudget: "",
    cateringNeeded: false,
    cateringType: "",
    cateringBudgetPerPlate: "",
    djLighting: false,
    photography: false,
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function updateField(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      errs.name = "Name is required";
    if (!form.phone.trim() || form.phone.trim().length < 10)
      errs.phone = "Valid phone number required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Invalid email";
    if (!form.eventType) errs.eventType = "Please select an event type";
    if (!form.preferredDate) errs.preferredDate = "Please select a date";
    if (
      !form.guestsEstimate ||
      isNaN(Number(form.guestsEstimate)) ||
      Number(form.guestsEstimate) < 1
    )
      errs.guestsEstimate = "Enter estimated guests";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;
    setSubmitting(true);

    // Build message with all extra details
    const extras: string[] = [];
    if (form.roomsNeeded)
      extras.push(
        `Rooms: ${form.roomCount || "?"} rooms x ${form.roomNights || "?"} nights`
      );
    if (form.decorationNeeded)
      extras.push(
        `Decoration: Yes (Budget: ${form.decorationBudget ? `₹${form.decorationBudget}` : "Flexible"})`
      );
    if (form.cateringNeeded)
      extras.push(
        `Catering: ${form.cateringType || "Standard"} (${form.cateringBudgetPerPlate ? `₹${form.cateringBudgetPerPlate}/plate` : "Flexible"})`
      );
    if (form.djLighting) extras.push("DJ & Lighting: Yes");
    if (form.photography) extras.push("Photography: Yes");

    const fullMessage = [
      "[DETAILED QUOTE REQUEST]",
      ...extras,
      form.message ? `\nAdditional: ${form.message}` : "",
    ]
      .filter(Boolean)
      .join("\n");

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
          message: fullMessage,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSubmitError(
          res.status === 429
            ? "Too many submissions. Please try again later."
            : data.error || "Something went wrong."
        );
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-lg mx-auto text-center">
            <CardContent className="pt-8 pb-8 space-y-6">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-maroon-800">
                  Quote Request Submitted!
                </h2>
                <p className="text-muted-foreground">
                  Our team will prepare a detailed quote based on your
                  requirements and contact you within 24 hours.
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
                  <Link href="/events">Explore Events</Link>
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
      <div className="container mx-auto px-4 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-maroon-800">
              Get a Detailed Quote
            </CardTitle>
            <CardDescription>
              Tell us everything about your event and we&apos;ll prepare a
              comprehensive quote with pricing for all services.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact Details */}
              <fieldset className="space-y-4">
                <legend className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Contact Details
                </legend>
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
                      <p className="text-xs text-destructive">{errors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Phone <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="Phone number"
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive">{errors.phone}</p>
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
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>
              </fieldset>

              {/* Event Details */}
              <fieldset className="space-y-4">
                <legend className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Event Details
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="eventType">
                      Event Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      id="eventType"
                      value={form.eventType}
                      onChange={(e) => updateField("eventType", e.target.value)}
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
                      Event Date <span className="text-destructive">*</span>
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
                      Guests <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="guests"
                      type="number"
                      min="1"
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
              </fieldset>

              {/* Accommodation */}
              <fieldset className="space-y-4">
                <legend className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Accommodation
                </legend>
                <div className="flex items-center gap-2">
                  <input
                    id="roomsNeeded"
                    type="checkbox"
                    checked={form.roomsNeeded}
                    onChange={(e) =>
                      updateField("roomsNeeded", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor="roomsNeeded" className="font-normal">
                    I need hotel rooms for guests
                  </Label>
                </div>
                {form.roomsNeeded && (
                  <div className="grid gap-4 sm:grid-cols-2 pl-6">
                    <div className="space-y-2">
                      <Label htmlFor="roomCount">Number of Rooms</Label>
                      <Input
                        id="roomCount"
                        type="number"
                        min="1"
                        max="18"
                        value={form.roomCount}
                        onChange={(e) =>
                          updateField("roomCount", e.target.value)
                        }
                        placeholder="e.g. 10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roomNights">Number of Nights</Label>
                      <Input
                        id="roomNights"
                        type="number"
                        min="1"
                        value={form.roomNights}
                        onChange={(e) =>
                          updateField("roomNights", e.target.value)
                        }
                        placeholder="e.g. 2"
                      />
                    </div>
                  </div>
                )}
              </fieldset>

              {/* Services */}
              <fieldset className="space-y-4">
                <legend className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Additional Services
                </legend>
                {/* Decoration */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      id="decoration"
                      type="checkbox"
                      checked={form.decorationNeeded}
                      onChange={(e) =>
                        updateField("decorationNeeded", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="decoration" className="font-normal">
                      Decoration services
                    </Label>
                  </div>
                  {form.decorationNeeded && (
                    <div className="pl-6 space-y-2">
                      <Label htmlFor="decorBudget">
                        Decoration Budget (₹, optional)
                      </Label>
                      <Input
                        id="decorBudget"
                        type="number"
                        min="0"
                        value={form.decorationBudget}
                        onChange={(e) =>
                          updateField("decorationBudget", e.target.value)
                        }
                        placeholder="e.g. 50000"
                      />
                    </div>
                  )}
                </div>

                {/* Catering */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      id="catering"
                      type="checkbox"
                      checked={form.cateringNeeded}
                      onChange={(e) =>
                        updateField("cateringNeeded", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="catering" className="font-normal">
                      Catering services
                    </Label>
                  </div>
                  {form.cateringNeeded && (
                    <div className="pl-6 grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="cateringType">Cuisine Type</Label>
                        <Select
                          id="cateringType"
                          value={form.cateringType}
                          onChange={(e) =>
                            updateField("cateringType", e.target.value)
                          }
                        >
                          <option value="">Select</option>
                          <option value="Veg">Vegetarian</option>
                          <option value="Non-Veg">Non-Vegetarian</option>
                          <option value="Mixed">Mixed</option>
                          <option value="Multi-Cuisine">Multi-Cuisine</option>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cateringBudget">
                          Budget per Plate (₹)
                        </Label>
                        <Input
                          id="cateringBudget"
                          type="number"
                          min="0"
                          value={form.cateringBudgetPerPlate}
                          onChange={(e) =>
                            updateField(
                              "cateringBudgetPerPlate",
                              e.target.value
                            )
                          }
                          placeholder="e.g. 500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* DJ & Photography */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      id="dj"
                      type="checkbox"
                      checked={form.djLighting}
                      onChange={(e) =>
                        updateField("djLighting", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="dj" className="font-normal">
                      DJ & Lighting
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="photo"
                      type="checkbox"
                      checked={form.photography}
                      onChange={(e) =>
                        updateField("photography", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="photo" className="font-normal">
                      Photography / Videography
                    </Label>
                  </div>
                </div>
              </fieldset>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  Any other requirements (optional)
                </Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  placeholder="Anything else you'd like us to know..."
                  rows={3}
                  maxLength={1000}
                />
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
                    Request Detailed Quote
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Want a quick inquiry instead?{" "}
                <Link
                  href="/inquiry"
                  className="text-maroon-700 hover:underline font-medium"
                >
                  Use the simple form
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
