import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Calendar, Clock, User, UserCheck, UserPlus, FileText, Loader2, ClipboardList, Scissors } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import { NPIPhysicianAutocomplete } from "@/components/npi-physician-autocomplete";
import { DiagnosisInput } from "@/components/diagnosis-input";
import { ProceduresInput } from "@/components/procedures-input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Account, Patient, Appointment, KnackRecordsResponse } from "@shared/schema";

function getInitialFormData(appointmentData: Appointment | undefined) {
  if (!appointmentData) {
    return {
      patientId: "",
      providerId: "",
      referringPhysician: "",
      time: "",
      status: "",
      reason: "",
      diagnosis: "",
      procedures: "",
    };
  }
  return {
    patientId: appointmentData.field_70_raw?.[0]?.id || "",
    providerId: appointmentData.field_71_raw?.[0]?.id || "",
    referringPhysician: appointmentData.field_99_raw || appointmentData.field_99 || "",
    time: appointmentData.field_19_raw || appointmentData.field_19 || "",
    status: appointmentData.field_18_raw || appointmentData.field_18 || "Pending",
    reason: appointmentData.field_20_raw || appointmentData.field_20 || "",
    diagnosis: appointmentData.field_100_raw || appointmentData.field_100 || "",
    procedures: appointmentData.field_101_raw || appointmentData.field_101 || "",
  };
}

export default function AppointmentEdit() {
  const [, params] = useRoute("/appointments/:id/edit");
  const appointmentId = params?.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: appointmentData, isLoading: appointmentLoading } = useQuery<Appointment>({
    queryKey: ["/api/appointments", appointmentId],
    enabled: !!appointmentId,
    staleTime: 0,
  });

  const { data: patientsData, isLoading: patientsLoading } = useQuery<KnackRecordsResponse<Patient>>({
    queryKey: ["/api/patients"],
  });

  const { data: staffData, isLoading: staffLoading } = useQuery<KnackRecordsResponse<Account>>({
    queryKey: ["/api/staff"],
  });

  if (appointmentLoading || patientsLoading || staffLoading || !appointmentData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const patients = patientsData?.records || [];
  const providers = staffData?.records || [];

  return (
    <AppointmentEditForm
      appointmentData={appointmentData}
      appointmentId={appointmentId!}
      patients={patients}
      providers={providers}
      navigate={navigate}
      toast={toast}
    />
  );
}

function AppointmentEditForm({
  appointmentData,
  appointmentId,
  patients,
  providers,
  navigate,
  toast,
}: {
  appointmentData: Appointment;
  appointmentId: string;
  patients: Patient[];
  providers: Account[];
  navigate: (to: string) => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [formData, setFormData] = useState(() => getInitialFormData(appointmentData));

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload: Record<string, unknown> = {
        field_18: data.status,
        field_20: data.reason,
        field_70: data.patientId ? [data.patientId] : [],
        field_71: data.providerId ? [data.providerId] : [],
      };
      if (data.time) {
        payload.field_19 = data.time;
      }
      if (data.referringPhysician) {
        payload.field_99 = data.referringPhysician;
      }
      if (data.diagnosis) {
        payload.field_100 = data.diagnosis;
      }
      if (data.procedures) {
        payload.field_101 = data.procedures;
      }
      return apiRequest("PUT", `/api/appointments/${appointmentId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments", appointmentId] });
      toast({
        title: "Appointment Updated",
        description: "The appointment has been updated successfully.",
      });
      navigate(`/appointments/${appointmentId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update appointment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId) {
      toast({
        title: "Validation Error",
        description: "Please select a patient",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate(formData);
  };

  const getPatientName = (patient: Patient): string => {
    if (patient.field_6_raw?.full) return patient.field_6_raw.full;
    if (patient.field_6_raw) {
      return `${patient.field_6_raw.first || ""} ${patient.field_6_raw.last || ""}`.trim();
    }
    return patient.field_6 || "Unknown";
  };

  const getStaffName = (account: Account): string => {
    if (account.field_11_raw?.full) return account.field_11_raw.full;
    if (account.field_11_raw) {
      return `${account.field_11_raw.first || ""} ${account.field_11_raw.last || ""}`.trim();
    }
    return account.field_11 || "Unknown";
  };

  const appointmentDate = appointmentData.field_17_raw?.date || appointmentData.field_17 || "";

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Edit Appointment"
        description={`Editing appointment on ${appointmentDate}`}
        className="mb-6"
      >
        <Button variant="outline" asChild data-testid="button-back">
          <Link href={`/appointments/${appointmentId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Appointment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="patient" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Patient *
              </Label>
              <Select
                value={formData.patientId}
                onValueChange={(value) => setFormData({ ...formData, patientId: value })}
              >
                <SelectTrigger data-testid="select-patient">
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {getPatientName(patient)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Provider
              </Label>
              <Select
                value={formData.providerId}
                onValueChange={(value) => setFormData({ ...formData, providerId: value })}
              >
                <SelectTrigger data-testid="select-provider">
                  <SelectValue placeholder="Select a provider (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {getStaffName(provider)} - {provider.field_66_raw?.[0] || "Staff"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Preferred Time
              </Label>
              <Select
                value={formData.time}
                onValueChange={(value) => setFormData({ ...formData, time: value })}
              >
                <SelectTrigger data-testid="select-time">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Morning">Morning</SelectItem>
                  <SelectItem value="Afternoon">Afternoon</SelectItem>
                  <SelectItem value="Evening">Evening</SelectItem>
                  <SelectItem value="Any">Any</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referringPhysician" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Referring Physician
              </Label>
              <NPIPhysicianAutocomplete
                value={formData.referringPhysician}
                onChange={(value) => setFormData({ ...formData, referringPhysician: value })}
                placeholder="Search NPI registry for physician..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Requested">Requested</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Reason for Visit
              </Label>
              <Textarea
                id="reason"
                placeholder="Describe the reason for this appointment..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={4}
                data-testid="input-reason"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagnosis" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Diagnosis
              </Label>
              <DiagnosisInput
                value={formData.diagnosis}
                onChange={(value) => setFormData({ ...formData, diagnosis: value })}
                placeholder="Search ICD-10-CM codes or enter diagnosis..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="procedures" className="flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                Procedures
              </Label>
              <ProceduresInput
                value={formData.procedures}
                onChange={(value) => setFormData({ ...formData, procedures: value })}
                placeholder="Search HCPCS codes or enter procedures..."
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                data-testid="button-submit"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/appointments/${appointmentId}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
