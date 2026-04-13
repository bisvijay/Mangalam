"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Search, Users, Phone, Mail, Pencil, Briefcase } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Select } from "@/components/ui/select";
import { useSortableData } from "@/lib/hooks/use-sortable-data";

interface CustomerEntry {
  id: string;
  name: string;
  phone: string;
  email: string;
  profession?: string;
  bookingCount: number;
  totalSpent: number;
  tags: string[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((data) => setCustomers(Array.isArray(data) ? data : data.customers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.profession?.toLowerCase().includes(search.toLowerCase())
  );

  const { sorted } = useSortableData(
    filtered as unknown as Record<string, unknown>[],
    sortBy,
    sortBy === "name" ? "asc" : "desc"
  );
  const sortedCustomers = sorted as unknown as CustomerEntry[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <Button className="bg-maroon-700 hover:bg-maroon-800" asChild>
          <Link href="/dashboard/customers/new"><Plus className="h-4 w-4 mr-2" /> Add Customer</Link>
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, phone, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-48">
          <option value="name">Sort by Name</option>
          <option value="bookingCount">Sort by Bookings</option>
          <option value="totalSpent">Sort by Total Spent</option>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No customers found</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {search ? "Try a different search term" : "Customers are auto-created with bookings"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedCustomers.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <span className="text-xs text-muted-foreground">{c.id}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" /> {c.phone}
                </div>
                {c.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" /> {c.email}
                  </div>
                )}
                {c.profession && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="h-3 w-3" /> {c.profession}
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t text-sm">
                  <span>{c.bookingCount} booking{c.bookingCount !== 1 ? "s" : ""}</span>
                  <span className="font-medium">{formatCurrency(c.totalSpent)}</span>
                </div>
                {c.tags && c.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {c.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                )}
                <div className="pt-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/customers/${c.id}/edit`}>
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
