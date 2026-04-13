"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Calendar, MapPin, Users, Phone, Mail, CreditCard, FileText, Loader2, Receipt, Pencil, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Booking } from "@/types/booking";

const statusColor: Record<string, string> = {
  inquiry: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  "in-progress": "bg-yellow-100 text-yellow-800",
  completed: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
};

const paymentColor: Record<string, string> = {
  unpaid: "bg-red-100 text-red-800",
  partial: "bg-orange-100 text-orange-800",
  paid: "bg-green-100 text-green-800",
};

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function handleGenerateInvoice() {
    if (!booking) return;
    setGeneratingInvoice(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      if (res.ok) {
        const data = await res.json();
        const invoiceFileId = data.id.replace(/\//g, "-");
        router.push(`/dashboard/invoices/${invoiceFileId}`);
      }
    } catch { /* ignore */ }
    setGeneratingInvoice(false);
  }

  async function handleCancelBooking() {
    if (!booking || booking.status === "cancelled") return;
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    const cancellationNote = prompt("Enter cancellation reason/note:", booking.cancellationNote || "")?.trim() || "";
    if (!cancellationNote) {
      alert("Cancellation note is required.");
      return;
    }

    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", cancellationNote }),
      });
      if (!res.ok) {
        alert("Failed to cancel booking");
        return;
      }
      setBooking({ ...booking, status: "cancelled", cancellationNote });
    } catch {
      alert("Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  }

  useEffect(() => {
    fetch(`/api/bookings/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setBooking)
      .catch(() => setError("Booking not found"))
      .finally(() => setLoading(false));
  }, [id]);

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

  if (error || !booking) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error || "Booking not found"}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/bookings">Back to Bookings</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard/bookings"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Booking {booking.id}</h1>
              <Badge className={statusColor[booking.status]}>{booking.status}</Badge>
              <Badge className={paymentColor[booking.paymentStatus]}>{booking.paymentStatus}</Badge>
            </div>
            <p className="text-muted-foreground">Created on {formatDate(booking.bookingDate)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/bookings/${booking.id}/edit`}><Pencil className="h-4 w-4 mr-2" /> Edit</Link>
          </Button>
          {booking.status !== "cancelled" && (
            <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={handleCancelBooking} disabled={cancelling}>
              {cancelling ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Cancelling...</> : "Cancel Booking"}
            </Button>
          )}
          {booking.invoiceId ? (
            <>
              <Button asChild className="bg-maroon-700 hover:bg-maroon-800">
                <Link href={`/dashboard/invoices/${booking.invoiceId.replace(/\//g, "-")}`}>
                  <Receipt className="h-4 w-4 mr-2" /> View Invoice
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link
                  href={`/dashboard/invoices/${booking.invoiceId.replace(/\//g, "-")}?download=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4 mr-2" /> Download
                </Link>
              </Button>
            </>
          ) : (
            <Button onClick={handleGenerateInvoice} disabled={generatingInvoice} className="bg-maroon-700 hover:bg-maroon-800">
              {generatingInvoice ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</> : <><Receipt className="h-4 w-4 mr-2" /> Generate Invoice</>}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-lg">{booking.customer.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" /> {booking.customer.phone}
            </div>
            {booking.customer.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" /> {booking.customer.email}
              </div>
            )}
            {booking.customer.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" /> {booking.customer.address}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">{booking.eventType}</span>
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{formatDate(booking.eventDate)}</span>
              {booking.eventEndDate && booking.eventEndDate !== booking.eventDate && (
                <>
                  <span className="text-muted-foreground">End Date:</span>
                  <span className="font-medium">{formatDate(booking.eventEndDate)}</span>
                </>
              )}
              <span className="text-muted-foreground">Guests:</span>
              <span className="font-medium">{booking.venue.guestsCount}</span>
            </div>
            {booking.eventDetails?.brideName && (
              <div className="border-t pt-2 text-sm space-y-1">
                <p><span className="text-muted-foreground">Bride:</span> {booking.eventDetails.brideName}</p>
                <p><span className="text-muted-foreground">Groom:</span> {booking.eventDetails.groomName}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Venue Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Venue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Hall:</span>
              <span className="font-medium">{booking.venue.hallId}</span>
              <span className="text-muted-foreground">Rooms:</span>
              <span className="font-medium">{booking.venue.roomsBooked}</span>
            </div>
          </CardContent>
        </Card>

        {/* Charges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Charges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {booking.charges.roomTotal > 0 && (
              <div className="flex justify-between">
                <span>Rooms ({booking.charges.roomNights} night × {booking.venue.roomsBooked} rooms @ {formatCurrency(booking.charges.roomRate)})</span>
                <span>{formatCurrency(booking.charges.roomTotal)}</span>
              </div>
            )}
            {booking.charges.hallCharge > 0 && (
              <div className="flex justify-between">
                <span>Hall</span>
                <span>{formatCurrency(booking.charges.hallCharge)}</span>
              </div>
            )}
            {booking.charges.decorationCharge > 0 && (
              <div className="flex justify-between">
                <span>Decoration</span>
                <span>{formatCurrency(booking.charges.decorationCharge)}</span>
              </div>
            )}
            {booking.charges.cateringCharge > 0 && (
              <div className="flex justify-between">
                <span>Catering</span>
                <span>{formatCurrency(booking.charges.cateringCharge)}</span>
              </div>
            )}
            {booking.charges.otherCharges > 0 && (
              <div className="flex justify-between">
                <span>Other</span>
                <span>{formatCurrency(booking.charges.otherCharges)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(booking.charges.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST</span>
              <span>{formatCurrency(booking.charges.totalGST)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-base">
              <span>Grand Total</span>
              <span>{formatCurrency(booking.charges.grandTotal)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {booking.payments && booking.payments.length > 0 ? (
            <div className="space-y-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Method</th>
                    <th className="pb-2 text-right">Amount</th>
                    <th className="pb-2">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.payments.map((p, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{formatDate(p.date)}</td>
                      <td className="py-2 capitalize">{p.method}</td>
                      <td className="py-2 text-right">{formatCurrency(p.amount)}</td>
                      <td className="py-2">{p.receipt || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between border-t pt-2 font-medium">
                <span>Total Paid: {formatCurrency(booking.advance)}</span>
                <span className={booking.balance > 0 ? "text-red-600" : "text-green-600"}>
                  Balance: {formatCurrency(booking.balance)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No payments recorded.</p>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {booking.notes && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{booking.notes}</p></CardContent>
        </Card>
      )}

      {booking.status === "cancelled" && booking.cancellationNote && (
        <Card>
          <CardHeader><CardTitle>Cancellation Note</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap text-red-700">{booking.cancellationNote}</p></CardContent>
        </Card>
      )}
    </div>
  );
}
