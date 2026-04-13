"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Search, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

interface InvoiceEntry {
  id: string;
  bookingId: string;
  bookedForDate?: string;
  invoiceDate: string;
  invoiceType: string;
  customerName: string;
  grandTotal: number;
  totalPaid: number;
  balanceDue: number;
  paymentStatus: string;
}

const paymentColor: Record<string, string> = {
  unpaid: "bg-red-100 text-red-800",
  partial: "bg-orange-100 text-orange-800",
  paid: "bg-green-100 text-green-800",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/invoices")
      .then((r) => r.json())
      .then((data) => setInvoices(data.invoices || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = invoices.filter((inv) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return inv.id.toLowerCase().includes(q) || inv.customerName.toLowerCase().includes(q) || inv.bookingId.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground">GST-compliant invoicing & billing</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by invoice #, customer, booking..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No invoices yet</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Generate invoices from the booking detail page
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Booked For</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Booking</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-right">Paid</th>
                    <th className="p-3 text-right">Balance</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="border-b hover:bg-muted/30">
                      <td className="p-3">
                        <Link href={`/dashboard/invoices/${inv.id.replaceAll("/", "-")}`} className="text-blue-600 hover:underline font-medium">
                          {inv.id}
                        </Link>
                      </td>
                      <td className="p-3">{formatDate(inv.invoiceDate)}</td>
                      <td className="p-3">{inv.bookedForDate ? formatDate(inv.bookedForDate) : "—"}</td>
                      <td className="p-3">{inv.customerName}</td>
                      <td className="p-3">
                        <Link href={`/dashboard/bookings/${inv.bookingId}`} className="text-blue-600 hover:underline">
                          {inv.bookingId}
                        </Link>
                      </td>
                      <td className="p-3 text-right font-medium">{formatCurrency(inv.grandTotal)}</td>
                      <td className="p-3 text-right">{formatCurrency(inv.totalPaid)}</td>
                      <td className="p-3 text-right">{formatCurrency(inv.balanceDue)}</td>
                      <td className="p-3">
                        <Badge className={paymentColor[inv.paymentStatus] || ""}>{inv.paymentStatus}</Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/dashboard/invoices/${inv.id.replaceAll("/", "-")}?download=1`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
