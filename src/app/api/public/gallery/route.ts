import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import type { GalleryItem, MediaCategory } from "@/types/media";

const GALLERY_DIR = path.join(process.cwd(), "public", "images", "gallery");
const VALID_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

const CATEGORIES: MediaCategory[] = [
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

export async function GET() {
  const items: GalleryItem[] = [];
  let idCounter = 1;

  try {
    // Scan each category folder
    for (const category of CATEGORIES) {
      const categoryPath = path.join(GALLERY_DIR, category);
      
      try {
        const files = await fs.readdir(categoryPath);
        
        for (const file of files) {
          const ext = path.extname(file).toLowerCase();
          if (!VALID_EXTENSIONS.includes(ext)) continue;
          
          const fileName = path.basename(file, ext);
          // Convert filename to title (replace underscores/hyphens with spaces, capitalize)
          const title = fileName
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          
          items.push({
            id: `gallery-${idCounter++}`,
            type: "photo",
            url: `/images/gallery/${encodeURIComponent(category)}/${encodeURIComponent(file)}`,
            thumbnail: `/images/gallery/${encodeURIComponent(category)}/${encodeURIComponent(file)}`,
            title,
            category,
            tags: [],
            visible: true,
            order: idCounter,
            uploadedAt: new Date().toISOString(),
            uploadedBy: "system",
          });
        }
      } catch {
        // Category folder doesn't exist or can't be read - skip
      }
    }

    // Sort by category then by title
    items.sort((a, b) => {
      const catCompare = CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category);
      if (catCompare !== 0) return catCompare;
      return a.title.localeCompare(b.title);
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Gallery scan error:", error);
    return NextResponse.json([]);
  }
}
