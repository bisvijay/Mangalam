# Plan: Mangalam Banquet & Hotel Web App

## TL;DR
Build a full-featured Next.js 14 app for Mangalam Banquet Hall & Hotel with **two faces**: a premium public website (booking inquiries, availability check, venue showcase) and an internal admin panel (booking management, CRM, invoicing, inventory). Data is stored as individual JSON files in **Vercel Blob Storage** (production) and local filesystem (development), ensuring no data loss on redeployment. Admins manage venue photos/videos that appear live on the public site. Incoming inquiries feed into a lead pipeline for follow-up via phone/email.

---

## Property Configuration

| Floor | Rooms | Hall | Notes |
|-------|-------|------|-------|
| 1st   | 2     | 1 (Big Hall) | |
| 2nd   | 6     | 1 (Big Hall) | |
| 3rd   | 10    | 1 (Hall) | |
| Ground | —    | 1 Outdoor Hall | + Kitchen, Parking, 50,000 sq ft open space |
| **Total** | **18 rooms** | **4 halls** | |

## Business Details
- **Business Name**: Mangalam
- **GSTIN**: 10ANSPD0701C1ZY
- **Address**: Ward No 37, Near Sundaram Vivah Bhawan, Barwat Pasrain, Areraj Road (Main Road), Bettiah, Pin - 845438
- **Phone**: 83839 81280
- **Style**: Premium / Wedding-focused (gold/maroon tones, elegant typography)

## GST Slab Configuration
- Room tariff ≤ ₹1,000/night → **0% (Exempt)**
- Room tariff ₹1,001 – ₹7,500/night → **5% (No ITC)** → 2.5% CGST + 2.5% SGST
- Room tariff > ₹7,500/night → **18% (With ITC)** → 9% CGST + 9% SGST
- Strategy: Rooms priced at ₹999/night for 0% bracket; balance charged as event/hall/decoration

---

## Tech Stack

| Layer | Choice | Reasoning |
|-------|--------|-----------|
| Framework | Next.js 14 (App Router) | SSR, API routes, Vercel-native |
| Language | TypeScript | Type safety for financial data |
| UI | Tailwind CSS + shadcn/ui | Rapid, polished UI |
| Auth | NextAuth.js (Credentials) | Multi-role, session-based |
| Data (prod) | **Vercel Blob Storage** (100MB free) | True JSON files, persists across deployments |
| Data (dev) | Local filesystem (`./data/`) | Same JSON structure, easy debugging |
| PDF | `@react-pdf/renderer` | GST invoice PDF generation |
| Excel/CSV | `exceljs` + `papaparse` | Excel (.xlsx) and CSV export for all data |
| Calendar | `react-big-calendar` | Booking calendar views |
| Forms | `react-hook-form` + `zod` | Validation |
| Icons | `lucide-react` | Consistent iconography |
| Print | `react-to-print` | Browser-native print for invoices |
| Media | **Vercel Blob Storage** | Photo/video uploads, served via CDN |
| Animations | `framer-motion` | Smooth public site transitions |
| Image Optimization | Next.js `<Image>` + Vercel | Auto-optimized for web |

---

## Data Persistence Strategy (JSON Files)

### Architecture
Each data collection stores records as **individual JSON files**, organized by collection:

```
{store}/
├── bookings/
│   ├── _index.json       ← Summary array for fast listing
│   ├── B001.json          ← Full record
│   ├── B002.json
│   └── ...
├── inquiries/
│   ├── _index.json
│   ├── INQ001.json        ← Public website inquiry/lead
│   └── ...
├── customers/
│   ├── _index.json
│   ├── C001.json
│   └── ...
├── rooms/
│   └── config.json        ← Static room definitions
├── halls/
│   └── config.json        ← Static hall definitions
├── inventory/
│   ├── _index.json
│   ├── ITM001.json
│   └── ...
├── invoices/
│   ├── _index.json
│   ├── INV-2526-001.json
│   └── ...
├── media/
│   └── gallery.json       ← Photo/video metadata + Blob URLs
├── website/
│   └── content.json       ← Public site CMS content (hero text, testimonials, etc.)
├── staff/
│   └── users.json         ← Staff accounts (hashed passwords)
└── settings/
    └── config.json         ← GST rates, business info, etc.
```

### Storage Abstraction Layer (`lib/data/store.ts`)
```
interface DataStore {
  get(collection, id)       → reads {collection}/{id}.json
  list(collection)          → reads {collection}/_index.json
  put(collection, id, data) → writes record + updates index
  delete(collection, id)    → deletes record + updates index
  export(collection)        → returns all records as single JSON array
  importAll(collection, data) → bulk imports from JSON array
}
```

- **Development**: `FileStore` — reads/writes `./data/{collection}/{id}.json` via Node fs
- **Production**: `BlobStore` — reads/writes to Vercel Blob Storage via `@vercel/blob`
- Swap via `DATA_STORE=file|blob` env variable

### Why This Works for Vercel Free Tier
- Vercel Blob: 100MB free, files persist across all deployments
- Each record is a separate file → no concurrent write conflicts
- Index files provide fast listing without reading every record
- Expected data volume: ~200 bookings/year, ~500 customers, ~300 inventory items ≈ < 5MB
- Built-in export: download entire dataset as JSON anytime

---

## Data Models

### Booking (bookings/{id}.json)
```json
{
  "id": "B001",
  "bookingDate": "2026-02-08",
  "eventDate": "2026-02-08",
  "eventEndDate": "2026-02-09",
  "eventType": "Wedding | Engagement | Birthday | Anniversary | Reception | Other",
  "status": "inquiry | confirmed | in-progress | completed | cancelled",
  "customer": {
    "name": "Prem Kumar",
    "phone": "7004324640",
    "email": "",
    "address": "Banurra, Nautan"
  },
  "eventDetails": {
    "brideName": "",
    "brideDOB": "",
    "groomName": "",
    "groomDOB": ""
  },
  "venue": {
    "hallId": "main-hall",
    "roomsBooked": 18,
    "guestsCount": 300
  },
  "charges": {
    "roomRate": 999,
    "roomNights": 1,
    "roomTotal": 17982,
    "hallCharge": 0,
    "decorationCharge": 0,
    "cateringCharge": 0,
    "otherCharges": 0,
    "subtotal": 75000,
    "gstBreakdown": [
      {"item": "Rooms", "taxable": 17982, "rate": 0, "cgst": 0, "sgst": 0},
      {"item": "Hall & Services", "taxable": 57018, "rate": 18, "cgst": 5132, "sgst": 5132}
    ],
    "totalGST": 10264,
    "grandTotal": 85264
  },
  "payments": [
    {"date": "2026-02-08", "amount": 50000, "method": "cash | upi | bank", "receipt": ""}
  ],
  "advance": 50000,
  "balance": 35264,
  "paymentStatus": "unpaid | partial | paid",
  "invoiceId": "INV-2526-001",
  "notes": "Decoration included",
  "createdAt": "2026-02-08T00:00:00Z",
  "updatedAt": "2026-02-08T00:00:00Z",
  "createdBy": "admin"
}
```

### Customer (customers/{id}.json)
```json
{
  "id": "C001",
  "name": "Prem Kumar",
  "phone": "7004324640",
  "email": "",
  "address": "Banurra, Nautan",
  "bookingIds": ["B001"],
  "eventTypes": ["Wedding"],
  "anniversaryDate": "2026-02-08",
  "tags": ["VIP", "Repeat"],
  "totalSpent": 75000,
  "notes": "",
  "createdAt": "2026-02-08T00:00:00Z"
}
```

### Invoice (invoices/{id}.json)
```json
{
  "id": "INV-2526-001",
  "bookingId": "B001",
  "invoiceDate": "2026-02-08",
  "invoiceType": "tax_invoice | proforma",
  "financialYear": "2025-26",
  "sequenceNo": 1,
  "seller": {
    "name": "Mangalam",
    "gstin": "10ANSPD0701C1ZY",
    "address": "Ward No 37, Near Sundaram Vivah Bhawan, Barwat Pasrain, Areraj Road (Main Road), Bettiah, Pin - 845438",
    "phone": "83839 81280",
    "stateCode": "10",
    "state": "Bihar"
  },
  "buyer": {
    "name": "Prem Kumar",
    "phone": "7004324640",
    "email": "",
    "address": "Banurra, Nautan",
    "gstin": "",
    "stateCode": "10",
    "state": "Bihar"
  },
  "lineItems": [
    {
      "sno": 1,
      "description": "Room Accommodation (18 rooms x 1 night)",
      "sacCode": "9963",
      "qty": 18,
      "rate": 999,
      "amount": 17982,
      "gstRate": 0,
      "cgst": 0,
      "sgst": 0,
      "igst": 0,
      "total": 17982
    },
    {
      "sno": 2,
      "description": "Banquet Hall - Main Hall (Wedding)",
      "sacCode": "9963",
      "qty": 1,
      "rate": 40000,
      "amount": 40000,
      "gstRate": 18,
      "cgst": 3600,
      "sgst": 3600,
      "igst": 0,
      "total": 47200
    },
    {
      "sno": 3,
      "description": "Decoration Charges",
      "sacCode": "9988",
      "qty": 1,
      "rate": 17018,
      "amount": 17018,
      "gstRate": 18,
      "cgst": 1532,
      "sgst": 1532,
      "igst": 0,
      "total": 20082
    }
  ],
  "summary": {
    "subtotal": 75000,
    "totalCGST": 5132,
    "totalSGST": 5132,
    "totalIGST": 0,
    "totalGST": 10264,
    "grandTotal": 85264,
    "roundOff": -0.64,
    "grandTotalRounded": 85264,
    "amountInWords": "Eighty Five Thousand Two Hundred Sixty Four Rupees Only"
  },
  "gstSummary": [
    {"rate": 0, "taxableValue": 17982, "cgst": 0, "sgst": 0, "igst": 0, "total": 0},
    {"rate": 18, "taxableValue": 57018, "cgst": 5132, "sgst": 5132, "igst": 0, "total": 10264}
  ],
  "payments": [
    {"date": "2026-02-08", "amount": 50000, "method": "cash", "reference": ""},
    {"date": "2026-02-09", "amount": 35264, "method": "upi", "reference": "UPI-REF-123"}
  ],
  "totalPaid": 85264,
  "balanceDue": 0,
  "paymentStatus": "paid",
  "notes": "Decoration included",
  "termsAndConditions": "1. Check-out by 11 AM...",
  "isSupplyIntraState": true,
  "placeOfSupply": "10 - Bihar",
  "createdAt": "2026-02-08T00:00:00Z",
  "createdBy": "admin"
}
```

**Invoice Features**:
- **Tax Invoice**: Full GST-compliant invoice with all mandatory fields (GSTIN, SAC codes, state codes, place of supply, CGST/SGST/IGST split)
- **Proforma Invoice**: Pre-booking estimate shared with customer before confirmation
- **Download as PDF**: Formatted for A4 print, includes business header/logo, buyer/seller blocks, itemized table, GST summary table, amount in words, payment history, terms
- **Print directly**: Browser print dialog via `react-to-print` — customer can get a printed copy on-site
- **Duplicate/Original marking**: Prints "ORIGINAL FOR RECIPIENT" / "DUPLICATE FOR SUPPLIER" / "TRIPLICATE FOR TRANSPORTER"
- **Email-ready**: PDF can be attached and sent via email link (mailto: with subject pre-filled)
- **Amendment**: Can create revised invoices with reference to original (credit/debit notes)
- **Sequential numbering**: Auto-increments within Indian FY (April–March), format `INV-2526-001`

### Inventory Item (inventory/{id}.json)
```json
{
  "id": "ITM001",
  "name": "Dinner Plates",
  "category": "Utensils | Linen | Decoration | Kitchen | Cleaning | Other",
  "quantity": 500,
  "unit": "pcs",
  "minStock": 100,
  "location": "Kitchen Store",
  "lastUpdated": "2026-03-01",
  "notes": ""
}
```

### Inquiry / Lead (inquiries/{id}.json)
```json
{
  "id": "INQ001",
  "source": "website",
  "submittedAt": "2026-03-25T10:30:00Z",
  "name": "Rajesh Kumar",
  "phone": "9876543210",
  "email": "rajesh@example.com",
  "eventType": "Wedding",
  "preferredDate": "2026-06-15",
  "guestsEstimate": 300,
  "hallPreference": "Main Hall",
  "roomsNeeded": true,
  "message": "Looking for full wedding package with decoration",
  "status": "new | contacted | quoted | converted | lost",
  "followUps": [
    {"date": "2026-03-26", "by": "admin", "method": "phone", "notes": "Discussed pricing, sending quote"},
    {"date": "2026-03-27", "by": "admin", "method": "email", "notes": "Sent formal quote ₹1,25,000"}
  ],
  "quotedAmount": 125000,
  "convertedToBookingId": "B006",
  "lostReason": "",
  "assignedTo": "admin"
}
```

### Media Gallery (media/gallery.json)
```json
{
  "items": [
    {
      "id": "IMG001",
      "type": "photo | video",
      "url": "https://blob.vercel-storage.com/mangalam/hall-main-1.jpg",
      "thumbnail": "https://blob.vercel-storage.com/mangalam/hall-main-1-thumb.jpg",
      "title": "Main Hall - Stage Setup",
      "category": "Main Hall | Outdoor Hall | Rooms | Kitchen | Parking | Events",
      "tags": ["wedding", "decoration"],
      "order": 1,
      "visible": true,
      "uploadedAt": "2026-03-01T00:00:00Z",
      "uploadedBy": "admin"
    }
  ]
}
```

### Website Content (website/content.json)
```json
{
  "hero": {
    "title": "Mangalam",
    "subtitle": "Where Every Celebration Becomes Timeless",
    "backgroundImage": "url-to-hero-image"
  },
  "about": "Premium banquet hall and hotel in Bettiah...",
  "amenities": ["18 AC Rooms", "4 Halls", "50,000 sq ft Open Space", "Ample Parking", "Full Kitchen"],
  "eventTypes": [
    {"name": "Wedding", "description": "...", "image": "..."},
    {"name": "Engagement", "description": "...", "image": "..."}
  ],
  "testimonials": [],
  "contactInfo": {
    "phone": "83839 81280",
    "email": "",
    "address": "Ward No 37, Near Sundaram Vivah Bhawan...",
    "googleMapsEmbed": ""
  }
}
```

---

## App Structure

```
src/
├── app/                                ← ROUTING LAYER (pages & API routes only)
│   ├── (public)/                       ← PUBLIC WEBSITE (no auth)
│   │   ├── layout.tsx
│   │   ├── page.tsx                    ← Landing page
│   │   ├── about/page.tsx
│   │   ├── gallery/page.tsx
│   │   ├── events/
│   │   │   ├── page.tsx
│   │   │   └── [type]/page.tsx
│   │   ├── availability/page.tsx
│   │   ├── book/page.tsx
│   │   ├── quote/page.tsx
│   │   └── contact/page.tsx
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/layout.tsx          ← ADMIN PANEL (auth required)
│   │   ├── page.tsx                    ← Dashboard
│   │   ├── inquiries/
│   │   │   ├── page.tsx                ← Lead pipeline
│   │   │   ├── [id]/page.tsx           ← Inquiry detail + follow-up
│   │   │   └── stats/page.tsx          ← Conversion metrics
│   │   ├── bookings/
│   │   │   ├── page.tsx                ← Booking list
│   │   │   ├── new/page.tsx            ← Create booking
│   │   │   ├── [id]/page.tsx           ← View booking
│   │   │   └── [id]/edit/page.tsx      ← Edit booking
│   │   ├── calendar/page.tsx
│   │   ├── customers/
│   │   │   ├── page.tsx                ← Customer list
│   │   │   ├── [id]/page.tsx           ← Customer profile
│   │   │   └── promotions/page.tsx     ← Promotions
│   │   ├── invoices/
│   │   │   ├── page.tsx                ← Invoice list
│   │   │   ├── new/page.tsx            ← Create invoice
│   │   │   ├── [id]/page.tsx           ← View/print invoice
│   │   │   └── [id]/pdf/route.ts       ← PDF download
│   │   ├── inventory/
│   │   │   ├── page.tsx                ← Inventory list
│   │   │   └── [category]/page.tsx     ← Category view
│   │   ├── reports/
│   │   │   ├── page.tsx                ← Revenue reports
│   │   │   └── gst/page.tsx            ← GST filing report
│   │   ├── website/                    ← CMS
│   │   │   ├── content/page.tsx        ← Edit site content
│   │   │   ├── gallery/page.tsx        ← Manage photos/videos
│   │   │   └── events/page.tsx         ← Manage event pages
│   │   ├── settings/
│   │   │   ├── page.tsx                ← Business config
│   │   │   └── staff/page.tsx          ← Staff management
│   │   └── data/
│   │       └── page.tsx                ← Import/export/backup
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── public/                     ← PUBLIC APIs (no auth, rate-limited)
│       │   ├── inquiries/route.ts      ← Submit inquiry (POST)
│       │   ├── availability/route.ts   ← Check date (GET)
│       │   ├── gallery/route.ts        ← Gallery items (GET)
│       │   └── content/route.ts        ← Site content (GET)
│       ├── bookings/route.ts
│       ├── customers/route.ts
│       ├── inquiries/route.ts
│       ├── invoices/route.ts
│       ├── invoices/[id]/pdf/route.ts
│       ├── invoices/[id]/print/route.ts
│       ├── inventory/route.ts
│       ├── media/route.ts
│       ├── website/route.ts
│       ├── export/route.ts             ← Universal Excel/CSV export
│       ├── export/gstr1/route.ts       ← GSTR-1 Excel export
│       ├── data/route.ts               ← Full backup/import
│       └── reports/route.ts
│
├── components/                         ← UI LAYER (reusable components)
│   ├── ui/                             ← shadcn/ui primitives (Button, Input, Dialog, etc.)
│   ├── public/                         ← Public website components
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── HeroSection.tsx
│   │   ├── EventCard.tsx
│   │   ├── GalleryGrid.tsx
│   │   ├── InquiryForm.tsx
│   │   └── AvailabilityChecker.tsx
│   ├── dashboard/                      ← Admin panel components
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── KPICard.tsx
│   │   ├── DataTable.tsx               ← Generic sortable/filterable table
│   │   └── ExportButton.tsx            ← Universal Excel/CSV export trigger
│   ├── bookings/
│   │   ├── BookingForm.tsx
│   │   ├── BookingCard.tsx
│   │   └── BookingCalendar.tsx
│   ├── invoices/
│   │   ├── InvoiceForm.tsx
│   │   ├── InvoiceView.tsx             ← Print-ready GST invoice layout
│   │   ├── InvoicePDF.tsx              ← @react-pdf/renderer template
│   │   └── PaymentRecorder.tsx
│   ├── customers/
│   │   ├── CustomerForm.tsx
│   │   └── CustomerProfile.tsx
│   ├── inquiries/
│   │   ├── InquiryPipeline.tsx
│   │   └── FollowUpLog.tsx
│   └── inventory/
│       ├── InventoryForm.tsx
│       └── InventoryTable.tsx
│
├── lib/                                ← BUSINESS LOGIC LAYER (no UI, no framework deps)
│   ├── data/                           ← Data persistence abstraction
│   │   ├── store.ts                    ← DataStore interface
│   │   ├── file-store.ts              ← Local filesystem (dev)
│   │   ├── blob-store.ts             ← Vercel Blob (prod)
│   │   └── index.ts                   ← Factory: selects store by env
│   ├── gst.ts                         ← GST calculation, slabs, CGST/SGST/IGST, amount-in-words
│   ├── invoice.ts                     ← Invoice generation, numbering, line items
│   ├── invoice-pdf.ts                 ← PDF template definition
│   ├── booking.ts                     ← Booking validation, status, charges
│   ├── export.ts                      ← Excel/CSV export engine
│   ├── auth.ts                        ← NextAuth config, roles, middleware
│   └── utils.ts                       ← Shared helpers (ID gen, date formatting, etc.)
│
├── types/                              ← TYPE DEFINITIONS (shared across all layers)
│   ├── booking.ts
│   ├── customer.ts
│   ├── invoice.ts
│   ├── inquiry.ts
│   ├── inventory.ts
│   ├── media.ts
│   ├── website.ts
│   └── auth.ts
│
├── hooks/                              ← REACT HOOKS (client-side data fetching, state)
│   ├── useBookings.ts
│   ├── useCustomers.ts
│   ├── useInvoices.ts
│   ├── useInquiries.ts
│   ├── useInventory.ts
│   └── useExport.ts
│
├── styles/                             ← STYLES
│   ├── globals.css                     ← Tailwind base + custom theme
│   └── invoice-print.css              ← A4 print-specific styles
│
└── data/                               ← SEED DATA (dev only, gitignored in prod)
    ├── rooms/config.json
    ├── halls/config.json
    ├── settings/config.json
    └── website/content.json
```

### Layer Separation Principle
- **`types/`** — Pure TypeScript interfaces. No imports from other layers.
- **`lib/`** — Business logic. Imports only from `types/`. No React, no UI.
- **`hooks/`** — React hooks for data fetching. Imports from `types/` and calls `api/` routes.
- **`components/`** — React UI components. Imports from `types/`, `hooks/`, and `lib/` (for formatting). No direct data access.
- **`app/`** — Routing only. Pages compose `components/`, API routes call `lib/` functions.

---

## Implementation Phases

### Phase 1: Foundation (Steps 1–4)

1. **Project scaffolding** — Initialize Next.js 14 with TypeScript, Tailwind CSS, shadcn/ui. Configure ESLint, folder structure. Set up `(public)` and `(dashboard)` route groups.
2. **Data layer** — Implement `DataStore` interface, `FileStore` (local dev), and `BlobStore` (Vercel Blob). Include `_index.json` management and atomic write helpers. **This is the critical persistence layer.**
3. **Property seed data** — Create `rooms/config.json` (18 rooms with floor, type, rate), `halls/config.json` (4 halls with capacity, type, rate), `settings/config.json` (GST slabs, business info), and `website/content.json` (default public site content).
4. **Authentication** — NextAuth.js with credentials provider. Role model: `admin`, `manager`, `receptionist`. Password hashing with bcrypt. Middleware: protect `(dashboard)` routes, leave `(public)` routes open.

### Phase 2: Public Website (Steps 5–9)

5. **Public layout & landing page** — Premium wedding-focused design: elegant navbar (logo, nav links, "Book Now" CTA button), hero section with background image placeholder, services overview, gallery preview, testimonials, footer with contact info + Google Maps. *Depends on step 1.*
6. **Event showcase pages** — `/events` listing all event types (Wedding, Engagement, Birthday, Anniversary, Reception, Corporate). Individual `/events/[type]` pages with description, photo gallery, key features. Content driven from `website/content.json`.
7. **Gallery page** — `/gallery` — filterable photo/video grid (categories: Main Hall, Outdoor Hall, Rooms, Kitchen, Events). Lightbox for full-size view. Videos embedded. Served from media metadata in `media/gallery.json`. *Parallel with step 6.*
8. **Availability checker** — `/availability` — date picker where customer selects a date + preferred hall → API checks against existing bookings → returns "Available" / "Booked" / "Partially Available". Does NOT expose booking details, only availability status. *Depends on step 2 for data layer.*
9. **Inquiry & quote forms** — `/book` (quick inquiry: name, phone, email, event type, preferred date, guest count, message) and `/quote` (detailed: adds hall preference, room needs, decoration, catering). Both submit to `api/public/inquiries` → creates Inquiry record. Confirmation message shown. **Rate-limited** (max 5 submissions per IP per hour) to prevent spam.

### Phase 3: Inquiry/Lead Management (Steps 10–12)

10. **Inquiry CRUD API** — Admin API for listing, updating, and managing inquiries. Public API (POST only) for submissions. Auto-assign new inquiries to admin. *Depends on step 9.*
11. **Inquiry pipeline UI** — Kanban-style board or table with status columns: New → Contacted → Quoted → Converted / Lost. Click inquiry to see details, add follow-up notes (phone call, email, WhatsApp), record quoted amount, convert to booking (pre-fills booking form). **Dashboard widget**: "X new inquiries" alert.
12. **Convert inquiry to booking** — One-click action: pre-populates booking form with inquiry data (customer name, phone, email, event type, date, hall, guest count). Links inquiry record to created booking. Updates inquiry status to "converted". *Depends on Phase 4 booking form.*

### Phase 4: Booking Management (Steps 13–16)

13. **Booking CRUD API** — API routes for create, read, update, delete bookings. Auto-generate booking ID (`B{NNN}`). Auto-create/link customer records. *Depends on step 2.*
14. **Booking form UI** — Multi-section form matching Excel structure: customer details, event details (bride/groom for weddings), venue selection, charges breakdown, payment recording. Zod validation.
15. **Booking list & details** — Table with search, filter by date/status/event-type, sort. Detail view with payment history and status management. *Parallel with step 16.*
16. **Calendar view** — Monthly/weekly calendar showing bookings by hall. Color-coded by event type. Click to view/create booking.

### Phase 5: Invoicing & GST (Steps 17–21)

17. **GST calculation engine** — `lib/gst.ts`: Given room rate, hall charge, decoration, etc., calculate per-line-item GST using configured slabs. Return CGST + SGST breakdown (intra-state) or IGST (inter-state). Auto-detect based on place of supply vs. seller state. Amount-in-words converter for Indian Rupees. Unit-testable pure function. *Depends on step 3 for config.*
18. **Invoice creation UI** — Create invoice from booking (auto-populates) OR create standalone invoice. Editable line items: description, SAC code, qty, rate, GST rate. Auto-calculates totals, CGST/SGST, amount in words. "Proforma" toggle for pre-booking quotes. Add/edit payment records. Notes and terms fields. *Depends on steps 13, 17.*
19. **Invoice view & print** — Full invoice view page matching standard Indian GST tax invoice format:
    - Header: Business name, GSTIN, address, phone, logo
    - Buyer block: Customer name, address, phone, GSTIN (if B2B), state code
    - Itemized table: S.No, Description, SAC, Qty, Rate, Amount, CGST, SGST, Total
    - GST summary table: grouped by tax rate (0%, 5%, 18%) with taxable value and tax amounts
    - Amount in words, Total paid / Balance due
    - Terms & conditions, Authorized signatory
    - Copy marking: "ORIGINAL FOR RECIPIENT" / "DUPLICATE FOR SUPPLIER"
    - **Print button**: Opens browser print dialog (`react-to-print`), A4-optimized CSS
    - **Download PDF**: Server-side PDF generation via `@react-pdf/renderer`, matching the on-screen layout
20. **Invoice list & management** — Searchable table: invoice number, date, customer, amount, GST, status (paid/partial/unpaid). Filters by date range, payment status, FY. Bulk actions: export selected as PDF ZIP.
21. **Invoice export for GST filing** — Export invoices as Excel (.xlsx) for GST return filing:
    - **GSTR-1 format**: Outward supply details — invoice-wise with GSTIN, invoice no, date, taxable value, CGST, SGST, IGST, total
    - **B2C summary**: For unregistered customers, grouped by rate
    - **HSN summary**: Grouped by SAC/HSN code
    - Date range selector (monthly/quarterly matching GST filing periods)
    - CSV alternative for simpler tools

### Phase 6: Customers & Promotions (Steps 22–24)

22. **Customer CRUD** — Auto-populated from bookings and inquiries. Merge duplicate phone numbers. Track total spend, booking history, event dates (birthdays, anniversaries). *Depends on step 13.*
23. **Customer search & profiles** — Search by name/phone/address. Profile page showing all bookings, inquiries, invoices, total spend. Tags for segmentation.
24. **Promotion tools** — Filter customers by tags, event type, date range. Generate list with phone numbers for WhatsApp broadcast. Pre-formatted message templates with personalization. **Export customer list as Excel/CSV** for bulk messaging tools.

### Phase 7: Inventory Management (Steps 25–26) *Parallel with Phase 6*

25. **Inventory CRUD** — Add/edit/delete inventory items. Categories: Utensils, Linen, Decoration, Kitchen, Cleaning. Track quantity, location, min stock level. Low stock alerts on dashboard.
26. **Inventory list UI** — Table with category filter, search, low-stock highlight. Bulk update via spreadsheet-style edit mode. **Export inventory as Excel/CSV.**

### Phase 8: Website CMS (Steps 27–29) *Parallel with Phase 6*

27. **Media upload API** — Upload photos/videos to Vercel Blob Storage. Auto-generate thumbnails. Store metadata in `media/gallery.json`. Delete removes from both Blob and metadata. *Depends on step 2.*
28. **Gallery management UI** — Admin page: drag-to-reorder, upload new photos/videos, assign categories and tags, toggle visibility, delete. Changes reflect immediately on public `/gallery` page.
29. **Content management UI** — Admin page: edit hero text/image, about section, amenity list, event type descriptions, testimonials. WYSIWYG-light (markdown or simple rich text). Changes reflect immediately on public site.

### Phase 9: Dashboard, Reports & Export (Steps 30–35)

30. **Dashboard** — KPI cards: today's bookings, upcoming events (7 days), new inquiries (unread count), monthly revenue, outstanding balance. Upcoming events list. Low stock alerts. Inquiry conversion rate. *Depends on steps 10, 13, 25.*
31. **Revenue & booking reports** — Monthly/yearly revenue reports. Booking count by event type. Occupancy rates. Inquiry conversion funnel. Customer acquisition.
32. **GST report** — Summary for filing: total taxable value, CGST collected, SGST collected, by tax slab. Monthly/quarterly/yearly views. Matches invoice data. **Exportable as Excel in GSTR-1 format.**
33. **Inquiry analytics** — Source tracking, conversion rates, average response time, lost reasons breakdown.
34. **Universal Excel/CSV export** — Every data table in the app has an "Export" button with format choice:
    - **Excel (.xlsx)**: Formatted with headers, column widths, bold headings, rupee formatting. Uses `exceljs`.
    - **CSV**: Simple comma-separated for importing into other tools. Uses `papaparse`.
    - Available on: Bookings list, Customer list, Invoice list, Inventory list, Inquiry list, GST reports, Revenue reports
    - Date range filter applied before export (export only what's on screen / filtered)
35. **Data backup** — One-click full export: downloads all collections as a single ZIP of JSON files. CSV/Excel export per-collection also available.

### Phase 10: Data Import & Deployment (Steps 36–38)

36. **Import existing data** — Parse the Excel data (5 bookings provided) and seed into the system. Build a CSV/JSON/Excel import tool for future batch imports.
37. **Export/backup** — Scheduled reminder for manual backup (Vercel free tier has no cron). Full JSON + Excel export available on demand.
38. **Deployment** — Configure Vercel project. Set environment variables (`BLOB_READ_WRITE_TOKEN`, `NEXTAUTH_SECRET`, etc.). Deploy and verify data persistence across redeployments. Verify public site loads correctly.

---

## Relevant Files

### Data Layer (Critical)
- `src/lib/data/store.ts` — `DataStore` interface definition
- `src/lib/data/file-store.ts` — Local filesystem JSON implementation (dev)
- `src/lib/data/blob-store.ts` — Vercel Blob JSON implementation (prod)
- `src/lib/data/index.ts` — Factory function selecting store based on env

### Business Logic
- `src/lib/gst.ts` — GST slab calculation engine (pure functions, CGST/SGST/IGST, amount-in-words)
- `src/lib/invoice.ts` — Invoice generation, sequential numbering, line item builder, PDF data prep
- `src/lib/invoice-pdf.ts` — `@react-pdf/renderer` template for A4 GST tax invoice
- `src/lib/booking.ts` — Booking validation, status transitions, charge calculation
- `src/lib/export.ts` — Universal export engine (Excel via `exceljs`, CSV via `papaparse`)
- `src/lib/auth.ts` — NextAuth config, role definitions, middleware

### Type Definitions
- `src/types/booking.ts` — Booking, Charges, Payment, EventDetails
- `src/types/invoice.ts` — Invoice, LineItem, GSTSummary, Seller, Buyer
- `src/types/customer.ts` — Customer
- `src/types/inquiry.ts` — Inquiry, FollowUp
- `src/types/inventory.ts` — InventoryItem
- `src/types/media.ts` — GalleryItem
- `src/types/website.ts` — WebsiteContent, HeroSection, EventType
- `src/types/auth.ts` — User, Role

### Public Website
- `src/app/(public)/layout.tsx` — Public site layout (navbar, footer, premium theme)
- `src/app/(public)/page.tsx` — Landing page (hero, services, gallery preview, CTA)
- `src/components/public/Navbar.tsx` — Public navbar with "Book Now" CTA
- `src/components/public/HeroSection.tsx` — Hero with background image
- `src/components/public/InquiryForm.tsx` — Booking inquiry form component

### Invoice Components
- `src/components/invoices/InvoiceView.tsx` — Print-ready GST tax invoice layout
- `src/components/invoices/InvoicePDF.tsx` — PDF template matching on-screen layout
- `src/components/invoices/InvoiceForm.tsx` — Create/edit invoice with line items
- `src/components/invoices/PaymentRecorder.tsx` — Add payment entries

### Export Components
- `src/components/dashboard/ExportButton.tsx` — Universal export trigger (Excel/CSV)
- `src/lib/export.ts` — Server-side export generation engine

### Public APIs (rate-limited, no auth)
- `src/app/api/public/inquiries/route.ts` — Submit inquiry (POST only)
- `src/app/api/public/availability/route.ts` — Check date availability (GET)
- `src/app/api/public/gallery/route.ts` — Get gallery items (GET)
- `src/app/api/public/content/route.ts` — Get website content (GET)

### Admin API Routes
- `src/app/api/bookings/route.ts` — Booking CRUD
- `src/app/api/customers/route.ts` — Customer CRUD
- `src/app/api/inquiries/route.ts` — Inquiry management (admin)
- `src/app/api/invoices/route.ts` — Invoice CRUD (create, list, update payments)
- `src/app/api/invoices/[id]/pdf/route.ts` — PDF generation & download endpoint
- `src/app/api/invoices/[id]/print/route.ts` — Print-optimized HTML endpoint
- `src/app/api/inventory/route.ts` — Inventory CRUD
- `src/app/api/media/route.ts` — Photo/video upload/delete to Blob
- `src/app/api/website/route.ts` — CMS content management
- `src/app/api/export/route.ts` — Universal Excel/CSV export (bookings, customers, invoices, inventory, inquiries)
- `src/app/api/export/gstr1/route.ts` — GSTR-1 format Excel export for GST filing
- `src/app/api/data/route.ts` — Full backup export/import (JSON ZIP)
- `src/app/api/reports/route.ts` — Report aggregation

### Seed Data
- `data/rooms/config.json` — 18 room definitions
- `data/halls/config.json` — 4 hall definitions
- `data/settings/config.json` — GST rates, business metadata
- `data/website/content.json` — Default public site content

---

## Verification

1. **Data persistence**: Deploy to Vercel → create a booking → redeploy → verify booking still exists
2. **GST calculation**: Create booking with room rate ₹999 → verify CGST=0, SGST=0 for room line item. Create with rate ₹2000 → verify 2.5% CGST + 2.5% SGST
3. **Invoice creation**: Create booking → generate invoice → verify all line items, SAC codes, GST breakdown, amount in words are correct
4. **Invoice PDF & print**: Download invoice PDF → verify A4 layout, GSTIN, CGST/SGST columns, payment summary, "ORIGINAL FOR RECIPIENT" marking. Print from browser → verify same layout
5. **Invoice for GST filing**: Export invoices for March 2026 → download Excel → verify GSTR-1 format columns (invoice no, date, taxable value, CGST, SGST, total). Verify B2C and HSN summary sheets.
6. **Excel/CSV export**: Go to Bookings list → click Export → Excel → verify .xlsx opens correctly with formatted headers, rupee amounts, correct data. Repeat for CSV. Test for: customers, inventory, inquiries, invoices
7. **Role access**: Login as receptionist → verify cannot access settings/staff management. Login as admin → verify full access
8. **Booking flow**: Create booking → record advance payment → generate invoice → complete event → record balance payment → verify invoice balance updates to ₹0
9. **Customer auto-creation**: Create booking for new customer → verify customer record auto-created. Create booking for existing phone → verify linked to existing customer
10. **Inventory alerts**: Set item min stock to 50, quantity to 30 → verify appears in dashboard low-stock alert
11. **Import**: Import the 5 existing Excel bookings → verify all data mapped correctly
12. **Full backup**: Export all data as ZIP → verify JSON files for each collection → re-import into fresh instance → verify data integrity
13. **Public inquiry → conversion**: Submit inquiry on public site → verify appears in admin pipeline as "New" → add follow-up → convert to booking → verify booking pre-filled and inquiry marked "Converted"
14. **Proforma invoice**: Create proforma from inquiry → share PDF with customer → convert to tax invoice after booking confirmation

---

## Decisions

- **Vercel Blob over MongoDB**: User explicitly wants JSON files. Vercel Blob stores actual JSON files that persist across deployments. Expected data volume (~5MB/year) fits well within 100MB free tier.
- **Per-record JSON files over single collection file**: Avoids concurrent write conflicts. Each booking/customer/invoice is a separate file. Index files maintained for fast listing.
- **Room rate at ₹999**: Matches existing strategy. Default rate pre-set in room config. GST engine respects the configured slab boundaries.
- **No external SMS/WhatsApp API**: Promotion tools generate formatted contact lists and message templates. Actual sending is manual (WhatsApp Web, SMS apps). Avoids API costs and complexity.
- **Public website with inquiry funnel**: Customers can check availability and submit inquiries online. Staff follows up and converts to bookings. No direct online payment — all payments handled offline.
- **Financial year for invoice numbering**: Indian FY (April–March). Invoice numbers: `INV-2526-001` for FY 2025-26.
- **Excel export via `exceljs`**: Server-side Excel generation. Formatted spreadsheets with headers, column widths, rupee formatting. GSTR-1 compatible format for GST filing.
- **Print via `react-to-print`**: Client-side browser print dialog. A4-optimized CSS. No server-side print dependency.
- **Layer separation**: `types/` → `lib/` → `hooks/` → `components/` → `app/`. Each layer only imports from layers below it. Business logic in `lib/` has zero React/UI dependencies.

---

## Further Considerations

1. **WhatsApp Business API integration**: Currently promotions generate contact lists for manual WhatsApp broadcast. In future, could integrate WhatsApp Business API for automated messages (birthday greetings, event reminders). **Recommend**: Start with manual approach, add automation later based on volume.

2. **Multi-day event handling**: Some events span multiple days (e.g., wedding functions across 2-3 days). The current model has `eventDate` + `eventEndDate`. **Recommend**: Support date ranges, charge rooms per night automatically.

3. **Vercel Blob 100MB limit**: If data grows beyond 100MB (unlikely for years), migration path is to swap `BlobStore` for a database-backed store (MongoDB Atlas free 512MB) without changing any app code — the storage abstraction makes this seamless.
