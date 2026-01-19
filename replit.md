# MedPortal - Medical Office Management System

## Overview

MedPortal is a modern medical office management web application designed for patient intake, appointments, prescriptions, diagnoses, and insurance company management. The application integrates with Knack as a backend-as-a-service for data storage and retrieval, providing a professional healthcare-focused user interface built with React and Express.

The system follows healthcare-specific design principles prioritizing clinical trust, information clarity, efficient workflows, and WCAG 2.1 AA accessibility compliance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite for development and production builds

The frontend follows a page-based architecture with shared components. Key pages include Dashboard, Patients, Appointments, Prescriptions, Diagnoses, Insurance, Settings, and Help. Reusable components like PageHeader, StatsCard, StatusBadge, and DataTableSkeleton provide consistent UI patterns.

#### Edit Page Pattern
Edit pages (patient-edit, appointment-edit, prescription-edit) use a two-component pattern to ensure forms are properly pre-populated:
1. **Outer component**: Fetches data using React Query, shows loading spinner while data loads
2. **Inner form component**: Receives data as props, uses `useState(() => getInitialFormData(data))` to initialize form with correct values

This pattern avoids timing issues where useState would initialize with empty values before data arrived.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: REST API endpoints proxying to Knack backend service
- **Development Server**: Vite middleware integration for HMR during development
- **Production**: Static file serving from built client assets

The server acts as a proxy layer between the React frontend and the Knack API, handling authentication headers and response formatting. Routes are defined in `server/routes.ts` with helper functions for Knack API communication.

### Data Layer
- **Primary Storage**: Knack (Backend-as-a-Service) accessed via REST API
- **Database Schema**: Drizzle ORM with PostgreSQL configuration (for user authentication/session storage)

#### Knack Objects Mapping (Updated January 2026)
| Object ID | Name | Key Fields |
|-----------|------|------------|
| object_1 | Accounts | field_1 (name), field_2 (email), field_4 (status) |
| object_2 | Patients | field_6 (name), field_7 (email), field_44 (phone), field_9 (status), field_46 (DOB), field_47 (medical history) |
| object_3 | Staff | field_11 (name), field_12 (email), field_66 (role), field_72 (specialty) |
| object_4 | New Patient Forms | (intake forms) |
| object_5 | Appointments | field_17 (date), field_18 (status), field_19 (preferred time), field_20 (reason), field_21 (scheduled date), field_70 (patient), field_71 (provider), field_99 (referring physician), field_100 (diagnosis - ICD-10-CM codes), field_101 (procedures - HCPCS codes), field_102 (phenotypes/symptoms - HPO codes) |
| object_6 | Prescriptions | field_80 (medication), field_24 (instructions), field_25 (issue date), field_26 (expiration), field_27 (refills), field_28 (status), field_75 (patient), field_76 (provider) |
| object_7 | Prescription Refill Requests | field_29 (request date), field_30 (status), field_74 (patient), field_77 (approved by), field_78 (prescriptions) |

**Important**: Patients (object_2) and Staff (object_3) are separate tables with different field structures:
- Patient names use `field_6` / `field_6_raw`
- Staff names use `field_11` / `field_11_raw`

The schema in `shared/schema.ts` defines TypeScript types for Knack data structures and maintains a local users table for potential authentication needs.

### Design System
- **Typography**: Inter font family
- **Color Scheme**: HSL-based CSS variables with semantic naming
- **Components**: shadcn/ui New York style variant
- **Accessibility**: WCAG 2.1 AA compliant design patterns

## External Dependencies

### Third-Party Services
- **Knack API**: Primary backend data storage (App ID: 696ac7e9d09e7f3ff5b8cfa6)
  - Requires `KNACK_API_KEY` environment variable
  - Base URL: https://api.knack.com/v1

### Database
- **PostgreSQL**: Required for Drizzle ORM operations
  - Requires `DATABASE_URL` environment variable
  - Used for user authentication and session storage

### Key NPM Dependencies
- `@tanstack/react-query`: Server state management
- `drizzle-orm` / `drizzle-zod`: Database ORM and validation
- `date-fns`: Date manipulation
- `lucide-react`: Icon library
- Radix UI primitives: Accessible UI components
- `wouter`: Client-side routing
- `express`: Backend server framework