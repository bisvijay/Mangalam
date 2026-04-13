"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarDays, Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface EventEntry {
  id: string;
  name: string;
  date: string;
  details?: string;
  visible: boolean;
}

export default function EventsAdminPage() {
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadEvents() {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data.events || []);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { loadEvents(); }, []);

  function resetForm() {
    setShowForm(false);
    setEditId(null);
    setName("");
    setDate("");
    setDetails("");
  }

  function startEdit(evt: EventEntry) {
    setEditId(evt.id);
    setName(evt.name);
    setDate(evt.date);
    setDetails(evt.details || "");
    setShowForm(true);
  }

  async function handleSave() {
    if (!name.trim() || !date.trim()) return;
    setSaving(true);

    const body = { name: name.trim(), date, details: details.trim() };

    try {
      if (editId) {
        await fetch(`/api/events/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      resetForm();
      await loadEvents();
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function toggleVisibility(evt: EventEntry) {
    await fetch(`/api/events/${evt.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: !evt.visible }),
    });
    await loadEvents();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    await loadEvents();
  }

  // Sort by date descending
  const sorted = [...events].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Public Events</h1>
          <p className="text-muted-foreground">Manage events shown on the public website</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-maroon-700 hover:bg-maroon-800">
          <Plus className="h-4 w-4 mr-2" /> Add Event
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="border-maroon-200">
          <CardHeader>
            <CardTitle className="text-base">{editId ? "Edit Event" : "New Event"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="evt-name">Event Name *</Label>
                <Input id="evt-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Holi Celebration" />
              </div>
              <div>
                <Label htmlFor="evt-date">Event Date *</Label>
                <Input id="evt-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="evt-details">Details</Label>
              <Textarea id="evt-details" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Describe the event — timings, highlights, entry info..." rows={4} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving || !name.trim() || !date.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {editId ? "Update Event" : "Create Event"}
              </Button>
              <Button variant="ghost" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No events yet</h3>
            <p className="text-muted-foreground text-sm mt-1">Add a public event to display on the website.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((evt) => (
            <Card key={evt.id} className={!evt.visible ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{evt.name}</span>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> {formatDate(evt.date)}
                      </Badge>
                      {!evt.visible && <Badge variant="outline">Hidden</Badge>}
                    </div>
                    {evt.details && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{evt.details}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0 ml-4">
                    <Button variant="ghost" size="icon" title={evt.visible ? "Hide" : "Show"} onClick={() => toggleVisibility(evt)}>
                      {evt.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" title="Edit" onClick={() => startEdit(evt)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(evt.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
