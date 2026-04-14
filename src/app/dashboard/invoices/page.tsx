"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Search, FileText, Download, FileSpreadsheet } from "lucide-react";
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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch("/api/invoices")
      .then((r) => r.json())
      .then((data) => setInvoices(data.invoices || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = invoices.filter((inv) => {
    // Search filter
    if (search) {
      const q = search.toLowerCase();
      const matchesSearch = inv.id.toLowerCase().includes(q) || 
        inv.customerName.toLowerCase().includes(q) || 
        inv.bookingId.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    // Date filters
    if (dateFrom && inv.invoiceDate < dateFrom) return false;
    if (dateTo && inv.invoiceDate > dateTo) return false;
    // Status filter
    if (statusFilter !== "all" && inv.paymentStatus !== statusFilter) return false;
    return true;
  });

  const handleGstExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const response = await fetch(`/api/invoices/gst-export?${params.toString()}`);
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Mangalam_GST_Returns.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error("GST export error:", err);
      alert("Failed to export GST data");
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setStatusFilter("all");
  };

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

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">From Date</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">To Date</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
        {(search || dateFrom || dateTo || statusFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
        <div className="flex-1" />
        {/* GST Export Button */}
        <Button
          variant="outline"
          disabled={exporting}
          onClick={() => handleGstExport()}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          {exporting ? "Exporting..." : "Export GST (Excel)"}
        </Button>
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
