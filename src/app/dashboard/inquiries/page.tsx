"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Search, MessageSquare, Phone, Clock, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useSortableData } from "@/lib/hooks/use-sortable-data";

interface InquiryEntry {
  id: string;
  name: string;
  phone: string;
  email: string;
  eventType: string;
  eventDate: string;
  status: string;
  source: string;
  createdAt: string;
  message: string;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  quoted: "bg-orange-100 text-orange-800",
  converted: "bg-green-100 text-green-800",
  lost: "bg-gray-100 text-gray-800",
};

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<InquiryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");

  useEffect(() => {
    fetch("/api/inquiries")
      .then((r) => r.json())
      .then((data) => setInquiries(data.inquiries || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, newStatus: string) {
    try {
      await fetch(`/api/inquiries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === id ? { ...inq, status: newStatus } : inq))
      );
    } catch { /* ignore */ }
  }

  const filtered = inquiries.filter((inq) => {
    if (statusFilter !== "all" && inq.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!inq.name.toLowerCase().includes(q) && !inq.phone.includes(q) && !inq.eventType.toLowerCase().includes(q)) return false;
    }
    if (dateFrom && inq.eventDate && inq.eventDate < dateFrom) return false;
    if (dateTo && inq.eventDate && inq.eventDate > dateTo) return false;
    return true;
  });

  const { sorted } = useSortableData(
    filtered as unknown as Record<string, unknown>[],
    sortBy,
    "desc"
  );
  const sortedInquiries = sorted as unknown as InquiryEntry[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inquiries & Leads</h1>
        <p className="text-muted-foreground">Manage website inquiries and follow-ups</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, phone, event..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="quoted">Quoted</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </Select>
        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-44">
          <option value="createdAt">Sort by Created</option>
          <option value="eventDate">Sort by Event Date</option>
          <option value="name">Sort by Name</option>
          <option value="status">Sort by Status</option>
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" title="Event date from" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" title="Event date to" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No inquiries found</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {search || statusFilter !== "all" ? "Try different filters" : "Inquiries from the website will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedInquiries.map((inq) => (
            <Card key={inq.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Link href={`/dashboard/inquiries/${inq.id}`} className="font-medium text-blue-700 hover:underline">{inq.name}</Link>
                      <Badge className={statusColors[inq.status] || ""}>{inq.status}</Badge>
                      <Badge variant="secondary">{inq.eventType}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {inq.phone}</span>
                      {inq.eventDate && (
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Event: {formatDate(inq.eventDate)}</span>
                      )}
                      <span>Source: {inq.source}</span>
                    </div>
                    {inq.message && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{inq.message}</p>
                    )}
                  </div>
                  <div className="flex gap-2 items-start">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/inquiries/${inq.id}`}>
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Link>
                    </Button>
                    <Select
                      value={inq.status}
                      onChange={(e) => updateStatus(inq.id, e.target.value)}
                      className="w-32 text-xs h-8"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="quoted">Quoted</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
