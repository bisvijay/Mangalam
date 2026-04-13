"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Plus, Search, Pencil } from "lucide-react";
import { Select } from "@/components/ui/select";
import type { BookingIndexEntry, BookingStatus, PaymentStatus } from "@/types/booking";
import { formatCurrency } from "@/lib/utils";
import { useSortableData } from "@/lib/hooks/use-sortable-data";

const statusColors: Record<BookingStatus, string> = {
  inquiry: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  "in-progress": "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const paymentColors: Record<PaymentStatus, string> = {
  unpaid: "bg-red-100 text-red-800",
  partial: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((data: BookingIndexEntry[]) => {
        setBookings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      !search ||
      b.customerName.toLowerCase().includes(search.toLowerCase()) ||
      b.customerPhone.includes(search) ||
      b.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || b.status === statusFilter;
    const matchesPayment = !paymentFilter || b.paymentStatus === paymentFilter;
    const matchesDateFrom = !dateFrom || b.eventDate >= dateFrom;
    const matchesDateTo = !dateTo || b.eventDate <= dateTo;
    return matchesSearch && matchesStatus && matchesPayment && matchesDateFrom && matchesDateTo;
  });

  const { sorted, requestSort, getSortIndicator } = useSortableData(
    filtered as unknown as Record<string, unknown>[],
    "eventDate",
    "desc"
  );
  const sortedBookings = sorted as unknown as BookingIndexEntry[];

  async function handleCancelBooking(id: string) {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    const cancellationNote = prompt("Enter cancellation reason/note:", "")?.trim() || "";
    if (!cancellationNote) {
      alert("Cancellation note is required.");
      return;
    }
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", cancellationNote }),
      });
      if (!res.ok) {
        alert("Failed to cancel booking");
        return;
      }
      setBookings((prev) => prev.map((booking) => (booking.id === id ? { ...booking, status: "cancelled" } : booking)));
    } catch {
      alert("Failed to cancel booking");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">
            Manage all event bookings
          </p>
        </div>
        <Button asChild className="bg-maroon-700 hover:bg-maroon-800">
          <Link href="/dashboard/bookings/new">
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48"
        >
          <option value="">All Statuses</option>
          <option value="inquiry">Inquiry</option>
          <option value="confirmed">Confirmed</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <Select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="w-full sm:w-48"
        >
          <option value="">All Payments</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial (Follow-up)</option>
          <option value="paid">Paid</option>
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full sm:w-40" placeholder="From" title="Event date from" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full sm:w-40" placeholder="To" title="Event date to" />
      </div>

      {/* Bookings table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {bookings.length === 0
                ? "No bookings yet. Create your first booking!"
                : "No bookings match your search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium cursor-pointer select-none" onClick={() => requestSort("id")}>ID{getSortIndicator("id")}</th>
                  <th className="text-left p-3 font-medium cursor-pointer select-none" onClick={() => requestSort("customerName")}>Customer{getSortIndicator("customerName")}</th>
                  <th className="text-left p-3 font-medium cursor-pointer select-none" onClick={() => requestSort("eventType")}>Event{getSortIndicator("eventType")}</th>
                  <th className="text-left p-3 font-medium cursor-pointer select-none" onClick={() => requestSort("eventDate")}>Date{getSortIndicator("eventDate")}</th>
                  <th className="text-left p-3 font-medium cursor-pointer select-none" onClick={() => requestSort("status")}>Status{getSortIndicator("status")}</th>
                  <th className="text-right p-3 font-medium cursor-pointer select-none" onClick={() => requestSort("grandTotal")}>Amount{getSortIndicator("grandTotal")}</th>
                  <th className="text-right p-3 font-medium cursor-pointer select-none" onClick={() => requestSort("totalPaid")}>Paid{getSortIndicator("totalPaid")}</th>
                  <th className="text-right p-3 font-medium cursor-pointer select-none" onClick={() => requestSort("balanceDue")}>Balance{getSortIndicator("balanceDue")}</th>
                  <th className="text-left p-3 font-medium cursor-pointer select-none" onClick={() => requestSort("paymentStatus")}>Payment{getSortIndicator("paymentStatus")}</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedBookings.map((b) => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{b.id}</td>
                    <td className="p-3">
                      <div className="font-medium">{b.customerName}</div>
                      <div className="text-xs text-muted-foreground">{b.customerPhone}</div>
                    </td>
                    <td className="p-3">{b.eventType}</td>
                    <td className="p-3">
                      {new Date(b.eventDate + "T00:00:00").toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-3">
                      <Badge className={statusColors[b.status]}>{b.status}</Badge>
                    </td>
                    <td className="p-3 text-right font-medium">
                      {formatCurrency(b.grandTotal)}
                    </td>
                    <td className="p-3 text-right text-green-700 font-medium">
                      {formatCurrency(b.totalPaid ?? 0)}
                    </td>
                    <td className="p-3 text-right font-medium">
                      <span className={b.balanceDue > 0 ? "text-red-600 font-semibold" : "text-green-600"}>
                        {formatCurrency(b.balanceDue ?? 0)}
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge className={paymentColors[b.paymentStatus]}>
                        {b.paymentStatus}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/bookings/${b.id}`}>View</Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/bookings/${b.id}/edit`}><Pencil className="h-3 w-3 mr-1" />Edit</Link>
                        </Button>
                        {b.status !== "cancelled" && (
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleCancelBooking(b.id)}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
