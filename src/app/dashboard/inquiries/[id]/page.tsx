"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowLeft, Phone, Mail, MessageSquare, Calendar, Users, MapPin, Loader2, BedDouble } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface FollowUp {
  date: string;
  by: string;
  method: string;
  notes: string;
}

interface Inquiry {
  id: string;
  source: string;
  submittedAt: string;
  name: string;
  phone: string;
  email: string;
  eventType: string;
  preferredDate: string;
  guestsEstimate: number;
  hallPreference: string;
  roomsNeeded: boolean;
  message: string;
  status: string;
  followUps: FollowUp[];
  quotedAmount: number;
  convertedToBookingId: string;
  lostReason: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  quoted: "bg-orange-100 text-orange-800",
  converted: "bg-green-100 text-green-800",
  lost: "bg-gray-100 text-gray-800",
};

const hallNames: Record<string, string> = {
  "H-01": "Mangalam Grand Hall",
  "H-02": "Celebration Hall",
  "H-03": "Royal Hall",
  "H-04": "Mangalam Lawn",
};

export default function InquiryDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Follow-up form
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [fuMethod, setFuMethod] = useState("phone");
  const [fuNotes, setFuNotes] = useState("");
  const [savingFu, setSavingFu] = useState(false);

  useEffect(() => {
    fetch(`/api/inquiries/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setInquiry)
      .catch(() => setError("Inquiry not found"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusChange(newStatus: string) {
    if (!inquiry) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) setInquiry({ ...inquiry, status: newStatus });
    } catch { /* ignore */ }
    setUpdatingStatus(false);
  }

  async function handleAddFollowUp() {
    if (!inquiry || !fuNotes.trim()) return;
    setSavingFu(true);
    const followUp: FollowUp = {
      date: new Date().toISOString(),
      by: "admin",
      method: fuMethod,
      notes: fuNotes.trim(),
    };
    const updatedFollowUps = [...(inquiry.followUps || []), followUp];
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followUps: updatedFollowUps, status: inquiry.status === "new" ? "contacted" : inquiry.status }),
      });
      if (res.ok) {
        setInquiry({
          ...inquiry,
          followUps: updatedFollowUps,
          status: inquiry.status === "new" ? "contacted" : inquiry.status,
        });
        setFuNotes("");
        setShowFollowUp(false);
      }
    } catch { /* ignore */ }
    setSavingFu(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error || "Inquiry not found"}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/inquiries">Back to Inquiries</Link>
        </Button>
      </div>
    );
  }

  const phoneClean = inquiry.phone.replace(/[^0-9+]/g, "");

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard/inquiries"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{inquiry.name}</h1>
              <Badge className={statusColors[inquiry.status] || ""}>{inquiry.status}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Inquiry {inquiry.id} &bull; Submitted {formatDate(inquiry.submittedAt)} via {inquiry.source}
            </p>
          </div>
        </div>
        <Select
          value={inquiry.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={updatingStatus}
          className="w-36"
        >
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="quoted">Quoted</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </Select>
      </div>

      {/* Quick Actions — Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <a href={`tel:${phoneClean}`}>
                <Phone className="h-4 w-4 mr-2" /> Call {inquiry.phone}
              </a>
            </Button>
            {inquiry.email && (
              <Button asChild variant="outline" size="sm">
                <a href={`mailto:${inquiry.email}?subject=Regarding your inquiry at Mangalam - ${inquiry.eventType}&body=Dear ${inquiry.name},%0D%0A%0D%0AThank you for your inquiry about ${inquiry.eventType} on ${inquiry.preferredDate}.%0D%0A%0D%0A`}>
                  <Mail className="h-4 w-4 mr-2" /> Email {inquiry.email}
                </a>
              </Button>
            )}
            <Button asChild variant="outline" size="sm">
              <a href={`https://wa.me/${phoneClean.replace(/^0/, "91")}?text=Hello ${inquiry.name}, thank you for your inquiry about ${inquiry.eventType} at Mangalam. We'd like to help you with your event.`} target="_blank" rel="noopener noreferrer">
                <MessageSquare className="h-4 w-4 mr-2" /> WhatsApp
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4" /> Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{inquiry.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <a href={`tel:${phoneClean}`} className="font-medium text-blue-600 hover:underline">{inquiry.phone}</a>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              {inquiry.email ? (
                <a href={`mailto:${inquiry.email}`} className="font-medium text-blue-600 hover:underline">{inquiry.email}</a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Source</span>
              <span className="capitalize">{inquiry.source}</span>
            </div>
          </CardContent>
        </Card>

        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" /> Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Event Type</span>
              <Badge variant="secondary">{inquiry.eventType}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preferred Date</span>
              <span className="font-medium">{formatDate(inquiry.preferredDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Guests</span>
              <span className="font-medium flex items-center gap-1"><Users className="h-3 w-3" /> {inquiry.guestsEstimate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hall Preference</span>
              <span className="font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> {hallNames[inquiry.hallPreference] || inquiry.hallPreference || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rooms Needed</span>
              <span className="font-medium flex items-center gap-1"><BedDouble className="h-3 w-3" /> {inquiry.roomsNeeded ? "Yes" : "No"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message */}
      {inquiry.message && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Message from Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{inquiry.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Follow-ups */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Follow-up History</CardTitle>
            <CardDescription>Track all communications with this lead</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFollowUp(!showFollowUp)}>
            + Add Follow-up
          </Button>
        </CardHeader>
        <CardContent>
          {showFollowUp && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/30 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Method</Label>
                  <Select value={fuMethod} onChange={(e) => setFuMethod(e.target.value)}>
                    <option value="phone">Phone Call</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="in-person">In Person</option>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={fuNotes} onChange={(e) => setFuNotes(e.target.value)} placeholder="What was discussed? Next steps?" rows={3} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled={savingFu || !fuNotes.trim()} onClick={handleAddFollowUp}>
                  {savingFu ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Save Follow-up
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowFollowUp(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {inquiry.followUps && inquiry.followUps.length > 0 ? (
            <div className="space-y-3">
              {[...inquiry.followUps].reverse().map((fu, i) => (
                <div key={i} className="border-l-2 border-maroon-300 pl-4 py-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="text-xs capitalize">{fu.method}</Badge>
                    <span className="text-muted-foreground text-xs">{formatDate(fu.date)}</span>
                    <span className="text-muted-foreground text-xs">by {fu.by}</span>
                  </div>
                  <p className="text-sm mt-1">{fu.notes}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No follow-ups recorded yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Convert to Booking */}
      {inquiry.status !== "converted" && inquiry.status !== "lost" && (
        <div className="flex gap-3">
          <Button asChild className="bg-maroon-700 hover:bg-maroon-800">
            <Link href={`/dashboard/bookings/new?from=${inquiry.id}&name=${encodeURIComponent(inquiry.name)}&phone=${encodeURIComponent(inquiry.phone)}&email=${encodeURIComponent(inquiry.email || "")}&eventType=${encodeURIComponent(inquiry.eventType)}&eventDate=${inquiry.preferredDate}&guests=${inquiry.guestsEstimate}&hall=${inquiry.hallPreference}`}>
              Convert to Booking
            </Link>
          </Button>
        </div>
      )}
      {inquiry.convertedToBookingId && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm">
              Converted to booking:{" "}
              <Link href={`/dashboard/bookings/${inquiry.convertedToBookingId}`} className="text-blue-600 hover:underline font-medium">
                {inquiry.convertedToBookingId}
              </Link>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
