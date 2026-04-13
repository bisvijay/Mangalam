"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import type { Booking, EventType, BookingStatus, PaymentMethod } from "@/types/booking";
import { calculateRoomGST, calculateHallGST, calculateGST, aggregateGST, type GSTResult } from "@/lib/gst";
import { formatCurrency, toISODateString } from "@/lib/utils";

const eventTypes: EventType[] = ["Wedding", "Engagement", "Birthday", "Anniversary", "Reception", "Corporate", "Other"];

const hallOptions = [
  { id: "H-01", name: "Mangalam Grand Hall", rate: 50000 },
  { id: "H-02", name: "Celebration Hall", rate: 35000 },
  { id: "H-03", name: "Royal Hall", rate: 25000 },
  { id: "H-04", name: "Mangalam Lawn", rate: 75000 },
];

export default function EditBookingPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [bookingDate, setBookingDate] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const [eventType, setEventType] = useState<EventType>("Wedding");
  const [eventDate, setEventDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [status, setStatus] = useState<BookingStatus>("confirmed");

  const [brideName, setBrideName] = useState("");
  const [groomName, setGroomName] = useState("");

  const [hallId, setHallId] = useState("H-01");
  const [roomsBooked, setRoomsBooked] = useState(0);
  const [guestsCount, setGuestsCount] = useState(100);

  const [roomRate, setRoomRate] = useState(999);
  const [roomNights, setRoomNights] = useState(1);
  const [hallCharge, setHallCharge] = useState(50000);
  const [decorationCharge, setDecorationCharge] = useState(0);
  const [cateringCharge, setCateringCharge] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);

  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [advanceMethod, setAdvanceMethod] = useState<PaymentMethod>("cash");
  const [cancellationNote, setCancellationNote] = useState("");
  const [notes, setNotes] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");

  useEffect(() => {
    fetch(`/api/bookings/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Booking not found");
        return res.json();
      })
      .then((booking: Booking) => {
        setBookingDate(booking.bookingDate);

        setCustomerName(booking.customer.name);
        setCustomerPhone(booking.customer.phone);
        setCustomerEmail(booking.customer.email || "");
        setCustomerAddress(booking.customer.address || "");

        setEventType(booking.eventType);
        setEventDate(booking.eventDate);
        setEventEndDate(booking.eventEndDate || booking.eventDate);
        setStatus(booking.status);

        setBrideName(booking.eventDetails?.brideName || "");
        setGroomName(booking.eventDetails?.groomName || "");

        setHallId(booking.venue.hallId);
        setRoomsBooked(booking.venue.roomsBooked);
        setGuestsCount(booking.venue.guestsCount);

        setRoomRate(booking.charges.roomRate);
        setRoomNights(booking.charges.roomNights);
        setHallCharge(booking.charges.hallCharge);
        setDecorationCharge(booking.charges.decorationCharge);
        setCateringCharge(booking.charges.cateringCharge);
        setOtherCharges(booking.charges.otherCharges);

        setAdvanceAmount(booking.advance || 0);
        setAdvanceMethod((booking.payments?.[0]?.method as PaymentMethod) || "cash");
        setCancellationNote(booking.cancellationNote || "");
        setNotes(booking.notes || "");
        setInvoiceId(booking.invoiceId || "");
        if (booking.invoiceId) {
          fetch(`/api/invoices/${booking.invoiceId.replace(/\//g, "-")}`)
            .then((r) => r.ok ? r.json() : null)
            .then((inv) => { if (inv?.invoiceDate) setInvoiceDate(inv.invoiceDate); })
            .catch(() => {});
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load booking"))
      .finally(() => setLoading(false));
  }, [id]);

  function handleHallChange(nextId: string) {
    setHallId(nextId);
    const hall = hallOptions.find((h) => h.id === nextId);
    if (hall) setHallCharge(hall.rate);
  }

  const roomTotal = roomRate * roomNights * roomsBooked;
  const subtotal = roomTotal + hallCharge + decorationCharge + cateringCharge + otherCharges;

  const gstResults: GSTResult[] = [];
  if (roomTotal > 0) gstResults.push(calculateRoomGST(roomRate, roomNights, roomsBooked));
  if (hallCharge > 0) gstResults.push(calculateHallGST(hallCharge));
  if (decorationCharge > 0) gstResults.push(calculateGST(decorationCharge, 18, true, "Decoration"));
  if (cateringCharge > 0) gstResults.push(calculateGST(cateringCharge, 5, false, "Catering"));
  if (otherCharges > 0) gstResults.push(calculateGST(otherCharges, 18, true, "Other Services"));

  const gstAgg = aggregateGST(gstResults);
  const grandTotal = gstAgg.grandTotal;
  const balance = grandTotal - advanceAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!customerName || !customerPhone || !eventDate) {
      setError("Customer name, phone, and event date are required.");
      return;
    }
    if (status === "cancelled" && !cancellationNote.trim()) {
      setError("Cancellation note is required when status is Cancelled.");
      return;
    }

    setSaving(true);

    const gstBreakdown = gstResults.map((r) => ({
      item: r.slabLabel,
      taxable: r.baseAmount,
      rate: r.gstPercent,
      cgst: r.cgstAmount,
      sgst: r.sgstAmount,
      igst: 0,
    }));

    const updatedBooking: Partial<Booking> = {
      bookingDate: bookingDate || toISODateString(),
      eventDate,
      eventEndDate: eventEndDate || eventDate,
      eventType,
      status,
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: customerAddress,
      },
      eventDetails: {
        brideName,
        brideDOB: "",
        groomName,
        groomDOB: "",
      },
      venue: {
        hallId,
        roomsBooked,
        guestsCount,
      },
      charges: {
        roomRate,
        roomNights,
        roomTotal,
        hallCharge,
        decorationCharge,
        cateringCharge,
        otherCharges,
        subtotal,
        gstBreakdown,
        totalGST: gstAgg.totalGST,
        grandTotal,
      },
      payments: advanceAmount > 0
        ? [{ date: toISODateString(), amount: advanceAmount, method: advanceMethod, receipt: "" }]
        : [],
      advance: advanceAmount,
      balance,
      paymentStatus: advanceAmount >= grandTotal ? "paid" : advanceAmount > 0 ? "partial" : "unpaid",
      cancellationNote: status === "cancelled" ? cancellationNote.trim() : "",
      notes,
    };

    // Include invoiceDate if changed
    if (invoiceDate) {
      (updatedBooking as Record<string, unknown>).invoiceDate = invoiceDate;
    }

    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedBooking),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update booking");
        return;
      }

      router.push(`/dashboard/bookings/${id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/dashboard/bookings/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Booking</h1>
          <p className="text-muted-foreground">Update booking details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} type="tel" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} type="email" />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Event Type *</Label>
                <Select value={eventType} onChange={(e) => setEventType(e.target.value as EventType)}>
                  {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Event Date *</Label>
                <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={eventEndDate} onChange={(e) => setEventEndDate(e.target.value)} min={eventDate} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onChange={(e) => setStatus(e.target.value as BookingStatus)}>
                  <option value="inquiry">Inquiry</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Guests</Label>
                <Input type="number" min="1" value={guestsCount} onChange={(e) => setGuestsCount(Number(e.target.value))} />
              </div>
            </div>
            {(eventType === "Wedding" || eventType === "Engagement") && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Bride Name</Label>
                  <Input value={brideName} onChange={(e) => setBrideName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Groom Name</Label>
                  <Input value={groomName} onChange={(e) => setGroomName(e.target.value)} />
                </div>
              </div>
            )}
            {status === "cancelled" && (
              <div className="space-y-2">
                <Label>Cancellation Note *</Label>
                <Textarea
                  value={cancellationNote}
                  onChange={(e) => setCancellationNote(e.target.value)}
                  placeholder="Reason for cancellation"
                  rows={2}
                  required
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Venue Selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Hall</Label>
                <Select value={hallId} onChange={(e) => handleHallChange(e.target.value)}>
                  {hallOptions.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rooms Booked</Label>
                <Input type="number" min="0" max="18" value={roomsBooked} onChange={(e) => setRoomsBooked(Number(e.target.value))} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Charges Breakdown</CardTitle>
            <CardDescription>Enter charges — GST is auto-calculated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Room Rate (₹/night)</Label>
                <Input type="number" min="0" value={roomRate} onChange={(e) => setRoomRate(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Room Nights</Label>
                <Input type="number" min="0" value={roomNights} onChange={(e) => setRoomNights(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Room Total</Label>
                <Input type="text" value={formatCurrency(roomTotal)} readOnly className="bg-muted" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Hall Charge</Label>
                <Input type="number" min="0" value={hallCharge} onChange={(e) => setHallCharge(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Decoration</Label>
                <Input type="number" min="0" value={decorationCharge} onChange={(e) => setDecorationCharge(Number(e.target.value))} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Catering</Label>
                <Input type="number" min="0" value={cateringCharge} onChange={(e) => setCateringCharge(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Other Charges</Label>
                <Input type="number" min="0" value={otherCharges} onChange={(e) => setOtherCharges(Number(e.target.value))} />
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>CGST</span>
                <span>{formatCurrency(gstAgg.totalCGST)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>SGST</span>
                <span>{formatCurrency(gstAgg.totalSGST)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Total GST</span>
                <span>{formatCurrency(gstAgg.totalGST)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t pt-2">
                <span>Grand Total</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advance Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Advance Amount</Label>
                <Input type="number" min="0" value={advanceAmount} onChange={(e) => setAdvanceAmount(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={advanceMethod} onChange={(e) => setAdvanceMethod(e.target.value as PaymentMethod)}>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </Select>
              </div>
            </div>
            <div className="flex justify-between text-sm font-medium pt-2">
              <span>Balance Due</span>
              <span className={balance > 0 ? "text-red-600" : "text-green-600"}>
                {formatCurrency(balance)}
              </span>
            </div>
          </CardContent>
        </Card>

        {invoiceId && (
          <Card>
            <CardHeader>
              <CardTitle>Invoice</CardTitle>
              <CardDescription>Invoice {invoiceId} is linked to this booking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-xs">
                <Label>Invoice Date</Label>
                <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                <p className="text-xs text-muted-foreground">This date appears on the invoice and GST export</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." rows={3} />
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" className="bg-maroon-700 hover:bg-maroon-800" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Update Booking</>}
          </Button>
          <Button asChild variant="outline">
            <Link href={`/dashboard/bookings/${id}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
