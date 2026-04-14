"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageIcon, X } from "lucide-react";
import type { GalleryItem, MediaCategory } from "@/types/media";

const categories: MediaCategory[] = [
  "Main Hall",
  "Outdoor Hall",
  "1st Floor Hall",
  "2nd Floor Hall",
  "3rd Floor Hall",
  "Rooms",
  "Kitchen",
  "Parking",
  "Events",
  "Other",
];

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/gallery")
      .then((r) => r.json())
      .then((data: GalleryItem[]) => {
        setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered =
    filter === "All" ? items : items.filter((i) => i.category === filter);

  return (
    <div className="py-12 lg:py-20">
      <div className="container mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-maroon-800">Our Gallery</h1>
          <p className="text-muted-foreground text-lg">
            Explore our venues, events, and the magic that happens at Mangalam.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant={filter === "All" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("All")}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={filter === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Gallery grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/3] rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <ImageIcon className="h-16 w-16 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">
              {items.length === 0
                ? "Gallery photos coming soon! Check back later."
                : "No photos in this category yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <button
                key={item.id}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-muted cursor-pointer"
                onClick={() => setLightbox(item)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.thumbnail || item.url}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-sm font-medium text-white">
                    {item.title}
                  </p>
                  <Badge
                    variant="secondary"
                    className="text-xs mt-1 bg-white/20 text-white border-0"
                  >
                    {item.category}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setLightbox(null)}
          >
            <X className="h-8 w-8" />
          </button>
          <div
            className="max-w-4xl max-h-[85vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.url}
              alt={lightbox.title}
              className="w-full h-auto max-h-[75vh] object-contain rounded-lg"
            />
            <div className="mt-3 text-center">
              <p className="text-white font-medium">{lightbox.title}</p>
              <p className="text-gray-400 text-sm">{lightbox.category}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
