# Medical Office Web App - Design Guidelines

## Design Approach
**System-Based Approach**: Leveraging Material Design principles adapted for healthcare, prioritizing clarity, accessibility, and professional trust. Drawing inspiration from modern healthcare platforms like Epic MyChart and ZocDoc for patient-facing interfaces, and healthcare admin dashboards for staff workflows.

## Core Design Principles
1. **Clinical Trust**: Professional, clean aesthetic that instills confidence
2. **Information Clarity**: Data-dense layouts with exceptional readability
3. **Efficient Workflows**: Minimize clicks, optimize for task completion
4. **Accessibility First**: WCAG 2.1 AA compliant throughout

## Typography
- **Primary Font**: Inter (Google Fonts) - Clean, highly readable for medical data
- **Headings**: Font weights 600-700, sizes from text-xl to text-4xl
- **Body Text**: Font weight 400-500, text-base (16px) minimum for accessibility
- **Data Tables**: Font weight 400, text-sm with increased line-height (1.6)
- **Labels**: Font weight 500, text-sm, uppercase tracking for form fields

## Layout System
**Spacing Primitives**: Tailwind units of 3, 4, 6, 8, 12, 16, 20
- Component padding: p-6 to p-8
- Section spacing: py-12 to py-20
- Card spacing: p-6 with gap-6 for content
- Form fields: mb-6 consistent spacing

**Grid Structure**:
- Dashboard: 12-column grid with sidebar (3 columns) + main content (9 columns)
- Forms: Single column max-w-2xl for optimal readability
- Data tables: Full-width with horizontal scroll on mobile
- Card grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

## Component Library

### Navigation
- **Top Navigation Bar**: Fixed header with app logo, user profile, notifications
- **Sidebar Navigation**: Collapsible on mobile, persistent on desktop with icon + label pattern
- **Breadcrumbs**: Show current location in multi-step forms and nested views

### Forms (Critical for Patient Intake)
- **Input Fields**: Full-width with floating labels, clear focus states (2px border)
- **Field Groups**: Logical sections with subtle dividers and group headings
- **Multi-Step Forms**: Progress indicator at top, step numbers, next/back navigation
- **Validation**: Inline error messages below fields, success states with checkmarks
- **Required Fields**: Asterisk + "Required" label, clear visual hierarchy

### Data Display
- **Patient Cards**: Rounded corners (rounded-lg), shadow-md, photo + key info layout
- **Appointment Cards**: Time-based layout with status badges, quick actions
- **Data Tables**: Striped rows, sticky headers, sortable columns, row hover states
- **Status Badges**: Rounded-full pills with semantic colors (pending, confirmed, completed)

### Actions
- **Primary Buttons**: Solid fill, rounded-md, px-6 py-3, clear active/hover states
- **Secondary Buttons**: Outlined style with border-2
- **Icon Buttons**: Rounded-full for compact actions, consistent sizing (h-10 w-10)
- **FAB (Floating Action Button)**: Bottom-right for primary actions like "New Appointment"

### Overlays
- **Modals**: Centered with backdrop blur, max-w-2xl, smooth entrance animation
- **Drawers**: Slide from right for detail views and forms
- **Notifications**: Toast style, top-right position, auto-dismiss with manual close option

## Page Layouts

### Patient Portal Landing
- **Hero Section**: Full-width banner (60vh) with welcoming medical imagery, blurred button backgrounds for "Schedule Appointment" and "View Records" CTAs
- **Quick Actions Grid**: 3-column grid of large cards for common tasks
- **Upcoming Appointments**: Timeline-style list with date markers
- **Recent Forms**: Card grid showing completion status

### Patient Intake Forms
- **Multi-Step Layout**: Left sidebar with step progress, main form area max-w-2xl centered
- **Section Headers**: Clear typography hierarchy with icons
- **Auto-Save Indicator**: Subtle notification of progress saved
- **Navigation**: Sticky footer with Previous/Next/Save Draft buttons

### Admin Dashboard
- **Metrics Row**: 4-column grid of stat cards with icons and trend indicators
- **Calendar View**: Full-width integrated calendar for appointments
- **Recent Activity**: Feed-style list with timestamps and quick actions
- **Patient Search**: Prominent search bar with filters dropdown

## Images
- **Hero Image**: Professional medical office waiting room or friendly healthcare provider consultation scene (approx. 1920x800px), subtle overlay for text readability
- **Section Backgrounds**: Abstract medical patterns (ECG lines, molecular structures) as subtle watermarks at 10% opacity
- **Profile Photos**: Circular avatars (h-12 w-12 for lists, h-24 w-24 for profiles)
- **Empty States**: Friendly illustrations for "No appointments scheduled" etc.

## Animations
**Minimal and Purposeful**:
- Page transitions: Subtle fade-in (duration-200)
- Form validation: Shake animation for errors
- Loading states: Skeleton screens, no spinners unless required
- Modal entrance: Scale + fade (duration-300)

## Accessibility Implementations
- Minimum touch targets: 44x44px on all interactive elements
- Keyboard navigation: Clear focus indicators throughout (ring-2 ring-offset-2)
- Screen reader: Proper ARIA labels on all form fields and interactive elements
- Form inputs: High contrast labels, clear error states with text + color

This design creates a trustworthy, efficient medical platform that balances professional aesthetics with user-friendly workflows for both patients and staff.