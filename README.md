# MedPortal

A modern medical office management web application built with React, Express, and Knack backend-as-a-service. MedPortal provides full CRUD functionality for managing patients, appointments, prescriptions, diagnoses, and insurance companies with a healthcare-focused UI.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Knack Backend Integration](#knack-backend-integration)
  - [How the Proxy Layer Works](#how-the-proxy-layer-works)
  - [Knack Object Schema](#knack-object-schema)
  - [Field Type Mapping](#field-type-mapping)
  - [Connection Fields (Relationships)](#connection-fields-relationships)
- [Healthcare Lookup System](#healthcare-lookup-system)
  - [Lookup Components](#lookup-components)
  - [Code Display Settings](#code-display-settings)
  - [Multi-Value List Storage](#multi-value-list-storage)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                       │
│  (Vite + TanStack Query + shadcn/ui + Tailwind CSS)     │
│                                                          │
│  Pages: Dashboard, Patients, Appointments, Prescriptions,│
│         Diagnoses, Insurance, Settings, Help             │
│                                                          │
│  Lookup Components: NPI, RxTerms, ICD-10-CM, HPO, HCPCS,│
│                     Medical Conditions                   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP (fetch)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                 Express API Server                       │
│          (Proxy layer + healthcare lookups)              │
│                                                          │
│  /api/patients     → Knack object_2                      │
│  /api/staff        → Knack object_3                      │
│  /api/appointments → Knack object_5                      │
│  /api/prescriptions→ Knack object_6                      │
│  /api/insurance    → Knack object_8                      │
└──────────┬──────────────────────┬───────────────────────┘
           │                      │
           ▼                      ▼
┌─────────────────────┐  ┌──────────────────────────────┐
│    Knack REST API    │  │  NLM Clinical Tables API     │
│  (Primary data store)│  │  (Healthcare code lookups)   │
│                      │  │                              │
│  App ID:             │  │  - NPI (Physicians)          │
│  696ac7e9d09e7f3ff5  │  │  - RxTerms (Medications)    │
│  b8cfa6              │  │  - ICD-10-CM (Diagnosis)     │
│                      │  │  - HPO (Phenotypes)          │
│                      │  │  - HCPCS (Procedures)        │
│                      │  │  - Conditions (ICD-10/ICD-9) │
└─────────────────────┘  └──────────────────────────────┘
```

## Knack Backend Integration

MedPortal uses [Knack](https://www.knack.com/) as its primary backend database. All patient, appointment, prescription, and insurance data is stored in Knack objects accessed via their REST API.

### How the Proxy Layer Works

The Express server acts as a **proxy** between the React frontend and the Knack API. This keeps the Knack API key secure on the server side and provides a clean REST interface for the frontend.

**Server-side helper (`server/routes.ts`):**

```typescript
const KNACK_API_BASE = "https://api.knack.com/v1";

async function knackRequest(
  endpoint: string,
  method: string = "GET",
  body?: unknown
): Promise<Response> {
  const headers = {
    "X-Knack-Application-Id": KNACK_APP_ID,
    "X-Knack-REST-API-Key": process.env.KNACK_API_KEY || "",
    "Content-Type": "application/json",
  };

  return fetch(`${KNACK_API_BASE}${endpoint}`, { method, headers, body: ... });
}
```

**Route pattern** - each entity follows the same CRUD pattern:

```
GET    /api/patients          → Knack GET  /objects/object_2/records
GET    /api/patients/:id      → Knack GET  /objects/object_2/records/:id
POST   /api/patients          → Knack POST /objects/object_2/records
PUT    /api/patients/:id      → Knack PUT  /objects/object_2/records/:id
DELETE /api/patients/:id      → Knack DELETE /objects/object_2/records/:id
```

**Frontend data fetching** uses TanStack React Query:

```typescript
const { data, isLoading } = useQuery<KnackRecordsResponse<Patient>>({
  queryKey: ["/api/patients"],
});
```

### Knack Object Schema

| Object ID  | Name                      | Purpose                                      |
|------------|---------------------------|----------------------------------------------|
| `object_2` | Patients                  | Patient demographics, contact info, history   |
| `object_3` | Staff                     | Staff members, roles, specialties             |
| `object_4` | New Patient Forms         | Patient intake forms                          |
| `object_5` | Appointments              | Scheduling, diagnosis codes, procedures       |
| `object_6` | Prescriptions             | Medications, dosage, refills                  |
| `object_7` | Prescription Refill Requests | Refill tracking and approval                |
| `object_8` | Insurance Companies       | Insurance provider details                    |

### Field Type Mapping

Knack returns fields in two formats: a **display value** (`field_X`) and a **raw value** (`field_X_raw`). The raw value contains structured data that MedPortal uses for programmatic access.

#### Patients (object_2)

| Field ID    | Label            | Type               | Raw Type             |
|-------------|------------------|--------------------|----------------------|
| `field_6`   | Name             | `string`           | `KnackNameField`     |
| `field_7`   | Email            | `string`           | `KnackEmailField`    |
| `field_9`   | Status           | `string`           | `string`             |
| `field_44`  | Phone            | `string`           | `KnackPhoneField`    |
| `field_45`  | Address          | `string`           | `KnackAddressField`  |
| `field_46`  | Date of Birth    | `string`           | `KnackDateField`     |
| `field_47`  | Medical History  | `string`           | `string`             |
| `field_48`  | Preferred Name   | `string`           | `string`             |
| `field_103` | Other Doctors    | `string`           | `string`             |

#### Staff (object_3)

| Field ID    | Label            | Type               | Raw Type             |
|-------------|------------------|--------------------|----------------------|
| `field_11`  | Name             | `string`           | `KnackNameField`     |
| `field_12`  | Email            | `string`           | `KnackEmailField`    |
| `field_14`  | Status           | `string`           | `string`             |
| `field_15`  | Profile/Role     | `string`           | `string[]`           |
| `field_66`  | Role             | `string`           | `string[]`           |
| `field_72`  | Specialty        | `string`           | `string[]`           |

#### Appointments (object_5)

| Field ID    | Label              | Type               | Raw Type                  |
|-------------|--------------------|--------------------|---------------------------|
| `field_17`  | Appointment Date   | `string`           | `KnackDateField`          |
| `field_18`  | Status             | `string`           | `string`                  |
| `field_19`  | Preferred Time     | `string`           | `string`                  |
| `field_20`  | Reason For Visit   | `string`           | `string`                  |
| `field_21`  | Scheduled Date     | `string`           | `KnackDateField`          |
| `field_70`  | Patient            | `string`           | `KnackConnectionField[]`  |
| `field_71`  | Provider           | `string`           | `KnackConnectionField[]`  |
| `field_99`  | Referring Physician| `string`           | `string`                  |
| `field_100` | Diagnosis (ICD-10) | `string`           | `string`                  |
| `field_101` | Procedures (HCPCS) | `string`           | `string`                  |
| `field_102` | Phenotypes (HPO)   | `string`           | `string`                  |

#### Prescriptions (object_6)

| Field ID    | Label              | Type               | Raw Type                  |
|-------------|--------------------|--------------------|---------------------------|
| `field_80`  | Medication         | `string`           | `string`                  |
| `field_24`  | Instructions       | `string`           | `string`                  |
| `field_25`  | Issue Date         | `string`           | `KnackDateField`          |
| `field_26`  | Expiration Date    | `string`           | `KnackDateField`          |
| `field_27`  | Number of Refills  | `number`           | `number`                  |
| `field_28`  | Status             | `string`           | `string`                  |
| `field_75`  | Patient            | `string`           | `KnackConnectionField[]`  |
| `field_76`  | Provider           | `string`           | `KnackConnectionField[]`  |

### Connection Fields (Relationships)

Knack uses **connection fields** to represent relationships between objects. For example, an appointment's patient reference:

```typescript
interface KnackConnectionField {
  id: string;         // The Knack record ID of the connected record
  identifier: string; // The display name (e.g., "John Smith")
}

// An appointment's patient field (field_70_raw):
[{ id: "6789abc...", identifier: "Jane Doe" }]
```

Helper functions extract display names from connections:

```typescript
function getPatientName(connectionRaw?: KnackConnectionField[]): string {
  if (!connectionRaw || connectionRaw.length === 0) return "Unassigned";
  return connectionRaw[0].identifier;
}
```

### Knack Field Type Interfaces

```typescript
// Structured name with first/last/middle/title
interface KnackNameField {
  first: string;
  last: string;
  middle?: string;
  title?: string;
  full?: string;
}

// Date with multiple format options
interface KnackDateField {
  date: string;
  date_formatted: string;
  hours?: string;
  minutes?: string;
  am_pm?: string;
  unix_timestamp?: number;
  iso_timestamp?: string;
}

// Phone with parsed components
interface KnackPhoneField {
  formatted: string;
  full: string;
  number: string;
  area?: string;
}

// Address with full breakdown
interface KnackAddressField {
  street: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}
```

---

## Healthcare Lookup System

MedPortal integrates with six healthcare data APIs from the [NLM Clinical Tables API](https://clinicaltables.nlm.nih.gov/) to provide real-time autocomplete for medical terminology. All lookups are performed client-side against public NLM endpoints.

### Lookup Components

| Component                    | API                   | Data Source                        | Icon           | Knack Field   |
|------------------------------|-----------------------|------------------------------------|----------------|---------------|
| `NpiPhysicianAutocomplete`   | NPI Individual Records| CMS National Provider Identifier   | `UserRound`    | `field_99`    |
| `PhysiciansMultiInput`       | NPI Individual Records| CMS National Provider Identifier   | `UserRound`    | `field_103`   |
| `MedicationAutocomplete`     | RxTerms               | RxNorm Clinical Drug Terminology   | `Pill`         | `field_80`    |
| `MedicalConditionsInput`     | Medical Conditions    | Regenstrief Medical Gopher         | `Stethoscope`  | `field_47`    |
| `DiagnosisInput`             | ICD-10-CM             | CMS ICD-10-CM Classification       | `ClipboardList`| `field_100`   |
| `PhenotypesInput`            | HPO                   | Human Phenotype Ontology           | `Activity`     | `field_102`   |
| `ProceduresInput`            | HCPCS                 | CMS Procedure Coding System        | `Scissors`     | `field_101`   |

#### How Lookups Work

Each lookup component follows the same pattern:

1. **User types** in an input field (minimum 2 characters)
2. **Debounced API call** (300ms) hits the NLM Clinical Tables API
3. **Dropdown shows results** with codes always visible during search
4. **User selects** an item, which is formatted according to settings
5. **Value is stored** in the Knack text field via the proxy API

**Example: ICD-10-CM Diagnosis Lookup**

```
User types: "diab"
    │
    ▼
GET https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&terms=diab
    │
    ▼
Response: [10, [...], null, [["E11.9","Type 2 diabetes mellitus without complications"], ...]]
    │
    ▼
Dropdown shows: "E11.9 - Type 2 diabetes mellitus without complications"
    │
    ▼
User selects → Stored as: "E11.9 - Type 2 diabetes..." (based on settings)
```

#### Multi-Select Lookup Components

The Diagnosis, Phenotype, Procedure, Medical Conditions, and Physicians components support **multiple selections** displayed as removable badges:

```
┌─────────────────────────────────────────────────────┐
│ [E11.9 - Type 2 diabetes ✕] [J45.909 - Asthma ✕]  │
│                                                      │
│ Search diagnoses...                          📋     │
└─────────────────────────────────────────────────────┘
```

### Code Display Settings

Each lookup has configurable display settings stored in `localStorage`. Users can control whether medical codes are shown and where they appear relative to the description.

| Setting Key                      | Controls              | Options                              |
|----------------------------------|-----------------------|--------------------------------------|
| `medportal_physician_settings`   | NPI, phone, fax, addr | Toggle each field on/off             |
| `medportal_show_rxcui`           | RxCUI code            | Show/hide                            |
| `medportal_condition_settings`   | ICD-10 and ICD-9 codes| Toggle each + prefix/append position |
| `medportal_diagnosis_settings`   | ICD-10-CM code        | Toggle + prefix/append position      |
| `medportal_phenotype_settings`   | HPO code              | Toggle + prefix/append position      |
| `medportal_procedure_settings`   | HCPCS code            | Toggle + prefix/append position      |

**Display format examples:**

```
Prefix mode:  "E11.9 - Type 2 diabetes mellitus without complications"
Append mode:  "Type 2 diabetes mellitus without complications [E11.9]"
Code hidden:  "Type 2 diabetes mellitus without complications"
```

**Important behavior**: Codes are **always** shown in the dropdown during search (so clinicians can verify the correct code), but only saved/displayed in the field based on the user's settings.

**Settings implementation pattern:**

```typescript
interface DiagnosisSettings {
  showCode: boolean;
  codePosition: "prefix" | "append";
}

function getDiagnosisSettings(): DiagnosisSettings {
  const saved = localStorage.getItem("medportal_diagnosis_settings");
  if (saved) return JSON.parse(saved);
  return { showCode: true, codePosition: "prefix" };
}

function formatDiagnosis(code: string, description: string): string {
  const settings = getDiagnosisSettings();
  if (!settings.showCode) return description;
  if (settings.codePosition === "prefix") return `${code} - ${description}`;
  return `${description} [${code}]`;
}
```

### Multi-Value List Storage

Multi-select fields (diagnosis codes, procedures, phenotypes, conditions, physicians) store multiple values in a single Knack text field using **JSON array format**:

```typescript
// Stored value in Knack:
'["E11.9 - Type 2 diabetes","J45.909 - Asthma, unspecified"]'

// Parse for display:
function parseListField(value: string): string[] {
  if (value.trim().startsWith('[')) {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  }
  // Fallback: comma-separated (legacy data)
  return value.split(',').map(item => item.trim());
}

// Serialize for storage:
function serializeListField(items: string[]): string {
  return JSON.stringify(items);
}
```

JSON array format was chosen over comma-separated strings because medical terms and physician names frequently contain commas (e.g., "Smith, John MD" or "Diabetes mellitus, type 2").

---

## Tech Stack

| Layer      | Technology                                                  |
|------------|-------------------------------------------------------------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui        |
| Routing    | Wouter                                                      |
| State      | TanStack React Query v5                                     |
| Backend    | Express.js, TypeScript                                      |
| Database   | Knack (BaaS) via REST API                                   |
| Local DB   | PostgreSQL via Drizzle ORM (user auth/sessions)             |
| Icons      | Lucide React                                                |
| APIs       | NLM Clinical Tables, Knack REST API                         |

## Project Structure

```
├── client/
│   └── src/
│       ├── components/
│       │   ├── diagnosis-input.tsx         # ICD-10-CM multi-select lookup
│       │   ├── phenotypes-input.tsx        # HPO multi-select lookup
│       │   ├── procedures-input.tsx        # HCPCS multi-select lookup
│       │   ├── medical-conditions-input.tsx# ICD-10/ICD-9 conditions lookup
│       │   ├── medication-autocomplete.tsx # RxTerms medication lookup
│       │   ├── npi-physician-autocomplete.tsx  # NPI single physician lookup
│       │   ├── physicians-multi-input.tsx  # NPI multi physician lookup
│       │   ├── app-sidebar.tsx            # Navigation sidebar
│       │   ├── page-header.tsx            # Reusable page header
│       │   ├── stats-card.tsx             # Dashboard stat cards
│       │   ├── status-badge.tsx           # Status indicators
│       │   └── ui/                        # shadcn/ui primitives
│       ├── pages/
│       │   ├── dashboard.tsx              # Overview with stats
│       │   ├── patients.tsx               # Patient list
│       │   ├── patient-profile.tsx        # Patient detail view
│       │   ├── patient-new.tsx            # Create patient
│       │   ├── patient-edit.tsx           # Edit patient
│       │   ├── appointments.tsx           # Appointment list
│       │   ├── appointment-details.tsx    # Appointment detail view
│       │   ├── appointment-new.tsx        # Create appointment
│       │   ├── appointment-edit.tsx       # Edit appointment
│       │   ├── prescriptions.tsx          # Prescription list
│       │   ├── prescription-details.tsx   # Prescription detail view
│       │   ├── prescription-new.tsx       # Create prescription
│       │   ├── prescription-edit.tsx      # Edit prescription
│       │   ├── diagnoses.tsx              # Diagnoses list
│       │   ├── insurance.tsx              # Insurance companies
│       │   ├── settings.tsx               # App settings + lookup config
│       │   └── help.tsx                   # Help/documentation
│       └── lib/
│           ├── queryClient.ts             # TanStack Query config
│           └── utils.ts                   # parseListField, serializeListField
├── server/
│   ├── routes.ts                          # Express API routes (Knack proxy)
│   └── storage.ts                         # Local DB storage interface
├── shared/
│   └── schema.ts                          # TypeScript types, Knack field maps
└── README.md
```

## Environment Variables

| Variable        | Required | Description                                        |
|-----------------|----------|----------------------------------------------------|
| `KNACK_API_KEY` | Yes      | Knack REST API key for backend data access          |
| `DATABASE_URL`  | Yes      | PostgreSQL connection string (Drizzle ORM)          |
| `SESSION_SECRET`| No       | Session encryption key                              |

## Getting Started

1. Set the required environment variables (`KNACK_API_KEY`, `DATABASE_URL`)
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open the app at `http://localhost:5000`

The Express server runs on port 5000 and serves both the API and the Vite-built frontend.
