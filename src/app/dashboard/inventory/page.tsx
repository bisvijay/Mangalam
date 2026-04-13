"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Search, Package, AlertTriangle, X, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useSortableData } from "@/lib/hooks/use-sortable-data";

interface InventoryEntry {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  isLowStock: boolean;
  location: string;
  lastUpdated: string;
  notes: string;
}

const categories = ["All", "Kitchen", "Decoration", "Linen", "Cleaning", "Electrical", "Furniture", "Stationery", "Other"];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New item form
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Kitchen");
  const [newQuantity, setNewQuantity] = useState(0);
  const [newUnit, setNewUnit] = useState("pcs");
  const [newMinStock, setNewMinStock] = useState(10);
  const [newLocation, setNewLocation] = useState("");
  const [newNotes, setNewNotes] = useState("");

  function loadItems() {
    fetch("/api/inventory")
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadItems(); }, []);

  const filtered = items.filter((item) => {
    if (category !== "All" && item.category !== category) return false;
    if (showLowOnly && !item.isLowStock) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const { sorted: sortedItems, requestSort, getSortIndicator } = useSortableData(
    filtered as unknown as Record<string, unknown>[],
    "name",
    "asc"
  );
  const sortedInventory = sortedItems as unknown as InventoryEntry[];

  const lowStockCount = items.filter((i) => i.isLowStock).length;

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setNewName("");
    setNewCategory("Kitchen");
    setNewQuantity(0);
    setNewUnit("pcs");
    setNewMinStock(10);
    setNewLocation("");
    setNewNotes("");
  }

  function startEdit(item: InventoryEntry) {
    setEditingId(item.id);
    setShowForm(true);
    setNewName(item.name);
    setNewCategory(item.category);
    setNewQuantity(item.quantity);
    setNewUnit(item.unit);
    setNewMinStock(item.minStock);
    setNewLocation(item.location || "");
    setNewNotes(item.notes || "");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this inventory item?")) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Failed to delete item");
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      alert("Failed to delete item");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/inventory/${editingId}` : "/api/inventory";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          category: newCategory,
          quantity: newQuantity,
          unit: newUnit,
          minStock: newMinStock,
          location: newLocation,
          notes: newNotes,
        }),
      });
      if (res.ok) {
        resetForm();
        loadItems();
      }
    } catch { /* ignore */ }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Track stock and supplies</p>
        </div>
        <div className="flex gap-2">
          {lowStockCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {lowStockCount} Low Stock
            </Badge>
          )}
          <Button className="bg-maroon-700 hover:bg-maroon-800" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      {/* Add Item Form */}
      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editingId ? "Edit Item" : "Add New Item"}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                  {categories.filter((c) => c !== "All").map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" min="0" value={newQuantity} onChange={(e) => setNewQuantity(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="pcs, kg, L" />
              </div>
              <div className="space-y-2">
                <Label>Min Stock</Label>
                <Input type="number" min="0" value={newMinStock} onChange={(e) => setNewMinStock(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Store room / shelf" />
              </div>
              <div className="space-y-2 sm:col-span-3">
                <Label>Notes</Label>
                <Input value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Optional notes" />
              </div>
              <div className="sm:col-span-3">
                <Button type="submit" disabled={saving} className="bg-maroon-700 hover:bg-maroon-800">
                  {saving ? "Saving..." : editingId ? "Update Item" : "Add Item"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-40">
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Button variant={showLowOnly ? "default" : "outline"} onClick={() => setShowLowOnly(!showLowOnly)} size="sm">
          <AlertTriangle className="h-4 w-4 mr-1" /> Low Stock
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No items found</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {search || category !== "All" ? "Try different filters" : "Add inventory items to get started"}
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
                    <th className="p-3 cursor-pointer select-none" onClick={() => requestSort("name")}>Item{getSortIndicator("name")}</th>
                    <th className="p-3 cursor-pointer select-none" onClick={() => requestSort("category")}>Category{getSortIndicator("category")}</th>
                    <th className="p-3 text-right cursor-pointer select-none" onClick={() => requestSort("quantity")}>Qty{getSortIndicator("quantity")}</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3 text-right cursor-pointer select-none" onClick={() => requestSort("minStock")}>Min Stock{getSortIndicator("minStock")}</th>
                    <th className="p-3 cursor-pointer select-none" onClick={() => requestSort("lastUpdated")}>Updated{getSortIndicator("lastUpdated")}</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedInventory.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{item.name}</td>
                      <td className="p-3">{item.category}</td>
                      <td className="p-3 text-right">{item.quantity}</td>
                      <td className="p-3">{item.unit}</td>
                      <td className="p-3 text-right">{item.minStock}</td>
                      <td className="p-3">{item.lastUpdated ? formatDate(item.lastUpdated) : "—"}</td>
                      <td className="p-3">
                        {item.isLowStock ? (
                          <Badge variant="destructive" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" /> Low</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 text-xs">OK</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(item)}>
                            <Pencil className="h-3 w-3 mr-1" /> Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                          </Button>
                        </div>
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
