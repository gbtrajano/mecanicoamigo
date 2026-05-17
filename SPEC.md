# Auto Repair Shop Management System - SPEC.md

## 1. Project Overview

**Project Name:** Mechanic - Sistema de Gerenciamento de Oficina
**Project Type:** Local Web Application (Next.js 14 App Router)
**Core Functionality:** Complete auto repair shop management with local SQLite database, data export/import, and service order workflows.
**Target Users:** Auto repair shop owners, mechanics, and service advisors.

---

## 2. Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Runtime:** Bun
- **Database:** SQLite (via Prisma ORM)
- **Styling:** Tailwind CSS 4 + shadcn/ui-inspired components
- **Icons:** Lucide React
- **State Management:** React Server Components + Client Hooks

---

## 3. UI/UX Specification

### 3.1 Layout Structure

**Desktop Layout:**
- Fixed sidebar (280px) on the left with navigation
- Main content area with header and content
- Top bar with search and quick actions

**Mobile Layout:**
- Bottom navigation bar (5 items: Dashboard, Clients, Vehicles, OS, Settings)
- Full-width content with hamburger menu for settings
- Touch-optimized buttons (min 44px tap targets)

### 3.2 Visual Design

**Color Palette:**
```css
--background: #0a0a0b (zinc-950)
--foreground: #fafafa (zinc-50)
--card: #18181b (zinc-900)
--card-foreground: #fafafa
--primary: #6366f1 (indigo-500)
--primary-foreground: #ffffff
--secondary: #27272a (zinc-800)
--secondary-foreground: #fafafa
--muted: #27272a (zinc-800)
--muted-foreground: #a1a1aa (zinc-400)
--accent: #10b981 (emerald-500)
--destructive: #ef4444 (red-500)
--border: #3f3f46 (zinc-700)
--input: #27272a
--ring: #6366f1
```

**Status Colors:**
- Draft: zinc-500
- In Progress: blue-500
- Waiting for Parts: amber-500
- Completed: emerald-500
- Cancelled: red-500

**Typography:**
- Font Family: Inter (Google Fonts)
- Headings: font-semibold
- Body: font-normal
- Monospace (OS numbers): JetBrains Mono

**Spacing System:**
- Base unit: 4px
- Padding: 16px (cards), 24px (sections)
- Gap: 12px (form elements), 16px (sections)

**Visual Effects:**
- Cards: rounded-xl with subtle border
- Buttons: rounded-lg with transitions
- Inputs: rounded-md with focus ring
- Shadows: subtle drop shadows on modals

### 3.3 Components

**Navigation:**
- Sidebar with icon + label items
- Active state: primary background with white text
- Hover state: secondary background
- Mobile: bottom nav with icons + labels

**Data Tables:**
- Zebra striping (alternate row colors)
- Sortable columns
- Row hover highlighting
- Mobile: card-based layout

**Forms:**
- Floating labels or top-aligned labels
- Input validation with inline errors
- Required field indicators (*)
- Clear submit/cancel buttons

**Modals/Dialogs:**
- Centered with backdrop blur
- Close button in top-right
- Action buttons in footer

**Cards:**
- Client cards: avatar, name, phone, vehicle count
- Vehicle cards: plate, model, year, client name
- OS cards: number, client, vehicle, status badge, total

---

## 4. Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Client {
  id          String    @id @default(uuid())
  name        String
  phone       String?
  whatsapp    String?
  email       String?
  cpfCnpj     String?
  address     String?
  notes       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  vehicles    Vehicle[]
}

model Vehicle {
  id           String         @id @default(uuid())
  clientId     String
  client       Client         @relation(fields: [clientId], references: [id], onDelete: Cascade)
  plate        String
  brand        String
  model        String
  year         Int
  color        String?
  fuelType     String?
  vin          String?
  mileage      Int?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  serviceOrders ServiceOrder[]
}

model ServiceOrder {
  id                  String   @id @default(uuid())
  osNumber            Int      @unique @default(autoincrement())
  vehicleId           String
  vehicle             Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  entryDate           DateTime @default(now())
  estimatedDelivery   DateTime?
  description         String?
  diagnostics         String?
  status              String   @default("DRAFT")
  discount            Float    @default(0)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  items               ServiceItem[]
}

model ServiceItem {
  id             String         @id @default(uuid())
  serviceOrderId String
  serviceOrder   ServiceOrder   @relation(fields: [serviceOrderId], references: [id], onDelete: Cascade)
  type           String         // "PART" or "SERVICE"
  name           String
  quantity       Int            @default(1)
  unitPrice      Float
  createdAt      DateTime       @default(now())
}
```

---

## 5. Core Features & Pages

### 5.1 Dashboard (/)
- Summary cards: Total Clients, Total Vehicles, Active OS, Completed OS (this month)
- Recent service orders list (last 10)
- Quick action buttons: New OS, New Client, New Vehicle
- Storage usage indicator

### 5.2 Clients (/clients)
- List view with search and filters
- Add/Edit client modal
- View client details with linked vehicles
- Delete confirmation

### 5.3 Vehicles (/vehicles)
- List view with search by plate or client
- Add/Edit vehicle modal (linked to client)
- Vehicle detail view with OS history tab
- Delete confirmation

### 5.4 Service Orders (/service-orders)
- List view with status filters
- Create OS: select vehicle, add items (parts/services), set dates
- Edit OS: update status, add/remove items
- OS detail view with print preview
- Status workflow actions

### 5.5 Settings (/settings)
- Database management section
- Export database button (downloads .db file)
- Import database with file upload and validation
- Storage info display

---

## 6. Data Management Features

### 6.1 Export Database
- Read current SQLite file from prisma/dev.db
- Create downloadable blob
- File name: `mechanic_backup_YYYY-MM-DD.db`

### 6.2 Import Database
- Accept .db file upload
- Validate it's a valid SQLite database
- Backup current database first
- Replace database file
- Show success/error feedback

---

## 7. Acceptance Criteria

- [ ] Application runs locally without external dependencies
- [ ] SQLite database persists between sessions
- [ ] All CRUD operations work for Clients, Vehicles, and OS
- [ ] Export downloads valid .db file
- [ ] Import restores data from backup file
- [ ] Responsive on mobile (375px) and desktop (1440px)
- [ ] Status workflow works correctly
- [ ] Print-friendly OS view works
- [ ] No console errors in production build

---

## 8. File Structure

```
/src
  /app
    /layout.tsx
    /page.tsx (Dashboard)
    /clients/page.tsx
    /vehicles/page.tsx
    /service-orders/page.tsx
    /settings/page.tsx
    /api
      /clients/route.ts
      /vehicles/route.ts
      /service-orders/route.ts
      /export/route.ts
      /import/route.ts
  /components
    /ui (reusable components)
    /layout (sidebar, header)
  /lib
    /prisma.ts
    /db-utils.ts
    /export-import.ts
  /types
    /index.ts
```