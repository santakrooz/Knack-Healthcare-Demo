import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Keep the users table for storage interface compatibility
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Knack Application ID
export const KNACK_APP_ID = "696ac7e9d09e7f3ff5b8cfa6";

// Knack Object Keys - Updated based on actual Knack structure
export const KNACK_OBJECTS = {
  ACCOUNTS: "object_3",          // Contains both Staff and Patients
  NEW_PATIENT_FORMS: "object_4", // Patient intake forms (empty)
  DIAGNOSES: "object_5",         // Diagnoses
  PRESCRIPTIONS: "object_6",     // Prescriptions
  APPOINTMENTS: "object_7",      // Appointments
  INSURANCE_COMPANIES: "object_8", // Insurance companies
} as const;

// Name field type from Knack
export interface KnackNameField {
  first: string;
  last: string;
  middle?: string;
  title?: string;
  full?: string;
}

// Address field type from Knack
export interface KnackAddressField {
  street: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

// Phone field type from Knack
export interface KnackPhoneField {
  formatted: string;
  full: string;
  number: string;
  area?: string;
}

// Email field type from Knack
export interface KnackEmailField {
  email: string;
  label?: string;
}

// Date field type from Knack
export interface KnackDateField {
  date: string;
  date_formatted: string;
  hours?: string;
  minutes?: string;
  am_pm?: string;
  unix_timestamp?: number;
  iso_timestamp?: string;
  timestamp?: string;
  time?: number;
  time_formatted?: string;
}

// Connection field type from Knack
export interface KnackConnectionField {
  id: string;
  identifier: string;
}

// Account/User type - object_3 (includes both Staff and Patients)
export interface Account {
  id: string;
  account_status?: string;
  approval_status?: string;
  profile_keys?: string;
  profile_keys_raw?: KnackConnectionField[];
  
  // Name - field_11
  field_11: string;
  field_11_raw: KnackNameField;
  
  // Email - field_12
  field_12: string;
  field_12_raw: KnackEmailField;
  
  // Password - field_13
  field_13?: string;
  
  // User Status - field_14 (active, pending approval, etc.)
  field_14: string;
  field_14_raw: string;
  
  // Profile/Role - field_15
  field_15?: string;
  field_15_raw?: string[];
  
  // Profile Image - field_64
  field_64?: string;
  field_64_raw?: {
    url: string;
    thumb_url?: string;
    filename?: string;
  };
  
  // Role - field_66 (Physician, Medical Assistant, etc.)
  field_66?: string;
  field_66_raw?: string[];
  
  // Phone - field_67
  field_67?: string;
  field_67_raw?: KnackPhoneField;
  
  // Specialty - field_72
  field_72?: string;
  field_72_raw?: string[];
  
  // Full description - field_73
  field_73?: string;
  field_73_raw?: string;
}

// Prescription type - object_6 (Actual field mappings from API)
export interface Prescription {
  id: string;
  
  // Medication & Dosage - field_80
  field_80: string;
  field_80_raw: string;
  
  // Instructions - field_24
  field_24: string;
  field_24_raw: string;
  
  // Issue Date - field_25
  field_25: string;
  field_25_raw: KnackDateField;
  
  // Refill Expiration Date - field_26
  field_26: string;
  field_26_raw: KnackDateField;
  
  // Number of Refills - field_27
  field_27: number;
  field_27_raw: number;
  
  // Status - field_28 (Active, Inactive, etc.)
  field_28: string;
  field_28_raw: string;
  
  // Patient connection - field_75
  field_75?: string;
  field_75_raw?: KnackConnectionField[];
  
  // Provider connection - field_76
  field_76?: string;
  field_76_raw?: KnackConnectionField[];
}

// Appointment type - object_7 (Actual field mappings from API)
export interface Appointment {
  id: string;
  
  // Appointment Date/Time - field_29
  field_29: string;
  field_29_raw: KnackDateField;
  
  // Status - field_30 (Pending, Scheduled, Requested, etc.)
  field_30: string;
  field_30_raw: string;
  
  // Notes - field_31
  field_31?: string;
  field_31_raw?: string;
  
  // Reason/Type - field_32
  field_32?: string;
  field_32_raw?: string;
  
  // Created Date - field_33
  field_33?: string;
  field_33_raw?: KnackDateField;
  
  // Updated Date - field_34
  field_34?: string;
  field_34_raw?: KnackDateField;
  
  // Patient connection - field_74
  field_74?: string;
  field_74_raw?: KnackConnectionField[];
  
  // Provider connection - field_77
  field_77?: string;
  field_77_raw?: KnackConnectionField[];
  
  // Prescription connection - field_78
  field_78?: string;
  field_78_raw?: KnackConnectionField[];
}

// Diagnosis type - object_5
export interface Diagnosis {
  id: string;
  field_18?: string;
  field_18_raw?: string;
  field_19?: string;
  field_19_raw?: KnackDateField;
  field_20?: string;
  field_20_raw?: string;
  field_21?: string;
  field_21_raw?: KnackConnectionField[];
  field_22?: string;
  field_22_raw?: string;
}

// Insurance Company type - object_8
export interface InsuranceCompany {
  id: string;
  field_35?: string;
  field_35_raw?: string;
  field_36?: string;
  field_36_raw?: KnackPhoneField;
  field_37?: string;
  field_37_raw?: { url: string };
  field_38?: string;
  field_38_raw?: KnackAddressField;
}

// New Patient Form type - object_4
export interface NewPatientForm {
  id: string;
  field_6?: string;
  field_6_raw?: string;
  field_7?: string;
  field_7_raw?: string;
  field_8?: string;
  field_8_raw?: KnackDateField;
  field_9?: string;
  field_9_raw?: string;
  field_10?: string;
  field_10_raw?: KnackPhoneField;
}

// API Response types
export interface KnackRecordsResponse<T> {
  records: T[];
  total_pages: number;
  total_records: number;
  current_page: number;
}

export interface KnackRecordResponse<T> {
  record: T;
}

// Dashboard stats type
export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  activePrescriptions: number;
  pendingForms: number;
}

// Helper function to extract patient name from connection
export function getPatientName(connectionRaw?: KnackConnectionField[]): string {
  if (!connectionRaw || connectionRaw.length === 0) return "Unassigned";
  return connectionRaw[0].identifier;
}

// Helper function to extract provider name from connection
export function getProviderName(connectionRaw?: KnackConnectionField[]): string {
  if (!connectionRaw || connectionRaw.length === 0) return "Not assigned";
  return connectionRaw[0].identifier;
}

// Helper function to format Knack date
export function formatKnackDate(dateField?: KnackDateField): string {
  if (!dateField) return "N/A";
  return dateField.date_formatted || dateField.date || "N/A";
}

// Helper function to format Knack time
export function formatKnackTime(dateField?: KnackDateField): string {
  if (!dateField) return "";
  if (dateField.time_formatted) return dateField.time_formatted;
  if (dateField.hours && dateField.minutes && dateField.am_pm) {
    return `${dateField.hours}:${dateField.minutes} ${dateField.am_pm}`;
  }
  return "";
}

// Insert schemas for creating new records
export const insertPatientFormSchema = z.object({
  field_11: z.object({
    first: z.string().min(1, "First name is required"),
    last: z.string().min(1, "Last name is required"),
  }),
  field_12: z.string().email("Valid email is required"),
  field_14: z.string().default("active"),
});

export const insertAppointmentSchema = z.object({
  field_29: z.string().min(1, "Appointment date/time is required"),
  field_74: z.array(z.string()).min(1, "Patient is required"),
  field_30: z.string().default("Scheduled"),
  field_31: z.string().optional(),
  field_77: z.array(z.string()).optional(),
});

export const insertPrescriptionSchema = z.object({
  field_80: z.string().min(1, "Medication & dosage is required"),
  field_24: z.string().min(1, "Instructions are required"),
  field_25: z.string().min(1, "Issue date is required"),
  field_26: z.string().optional(),
  field_27: z.number().optional(),
  field_28: z.string().default("Active"),
  field_75: z.array(z.string()).optional(),
});

export const insertDiagnosisSchema = z.object({
  field_18: z.string().min(1, "Diagnosis name is required"),
  field_19: z.string().min(1, "Diagnosis date is required"),
  field_20: z.string().optional(),
  field_21: z.array(z.string()).optional(),
  field_22: z.string().default("Active"),
});

export type InsertPatientForm = z.infer<typeof insertPatientFormSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type InsertDiagnosis = z.infer<typeof insertDiagnosisSchema>;
