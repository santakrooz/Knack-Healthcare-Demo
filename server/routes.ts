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
        knackRequest(`/objects/${KNACK_OBJECTS.NEW_PATIENT_FORMS}/records?rows_per_page=1`),
        knackRequest(`/objects/${KNACK_OBJECTS.APPOINTMENTS}/records?rows_per_page=1`),
        knackRequest(`/objects/${KNACK_OBJECTS.PRESCRIPTIONS}/records?rows_per_page=1`),
      ]);

      const [patientsData, appointmentsData, prescriptionsData] = await Promise.all([
        patientsRes.json(),
        appointmentsRes.json(),
        prescriptionsRes.json(),
      ]) as [any, any, any];

      // Get today's date for filtering
      const today = new Date().toISOString().split("T")[0];
      
      // Filter appointments for today (simplified - in production would use Knack filters)
      let todayCount = 0;
      let pendingCount = 0;
      let activeRxCount = 0;

      // Count today's appointments and pending forms from the data
      if (appointmentsData.records) {
        todayCount = appointmentsData.records.filter((apt: any) => {
          if (apt.field_40_raw?.date) {
            return apt.field_40_raw.date.startsWith(today);
          }
          return false;
        }).length;
      }

      if (patientsData.records) {
        pendingCount = patientsData.records.filter(
          (p: any) => p.field_13_raw === "pending"
        ).length;
      }

      if (prescriptionsData.records) {
        activeRxCount = prescriptionsData.records.filter(
          (rx: any) => rx.field_38_raw === "Active" || rx.field_38_raw === "active"
        ).length;
      }

      res.json({
        totalPatients: patientsData.total_records || 0,
        todayAppointments: appointmentsData.total_records || todayCount,
        activePrescriptions: prescriptionsData.total_records || activeRxCount,
        pendingForms: pendingCount,
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Patients endpoints
  app.get("/api/patients", async (_req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.NEW_PATIENT_FORMS}/records?rows_per_page=100`
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
        `/objects/${KNACK_OBJECTS.NEW_PATIENT_FORMS}/records?rows_per_page=5&sort_field=field_8&sort_order=desc`
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
        `/objects/${KNACK_OBJECTS.NEW_PATIENT_FORMS}/records/${req.params.id}`
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
        `/objects/${KNACK_OBJECTS.NEW_PATIENT_FORMS}/records`,
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
        `/objects/${KNACK_OBJECTS.NEW_PATIENT_FORMS}/records/${req.params.id}`,
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
        `/objects/${KNACK_OBJECTS.NEW_PATIENT_FORMS}/records/${req.params.id}`,
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
        `/objects/${KNACK_OBJECTS.APPOINTMENTS}/records?rows_per_page=20&sort_field=field_40&sort_order=asc`
      );
      const data = await response.json() as any;
      
      // Filter for today's appointments (simplified)
      const today = new Date().toISOString().split("T")[0];
      const todayAppointments = (data.records || []).filter((apt: any) => {
        if (apt.field_40_raw?.date) {
          return apt.field_40_raw.date.startsWith(today);
        }
        return true; // Include if no date filtering possible
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

  // Diagnoses endpoints
  app.get("/api/diagnoses", async (_req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.DIAGNOSES}/records?rows_per_page=100`
      );
      return handleKnackResponse(response, res);
    } catch (error) {
      console.error("Diagnoses fetch error:", error);
      res.status(500).json({ error: "Failed to fetch diagnoses" });
    }
  });

  app.get("/api/diagnoses/:id", async (req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.DIAGNOSES}/records/${req.params.id}`
      );
      return handleKnackResponse(response, res);
    } catch (error) {
      console.error("Diagnosis fetch error:", error);
      res.status(500).json({ error: "Failed to fetch diagnosis" });
    }
  });

  app.post("/api/diagnoses", async (req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.DIAGNOSES}/records`,
        "POST",
        req.body
      );
      return handleKnackResponse(response, res);
    } catch (error) {
      console.error("Diagnosis create error:", error);
      res.status(500).json({ error: "Failed to create diagnosis" });
    }
  });

  app.put("/api/diagnoses/:id", async (req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.DIAGNOSES}/records/${req.params.id}`,
        "PUT",
        req.body
      );
      return handleKnackResponse(response, res);
    } catch (error) {
      console.error("Diagnosis update error:", error);
      res.status(500).json({ error: "Failed to update diagnosis" });
    }
  });

  app.delete("/api/diagnoses/:id", async (req: Request, res: ExpressResponse) => {
    try {
      const response = await knackRequest(
        `/objects/${KNACK_OBJECTS.DIAGNOSES}/records/${req.params.id}`,
        "DELETE"
      );
      if (response.ok) {
        res.json({ success: true });
      } else {
        const data = await response.json() as any;
        res.status(response.status).json({ error: data.message });
      }
    } catch (error) {
      console.error("Diagnosis delete error:", error);
      res.status(500).json({ error: "Failed to delete diagnosis" });
    }
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

  return httpServer;
}
