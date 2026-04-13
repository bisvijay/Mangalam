"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Save, Loader2 } from "lucide-react";
import type { WebsiteContent } from "@/types/website";

interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  footerText: string;
}

export default function WebsitePage() {
  const [content, setContent] = useState<SiteContent>({
    heroTitle: "Mangalam Banquet & Hotel",
    heroSubtitle: "Where Celebrations Come Alive",
    aboutText: "",
    contactPhone: "83839 81280",
    contactEmail: "",
    contactAddress: "Ward No 37, Bettiah, West Champaran, Bihar",
    footerText: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [existingContent, setExistingContent] = useState<WebsiteContent | null>(null);

  useEffect(() => {
    fetch("/api/public/content")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setExistingContent(data);
          setContent((prev) => ({ ...prev, ...data }));
          setContent((prev) => ({
            ...prev,
            heroTitle: data.hero?.title ?? prev.heroTitle,
            heroSubtitle: data.hero?.subtitle ?? prev.heroSubtitle,
            aboutText: data.about ?? prev.aboutText,
            contactPhone: data.contactInfo?.phone ?? prev.contactPhone,
            contactEmail: data.contactInfo?.email ?? prev.contactEmail,
            contactAddress: data.contactInfo?.address ?? prev.contactAddress,
            footerText: data.footerText ?? prev.footerText,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const payload: Partial<WebsiteContent> = {
        hero: {
          title: content.heroTitle,
          subtitle: content.heroSubtitle,
          backgroundImage: existingContent?.hero?.backgroundImage ?? "",
        },
        about: content.aboutText,
        amenities: existingContent?.amenities ?? [],
        eventTypes: existingContent?.eventTypes ?? [],
        testimonials: existingContent?.testimonials ?? [],
        contactInfo: {
          phone: content.contactPhone,
          email: content.contactEmail,
          address: content.contactAddress,
          googleMapsEmbed: existingContent?.contactInfo?.googleMapsEmbed ?? "",
        },
        footerText: content.footerText,
      };

      const res = await fetch("/api/public/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save website content");
      }

      const data = await res.json();
      setExistingContent(data.content);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save website content");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Website Content</h1>
        <p className="text-muted-foreground">Manage your public website content</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
            <CardDescription>Main heading on the landing page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={content.heroTitle} onChange={(e) => setContent({ ...content, heroTitle: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input value={content.heroSubtitle} onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About Section</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>About Text</Label>
              <Textarea value={content.aboutText} onChange={(e) => setContent({ ...content, aboutText: e.target.value })} rows={5} placeholder="Write about your venue..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={content.contactPhone} onChange={(e) => setContent({ ...content, contactPhone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={content.contactEmail} onChange={(e) => setContent({ ...content, contactEmail: e.target.value })} type="email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea value={content.contactAddress} onChange={(e) => setContent({ ...content, contactAddress: e.target.value })} rows={2} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Footer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Footer Text</Label>
              <Input value={content.footerText} onChange={(e) => setContent({ ...content, footerText: e.target.value })} placeholder="© 2025 Mangalam..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" className="bg-maroon-700 hover:bg-maroon-800" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
          </Button>
          {saved && <span className="text-sm text-green-600">Changes saved!</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>
    </div>
  );
}
