"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Printer, PlusCircle, X, RefreshCcw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice } from "@/types/invoice";

const paymentColor: Record<string, string> = {
  unpaid: "bg-red-100 text-red-800",
  partial: "bg-orange-100 text-orange-800",
  paid: "bg-green-100 text-green-800",
};

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const searchParams = useSearchParams();
  const shouldAutoPrint = searchParams.get("download") === "1";
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoPrinted, setAutoPrinted] = useState(false);

  // Payment modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payRef, setPayRef] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setInvoice)
      .catch(() => setError("Invoice not found"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!shouldAutoPrint || autoPrinted || loading || !invoice) return;
    const timer = setTimeout(() => {
      window.print();
      setAutoPrinted(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [shouldAutoPrint, autoPrinted, loading, invoice]);

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    setPayError("");
    const amount = parseFloat(payAmount);
    if (!payDate || isNaN(amount) || amount <= 0) {
      setPayError("Please enter a valid date and amount.");
      return;
    }
    if (invoice && amount > invoice.balanceDue) {
      setPayError(`Amount cannot exceed balance due (${formatCurrency(invoice.balanceDue)}).`);
      return;
    }
    setPayLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: payDate, amount, method: payMethod, reference: payRef }),
      });
      if (!res.ok) {
        const data = await res.json();
        setPayError(data.error || "Failed to record payment.");
        return;
      }
      const updated = await res.json();
      setInvoice(updated);
      setShowPayModal(false);
      setPayAmount("");
      setPayRef("");
    } catch {
      setPayError("Network error. Please try again.");
    } finally {
      setPayLoading(false);
    }
  }

  async function handleSyncFromBooking() {
    setSyncing(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "syncFromBooking" }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to refresh invoice from booking.");
        return;
      }
      const updated = await res.json();
      setInvoice(updated);
    } catch {
      alert("Network error while refreshing invoice.");
    } finally {
      setSyncing(false);
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

  if (error || !invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error || "Invoice not found"}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/invoices">Back to Invoices</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions bar - hidden in print */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard/invoices"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{invoice.id}</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Booking: {invoice.bookingId}</span>
              <Badge className={paymentColor[invoice.paymentStatus]}>{invoice.paymentStatus}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSyncFromBooking} variant="outline" disabled={syncing}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Refreshing..." : "Refresh from Booking"}
          </Button>
          {invoice.balanceDue > 0 && (
            <Button onClick={() => { setShowPayModal(true); setPayAmount(String(invoice.balanceDue)); }} variant="default">
              <PlusCircle className="h-4 w-4 mr-2" /> Record Payment
            </Button>
          )}
          <Button onClick={() => window.print()} variant="outline">
            <Printer className="h-4 w-4 mr-2" /> Print Invoice
          </Button>
        </div>
      </div>

      {/* Invoice Document */}
      <Card className="max-w-4xl mx-auto print:shadow-none print:border-none">
        <CardContent className="p-8 print:p-2">
          {/* Header */}
          <div className="text-center border-b-2 border-black pb-4 mb-4 print:pb-1 print:mb-2">
            <h1 className="text-2xl font-bold">{invoice.invoiceType === "proforma" ? "PROFORMA INVOICE" : "TAX INVOICE"}</h1>
          </div>

          {/* Seller & Invoice Info */}
          <div className="grid grid-cols-2 gap-6 mb-6 print:gap-2 print:mb-2">
            <div>
              <h3 className="font-bold text-sm uppercase text-muted-foreground mb-1">From</h3>
              <p className="font-bold text-lg">{invoice.seller.name}</p>
              <p className="text-sm">{invoice.seller.address}</p>
              <p className="text-sm">Phone: {invoice.seller.phone}</p>
              <p className="text-sm font-medium">GSTIN: {invoice.seller.gstin}</p>
              <p className="text-sm">State: {invoice.seller.state} ({invoice.seller.stateCode})</p>
            </div>
            <div className="text-right">
              <div className="grid grid-cols-2 gap-1 text-sm">
                <span className="text-right text-muted-foreground">Invoice No:</span>
                <span className="font-bold">{invoice.id}</span>
                <span className="text-right text-muted-foreground">Date:</span>
                <span>{formatDate(invoice.invoiceDate)}</span>
                <span className="text-right text-muted-foreground">Booked For:</span>
                <span>{invoice.bookedForDate ? formatDate(invoice.bookedForDate) : "—"}</span>
                <span className="text-right text-muted-foreground">Booking Ref:</span>
                <span>{invoice.bookingId}</span>
                <span className="text-right text-muted-foreground">Place of Supply:</span>
                <span>{invoice.placeOfSupply}</span>
              </div>
            </div>
          </div>

          {/* Buyer */}
          <div className="border rounded p-3 mb-6 bg-muted/30 print:p-1 print:mb-2">
            <h3 className="font-bold text-sm uppercase text-muted-foreground mb-1">Bill To</h3>
            <p className="font-bold">{invoice.buyer.name}</p>
            <div className="text-sm space-y-0.5">
              {invoice.buyer.address && <p>{invoice.buyer.address}</p>}
              <p>Phone: {invoice.buyer.phone}</p>
              {invoice.buyer.email && <p>Email: {invoice.buyer.email}</p>}
              {invoice.buyer.gstin && <p>GSTIN: {invoice.buyer.gstin}</p>}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-6 overflow-x-auto print:mb-2">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left w-8">#</th>
                  <th className="border p-2 text-left">Description</th>
                  <th className="border p-2 text-center w-16">SAC</th>
                  <th className="border p-2 text-right w-16">Qty</th>
                  <th className="border p-2 text-right w-20">Rate</th>
                  <th className="border p-2 text-right w-24">Amount</th>
                  <th className="border p-2 text-center w-16">GST%</th>
                  <th className="border p-2 text-right w-20">CGST</th>
                  <th className="border p-2 text-right w-20">SGST</th>
                  <th className="border p-2 text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item) => (
                  <tr key={item.sno}>
                    <td className="border p-2">{item.sno}</td>
                    <td className="border p-2">{item.description}</td>
                    <td className="border p-2 text-center">{item.sacCode}</td>
                    <td className="border p-2 text-right">{item.qty}</td>
                    <td className="border p-2 text-right">{formatCurrency(item.rate)}</td>
                    <td className="border p-2 text-right">{formatCurrency(item.amount)}</td>
                    <td className="border p-2 text-center">{item.gstRate}%</td>
                    <td className="border p-2 text-right">{formatCurrency(item.cgst)}</td>
                    <td className="border p-2 text-right">{formatCurrency(item.sgst)}</td>
                    <td className="border p-2 text-right font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* GST Summary */}
          {invoice.gstSummary.length > 0 && (
            <div className="mb-6 print:mb-2">
              <h4 className="font-bold text-sm mb-2">GST Summary</h4>
              <table className="w-full text-sm border-collapse max-w-lg">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">GST Rate</th>
                    <th className="border p-2 text-right">Taxable Value</th>
                    <th className="border p-2 text-right">CGST</th>
                    <th className="border p-2 text-right">SGST</th>
                    <th className="border p-2 text-right">Total Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.gstSummary.map((row) => (
                    <tr key={row.rate}>
                      <td className="border p-2">{row.rate}%</td>
                      <td className="border p-2 text-right">{formatCurrency(row.taxableValue)}</td>
                      <td className="border p-2 text-right">{formatCurrency(row.cgst)}</td>
                      <td className="border p-2 text-right">{formatCurrency(row.sgst)}</td>
                      <td className="border p-2 text-right">{formatCurrency(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="flex justify-end mb-6 print:mb-2">
            <div className="w-72 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.summary.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST:</span>
                <span>{formatCurrency(invoice.summary.totalCGST)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST:</span>
                <span>{formatCurrency(invoice.summary.totalSGST)}</span>
              </div>
              {invoice.summary.roundOff !== 0 && (
                <div className="flex justify-between">
                  <span>Round Off:</span>
                  <span>{invoice.summary.roundOff > 0 ? "+" : ""}{invoice.summary.roundOff.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-1">
                <span>Grand Total:</span>
                <span>{formatCurrency(invoice.summary.grandTotalRounded)}</span>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="border-t border-b py-2 mb-6 print:py-1 print:mb-2">
            <p className="text-sm"><span className="font-medium">Amount in Words:</span> {invoice.summary.amountInWords}</p>
          </div>

          {/* Payment Info */}
          {invoice.payments.length > 0 && (
            <div className="mb-6 print:mb-2">
              <h4 className="font-bold text-sm mb-2">Payment Details</h4>
              <table className="w-full text-sm border-collapse max-w-lg">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Date</th>
                    <th className="border p-2 text-left">Method</th>
                    <th className="border p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((p, i) => (
                    <tr key={i}>
                      <td className="border p-2">{formatDate(p.date)}</td>
                      <td className="border p-2 capitalize">{p.method}</td>
                      <td className="border p-2 text-right">{formatCurrency(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between mt-2 text-sm font-medium max-w-lg">
                <span>Paid: {formatCurrency(invoice.totalPaid)}</span>
                <span className={invoice.balanceDue > 0 ? "text-red-600" : "text-green-600"}>
                  Balance Due: {formatCurrency(invoice.balanceDue)}
                </span>
              </div>
            </div>
          )}

          {/* Terms */}
          {invoice.termsAndConditions && (
            <div className="border-t pt-4 mb-6 print:pt-2 print:mb-2">
              <h4 className="font-bold text-sm mb-1">Terms & Conditions</h4>
              <p className="text-xs text-muted-foreground whitespace-pre-line">{invoice.termsAndConditions}</p>
            </div>
          )}

          {/* Signature */}
          <div className="flex justify-between items-end mt-12 print:mt-4">
            <div>
              <p className="text-xs text-muted-foreground">Customer Signature</p>
              <div className="border-t border-black w-40 mt-10 print:mt-5"></div>
            </div>
            <div className="text-right">
              <p className="font-medium text-sm">For {invoice.seller.name}</p>
              <div className="border-t border-black w-40 mt-10 print:mt-5 ml-auto"></div>
              <p className="text-xs text-muted-foreground mt-1">Authorized Signatory</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Record Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:hidden">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Record Payment</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowPayModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mb-4 p-3 rounded bg-muted text-sm flex justify-between">
              <span>Balance Due:</span>
              <span className="font-bold text-red-600">{formatCurrency(invoice.balanceDue)}</span>
            </div>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="pay-date">Payment Date</Label>
                <Input id="pay-date" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pay-amount">Amount (₹)</Label>
                <Input id="pay-amount" type="number" min="1" step="0.01" placeholder="Enter amount" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pay-method">Payment Method</Label>
                <Select id="pay-method" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="pay-ref">Reference / Receipt No. <span className="text-muted-foreground">(optional)</span></Label>
                <Input id="pay-ref" placeholder="e.g. UPI Ref, Cheque No." value={payRef} onChange={(e) => setPayRef(e.target.value)} />
              </div>
              {payError && <p className="text-sm text-red-600">{payError}</p>}
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setShowPayModal(false)}>Cancel</Button>
                <Button type="submit" disabled={payLoading}>{payLoading ? "Saving…" : "Record Payment"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
