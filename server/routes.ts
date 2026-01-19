import type { Express, Request, Response as ExpressResponse } from "express";
import { createServer, type Server } from "http";
import { KNACK_APP_ID, KNACK_OBJECTS } from "@shared/schema";

const KNACK_API_BASE = "https://api.knack.com/v1";

// Helper function to make Knack API requests
async function knackRequest(
  endpoint: string,
  method: string = "GET",
  body?: unknown
): Promise<globalThis.Response> {
  const headers: Record<string, string> = {
    "X-Knack-Application-Id": KNACK_APP_ID,
    "X-Knack-REST-API-Key": process.env.KNACK_API_KEY || "",
    "Content-Type": "application/json",
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${KNACK_API_BASE}${endpoint}`, options);
  return response;
}

// Helper to handle Knack API responses
async function handleKnackResponse(response: globalThis.Response, res: ExpressResponse) {
  const data = await response.json();
  if (!response.ok) {
    return res.status(response.status).json({
      error: data.message || "Knack API error",
      details: data,
    });
  }
  return res.json(data);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", async (_req: Request, res: ExpressResponse) => {
    try {
      // Fetch counts from all objects in parallel
      const [patientsRes, appointmentsRes, prescriptionsRes] = await Promise.all([
        knackRequest(`/objects/${KNACK_OBJECTS.PATIENTS}/records?rows_per_page=1`),
        knackRequest(`/objects/${KNACK_OBJECTS.APPOINTMENTS}/records?rows_per_page=1`),
        knackRequest(`/objects/${KNACK_OBJECTS.PRESCRIPTIONS}/records?rows_per_page=1`),
      ]);

      const [patientsData, appointmentsData, prescriptionsData] = await Promise.all([
        patientsRes.json(),
        appointmentsRes.json(),
        prescriptionsRes.json(),
      ]) as [any, any, any];

      // Count active prescriptions
      let activeRxCount = 0;
      if (prescriptionsData.records) {
        activeRxCount = prescriptionsData.records.filter(
          (rx: any) => rx.field_28_raw === "Active" || rx.field_28_raw === "active"
        ).length;
      }

      // Count pending appointments
      let pendingCount = 0;
      if (appointmentsData.records) {
        pendingCount = appointmentsData.records.filter(
          (apt: any) => apt.field_18_raw === "Pending" || apt.field_18_raw === "pending"
        ).length;
      }

      res.json({
        totalPatients: patientsData.total_records || 0,
        todayAppointments: appointmentsData.total_records || 0,
        activePrescriptions: prescriptionsData.total_records || activeRxCount,
        pendingForms: pendingCount,
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Patients endpoints (using Patients object - object_2)
  app.get("/api/patients", async (_req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.PATIENTS}/records?rows_per_page=100`
      );
      return handleKnackResponse(response, res);
    } catch (error) {
      console.error("Patients fetch error:", error);
      res.status(500).json({ error: "Failed to fetch patients" });
    }
  });

  app.get("/api/patients/recent", async (_req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.PATIENTS}/records?rows_per_page=5&sort_order=desc`
      );
      const data = await response.json() as any;
      res.json(data.records || []);
    } catch (error) {
      console.error("Recent patients error:", error);
      res.status(500).json({ error: "Failed to fetch recent patients" });
    }
  });

  app.get("/api/patients/:id", async (req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.PATIENTS}/records/${req.params.id}`
      );
      return handleKnackResponse(response, res);
    } catch (error) {
      console.error("Patient fetch error:", error);
      res.status(500).json({ error: "Failed to fetch patient" });
    }
  });

  app.post("/api/patients", async (req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.PATIENTS}/records`,
        "POST",
        req.body
      );
      return handleKnackResponse(response, res);
    } catch (error) {
      console.error("Patient create error:", error);
      res.status(500).json({ error: "Failed to create patient" });
    }
  });

  app.put("/api/patients/:id", async (req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.PATIENTS}/records/${req.params.id}`,
        "PUT",
        req.body
      );
      return handleKnackResponse(response, res);
    } catch (error) {
      console.error("Patient update error:", error);
      res.status(500).json({ error: "Failed to update patient" });
    }
  });

  app.delete("/api/patients/:id", async (req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.PATIENTS}/records/${req.params.id}`,
        "DELETE"
      );
      if (response.ok) {
        res.json({ success: true });
      } else {
        const data = await response.json() as any;
        res.status(response.status).json({ error: data.message });
      }
    } catch (error) {
      console.error("Patient delete error:", error);
      res.status(500).json({ error: "Failed to delete patient" });
    }
  });

  // Staff endpoints (using Staff/Accounts object - object_3)
  app.get("/api/staff", async (_req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.STAFF}/records?rows_per_page=100`
      );
      return handleKnackResponse(response, res);
    } catch (error) {
      console.error("Staff fetch error:", error);
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  // Appointments endpoints
  app.get("/api/appointments", async (_req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.APPOINTMENTS}/records?rows_per_page=100`
      );
      return handleKnackResponse(response, res);
    } catch (error) {
      console.error("Appointments fetch error:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/today", async (_req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.APPOINTMENTS}/records?rows_per_page=20&sort_field=field_21&sort_order=asc`
      );
      const data = await response.json() as any;
      
      // Filter for today's appointments
      const today = new Date().toISOString().split("T")[0];
      const todayAppointments = (data.records || []).filter((apt: any) => {
        if (apt.field_21_raw?.date) {
          return apt.field_21_raw.date.includes(today.replace(/-/g, "/"));
        }
        return true;
      });
      
      res.json(todayAppointments);
    } catch (error) {
      console.error("Today appointments error:", error);
      res.status(500).json({ error: "Failed to fetch today's appointments" });
    }
  });

  app.get("/api/appointments/:id", async (req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.APPOINTMENTS}/records/${req.params.id}`
      );
      return handleKnackResponse(response, res);
    } catch (error) {
      console.error("Appointment fetch error:", error);
      res.status(500).json({ error: "Failed to fetch appointment" });
    }
  });

  app.post("/api/appointments", async (req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.APPOINTMENTS}/records`,
        "POST",
        req.body
      );
      return handleKnackResponse(response, res);
    } catch (error) {
      console.error("Appointment create error:", error);
      res.status(500).json({ error: "Failed to create appointment" });
    }
  });

  app.put("/api/appointments/:id", async (req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.APPOINTMENTS}/records/${req.params.id}`,
        "PUT",
        req.body
      );
      return handleKnackResponse(response, res);
    } catch (error) {
      console.error("Appointment update error:", error);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", async (req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.APPOINTMENTS}/records/${req.params.id}`,
        "DELETE"
      );
      if (response.ok) {
        res.json({ success: true });
      } else {
        const data = await response.json() as any;
        res.status(response.status).json({ error: data.message });
      }
    } catch (error) {
      console.error("Appointment delete error:", error);
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  });

  // Prescriptions endpoints
  app.get("/api/prescriptions", async (_req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.PRESCRIPTIONS}/records?rows_per_page=100`
      );
      return handleKnackResponse(response, res);
    } catch (error) {
      console.error("Prescriptions fetch error:", error);
      res.status(500).json({ error: "Failed to fetch prescriptions" });
    }
  });

  app.get("/api/prescriptions/:id", async (req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.PRESCRIPTIONS}/records/${req.params.id}`
      );
      return handleKnackResponse(response, res);
    } catch (error) {
      console.error("Prescription fetch error:", error);
      res.status(500).json({ error: "Failed to fetch prescription" });
    }
  });

  app.post("/api/prescriptions", async (req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.PRESCRIPTIONS}/records`,
        "POST",
        req.body
      );
      return handleKnackResponse(response, res);
    } catch (error) {
      console.error("Prescription create error:", error);
      res.status(500).json({ error: "Failed to create prescription" });
    }
  });

  app.put("/api/prescriptions/:id", async (req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.PRESCRIPTIONS}/records/${req.params.id}`,
        "PUT",
        req.body
      );
      return handleKnackResponse(response, res);
    } catch (error) {
      console.error("Prescription update error:", error);
      res.status(500).json({ error: "Failed to update prescription" });
    }
  });

  app.delete("/api/prescriptions/:id", async (req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.PRESCRIPTIONS}/records/${req.params.id}`,
        "DELETE"
      );
      if (response.ok) {
        res.json({ success: true });
      } else {
        const data = await response.json() as any;
        res.status(response.status).json({ error: data.message });
      }
    } catch (error) {
      console.error("Prescription delete error:", error);
      res.status(500).json({ error: "Failed to delete prescription" });
    }
  });

  // Note: Diagnoses endpoints removed - no Diagnoses object exists in current Knack schema
  // The available objects are: Accounts, Patients, Staff, Appointments, Prescriptions, Prescription Refill Requests
  app.get("/api/diagnoses", async (_req: Request, res: ExpressResponse) => {
    res.json({ records: [], total_records: 0, message: "Diagnoses table not configured in Knack" });
  });

  app.get("/api/diagnoses/:id", async (_req: Request, res: ExpressResponse) => {
    res.status(404).json({ error: "Diagnoses table not configured in Knack" });
  });

  app.post("/api/diagnoses", async (_req: Request, res: ExpressResponse) => {
    res.status(501).json({ error: "Diagnoses table not configured in Knack" });
  });

  app.put("/api/diagnoses/:id", async (_req: Request, res: ExpressResponse) => {
    res.status(501).json({ error: "Diagnoses table not configured in Knack" });
  });

  app.delete("/api/diagnoses/:id", async (_req: Request, res: ExpressResponse) => {
    res.status(501).json({ error: "Diagnoses table not configured in Knack" });
  });

  // Insurance companies endpoints
  app.get("/api/insurance", async (_req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.INSURANCE_COMPANIES}/records?rows_per_page=100`
      );
      return handleKnackResponse(response, res);
    } catch (error) {
      console.error("Insurance fetch error:", error);
      res.status(500).json({ error: "Failed to fetch insurance companies" });
    }
  });

  app.get("/api/insurance/:id", async (req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.INSURANCE_COMPANIES}/records/${req.params.id}`
      );
      return handleKnackResponse(response, res);
    } catch (error) {
      console.error("Insurance fetch error:", error);
      res.status(500).json({ error: "Failed to fetch insurance company" });
    }
  });

  app.post("/api/insurance", async (req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.INSURANCE_COMPANIES}/records`,
        "POST",
        req.body
      );
      return handleKnackResponse(response, res);
    } catch (error) {
      console.error("Insurance create error:", error);
      res.status(500).json({ error: "Failed to create insurance company" });
    }
  });

  app.put("/api/insurance/:id", async (req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.INSURANCE_COMPANIES}/records/${req.params.id}`,
        "PUT",
        req.body
      );
      return handleKnackResponse(response, res);
    } catch (error) {
      console.error("Insurance update error:", error);
      res.status(500).json({ error: "Failed to update insurance company" });
    }
  });

  app.delete("/api/insurance/:id", async (req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.INSURANCE_COMPANIES}/records/${req.params.id}`,
        "DELETE"
      );
      if (response.ok) {
        res.json({ success: true });
      } else {
        const data = await response.json() as any;
        res.status(response.status).json({ error: data.message });
      }
    } catch (error) {
      console.error("Insurance delete error:", error);
      res.status(500).json({ error: "Failed to delete insurance company" });
    }
  });

  // Healthcare Data Lookups - fetch version info from NLM Clinical Tables
  app.get("/api/healthcare-lookups/versions", async (_req: Request, res: ExpressResponse) => {
    try {
      // Fetch version info from official API endpoints
      const [
        npiVersionRes,
        rxtermsVersionRes,
        conditionsDocsRes,
        icd10cmVersionRes,
        hcpcsVersionRes,
        hpoDocsRes,
      ] = await Promise.all([
        fetch("https://clinicaltables.nlm.nih.gov/api/npi_idv/v3/data_version"),
        fetch("https://clinicaltables.nlm.nih.gov/api/rxterms/v3/data_version"),
        fetch("https://clinicaltables.nlm.nih.gov/apidoc/conditions/v3/doc.html"),
        fetch("https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/data_version"),
        fetch("https://clinicaltables.nlm.nih.gov/api/hcpcs/v3/data_version"),
        fetch("https://clinicaltables.nlm.nih.gov/apidoc/hpo/v3/doc.html"),
      ]);

      const [npiVersionText, rxtermsVersionText, conditionsHtml, icd10cmVersionText, hcpcsVersionText, hpoHtml] = await Promise.all([
        npiVersionRes.text(),
        rxtermsVersionRes.text(),
        conditionsDocsRes.text(),
        icd10cmVersionRes.text(),
        hcpcsVersionRes.text(),
        hpoDocsRes.text(),
      ]);

      // Extract version strings
      const npiVersion = npiVersionRes.ok ? npiVersionText.trim() : "Unknown";
      const rxtermsVersion = rxtermsVersionRes.ok ? rxtermsVersionText.trim() : "Unknown";
      const icd10cmVersion = icd10cmVersionRes.ok ? icd10cmVersionText.trim() : "Unknown";
      const hcpcsVersion = hcpcsVersionRes.ok ? hcpcsVersionText.trim() : "Unknown";

      // Conditions: Extract from download link "cond_proc_download-2025-10-01.json.zip"
      const conditionsVersionMatch = conditionsHtml.match(/cond_proc_download-(\d{4}-\d{2}-\d{2})\.json\.zip/i);
      const conditionsVersion = conditionsVersionMatch ? conditionsVersionMatch[1] : "Unknown";

      // HPO: Extract version from documentation page
      const hpoVersionMatch = hpoHtml.match(/hpo_download-(\d{4}-\d{2}-\d{2})\.json\.zip/i);
      const hpoVersion = hpoVersionMatch ? hpoVersionMatch[1] : "Unknown";

      res.json({
        physicians: {
          name: "Physician Lookup",
          apiName: "API for NPI (National Provider Identifier) Records - Individuals",
          version: npiVersion,
          versionLabel: "Data version",
          sources: [
            { name: "NPI (National Provider Identifier) records", provider: "CMS (Centers for Medicare & Medicaid Services)" },
            { name: "Health Care Provider Taxonomy", provider: "NUCC (National Uniform Claim Committee)" },
            { name: "Crosswalk Medicare Provider/Supplier to Healthcare Provider Taxonomy", provider: "CMS (Centers for Medicare & Medicaid Services)" },
          ],
          docsUrl: "https://clinicaltables.nlm.nih.gov/apidoc/npi_idv/v3/doc.html",
        },
        prescriptions: {
          name: "Prescription Lookup",
          apiName: "API for RxTerms",
          version: rxtermsVersion,
          versionLabel: "RxTerms version",
          sources: [
            { name: "RxTerms", provider: "Derived from RxNorm, the U.S. terminology standard for clinical drugs" },
          ],
          docsUrl: "https://clinicaltables.nlm.nih.gov/apidoc/rxterms/v3/doc.html",
        },
        conditions: {
          name: "Medical Conditions Lookup",
          apiName: "API for Medical Conditions",
          version: conditionsVersion,
          versionLabel: "Data version",
          sources: [
            { name: "Medical Conditions List", provider: "Derived from Regenstrief Institute's Medical Gopher program" },
          ],
          docsUrl: "https://clinicaltables.nlm.nih.gov/apidoc/conditions/v3/doc.html",
        },
        diagnosis: {
          name: "Diagnosis Lookup",
          apiName: "API for ICD-10-CM",
          version: icd10cmVersion,
          versionLabel: "ICD-10-CM version",
          sources: [
            { name: "ICD-10-CM (International Classification of Diseases)", provider: "CMS (Centers for Medicare & Medicaid Services)" },
          ],
          docsUrl: "https://clinicaltables.nlm.nih.gov/apidoc/icd10cm/v3/doc.html",
        },
        procedures: {
          name: "Procedures Lookup",
          apiName: "API for HCPCS",
          version: hcpcsVersion,
          versionLabel: "HCPCS version",
          sources: [
            { name: "HCPCS (Healthcare Common Procedure Coding System)", provider: "CMS (Centers for Medicare & Medicaid Services)" },
          ],
          docsUrl: "https://clinicaltables.nlm.nih.gov/apidoc/hcpcs/v3/doc.html",
        },
        phenotypes: {
          name: "Phenotypes (Symptoms) Lookup",
          apiName: "API for Human Phenotype Ontology (HPO)",
          version: hpoVersion,
          versionLabel: "HPO version",
          sources: [
            { name: "Human Phenotype Ontology (HPO)", provider: "HPO Consortium - Standardized vocabulary for phenotypic abnormalities" },
          ],
          docsUrl: "https://clinicaltables.nlm.nih.gov/apidoc/hpo/v3/doc.html",
        },
      });
    } catch (error) {
      console.error("Healthcare lookups version fetch error:", error);
      res.status(500).json({ error: "Failed to fetch healthcare lookup versions" });
    }
  });

  return httpServer;
}
