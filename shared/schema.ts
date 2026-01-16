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

// Knack Object Keys
export const KNACK_OBJECTS = {
  ACCOUNTS: "object_1",
  NEW_PATIENT_FORMS: "object_2",
  DIAGNOSES: "object_3",
  INSURANCE_COMPANIES: "object_5",
  PRESCRIPTIONS: "object_6",
  APPOINTMENTS: "object_7",
} as const;

// Name field type from Knack
export interface KnackNameField {
  first: string;
  last: string;
  middle?: string;
  title?: string;
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

// Account (User) type - object_1
export interface Account {
  id: string;
  field_1: KnackNameField; // Name
  field_1_raw: KnackNameField;
  field_2: string; // Email
  field_2_raw: { email: string };
  field_4: string; // User Status (active, inactive, pending approval)
  field_4_raw: string;
  field_5: string[]; // User Roles
  field_5_raw: string[];
}

// New Patient Form type - object_2
export interface NewPatientForm {
  id: string;
  field_6: string; // First Name
  field_6_raw: string;
  field_7: string; // Last Name
  field_7_raw: string;
  field_8: string; // Date of Birth
  field_8_raw: { date: string; date_formatted: string };
  field_9: string; // Sex (Male/Female)
  field_9_raw: string;
  field_10: string; // Phone
  field_10_raw: KnackPhoneField;
  field_11: string; // Email
  field_11_raw: { email: string };
  field_12: string; // Address
  field_12_raw: KnackAddressField;
  field_13: string; // Status
  field_13_raw: string;
  field_14?: string; // Emergency Contact Name
  field_14_raw?: KnackNameField;
  field_15?: string; // Emergency Contact Phone
  field_15_raw?: KnackPhoneField;
  field_16?: string; // Insurance Company
  field_16_raw?: { id: string; identifier: string }[];
  field_17?: string; // Policy Number
  field_17_raw?: string;
}

// Diagnosis type - object_3
export interface Diagnosis {
  id: string;
  field_18: string; // Diagnosis Name
  field_18_raw: string;
  field_19: string; // Diagnosis Date
  field_19_raw: { date: string; date_formatted: string };
  field_20: string; // Notes
  field_20_raw: string;
  field_21?: string; // Patient connection
  field_21_raw?: { id: string; identifier: string }[];
  field_22?: string; // Status (Active, Resolved, Chronic)
  field_22_raw?: string;
}

// Insurance Company type - object_5
export interface InsuranceCompany {
  id: string;
  field_27: string; // Company Name
  field_27_raw: string;
  field_28: string; // Phone
  field_28_raw: KnackPhoneField;
  field_29?: string; // Website
  field_29_raw?: { url: string };
  field_30?: string; // Address
  field_30_raw?: KnackAddressField;
}

// Prescription type - object_6
export interface Prescription {
  id: string;
  field_31: string; // Medication Name
  field_31_raw: string;
  field_32: string; // Dosage
  field_32_raw: string;
  field_33: string; // Frequency
  field_33_raw: string;
  field_34: string; // Start Date
  field_34_raw: { date: string; date_formatted: string };
  field_35?: string; // End Date
  field_35_raw?: { date: string; date_formatted: string };
  field_36?: string; // Prescribing Doctor
  field_36_raw?: string;
  field_37?: string; // Patient connection
  field_37_raw?: { id: string; identifier: string }[];
  field_38?: string; // Status (Active, Completed, Discontinued)
  field_38_raw?: string;
  field_39?: string; // Notes
  field_39_raw?: string;
}

// Appointment type - object_7
export interface Appointment {
  id: string;
  field_40: string; // Appointment Date/Time
  field_40_raw: { date: string; date_formatted: string; hours: string; minutes: string; am_pm: string };
  field_41: string; // Patient connection
  field_41_raw: { id: string; identifier: string }[];
  field_42: string; // Appointment Type (Consultation, Follow-up, Check-up, Emergency)
  field_42_raw: string;
  field_43: string; // Status (Scheduled, Confirmed, Completed, Cancelled, No-show)
  field_43_raw: string;
  field_44?: string; // Doctor/Provider
  field_44_raw?: string;
  field_45?: string; // Notes
  field_45_raw?: string;
  field_46?: string; // Duration (minutes)
  field_46_raw?: number;
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

// Insert schemas for creating new records
export const insertPatientFormSchema = z.object({
  field_6: z.string().min(1, "First name is required"),
  field_7: z.string().min(1, "Last name is required"),
  field_8: z.string().min(1, "Date of birth is required"),
  field_9: z.string().min(1, "Sex is required"),
  field_10: z.string().optional(),
  field_11: z.string().email("Valid email is required"),
  field_12: z.string().optional(),
  field_13: z.string().default("pending"),
});

export const insertAppointmentSchema = z.object({
  field_40: z.string().min(1, "Appointment date/time is required"),
  field_41: z.array(z.string()).min(1, "Patient is required"),
  field_42: z.string().min(1, "Appointment type is required"),
  field_43: z.string().default("Scheduled"),
  field_44: z.string().optional(),
  field_45: z.string().optional(),
  field_46: z.number().optional(),
});

export const insertPrescriptionSchema = z.object({
  field_31: z.string().min(1, "Medication name is required"),
  field_32: z.string().min(1, "Dosage is required"),
  field_33: z.string().min(1, "Frequency is required"),
  field_34: z.string().min(1, "Start date is required"),
  field_35: z.string().optional(),
  field_36: z.string().optional(),
  field_37: z.array(z.string()).optional(),
  field_38: z.string().default("Active"),
  field_39: z.string().optional(),
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
