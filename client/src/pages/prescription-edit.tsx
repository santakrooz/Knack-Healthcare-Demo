import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Pill, User, UserCheck, FileText, Calendar, RefreshCw, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { MedicationAutocomplete } from "@/components/medication-autocomplete";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Account, Patient, Prescription, KnackRecordsResponse } from "@shared/schema";

function formatDateForInput(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
  }
  return "";
}

function getInitialFormData(prescriptionData: Prescription | undefined) {
  if (!prescriptionData) {
    return {
      patientId: "",
      providerId: "",
      medication: "",
      instructions: "",
      issueDate: "",
      expirationDate: "",
      refills: "",
      status: "Active",
    };
  }
  const refillsValue = prescriptionData.field_27_raw ?? prescriptionData.field_27;
  return {
    patientId: prescriptionData.field_75_raw?.[0]?.id || "",
    providerId: prescriptionData.field_76_raw?.[0]?.id || "",
    medication: prescriptionData.field_80_raw || prescriptionData.field_80 || "",
    instructions: prescriptionData.field_24_raw || prescriptionData.field_24 || "",
    issueDate: formatDateForInput(prescriptionData.field_25_raw?.date || prescriptionData.field_25),
    expirationDate: formatDateForInput(prescriptionData.field_26_raw?.date || prescriptionData.field_26),
    refills: refillsValue !== undefined ? String(refillsValue) : "",
    status: prescriptionData.field_28_raw || prescriptionData.field_28 || "Active",
  };
}

export default function PrescriptionEdit() {
  const [, params] = useRoute("/prescriptions/:id/edit");
  const prescriptionId = params?.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: prescriptionData, isLoading: prescriptionLoading } = useQuery<Prescription>({
    queryKey: ["/api/prescriptions", prescriptionId],
    enabled: !!prescriptionId,
    staleTime: 0,
  });

  const { data: patientsData, isLoading: patientsLoading } = useQuery<KnackRecordsResponse<Patient>>({
    queryKey: ["/api/patients"],
  });

  const { data: staffData, isLoading: staffLoading } = useQuery<KnackRecordsResponse<Account>>({
    queryKey: ["/api/staff"],
  });

  if (prescriptionLoading || patientsLoading || staffLoading || !prescriptionData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const patients = patientsData?.records || [];
  const providers = staffData?.records || [];

  return (
    <PrescriptionEditForm
      prescriptionData={prescriptionData}
      prescriptionId={prescriptionId!}
      patients={patients}
      providers={providers}
      navigate={navigate}
      toast={toast}
    />
  );
}

function PrescriptionEditForm({
  prescriptionData,
  prescriptionId,
  patients,
  providers,
  navigate,
  toast,
}: {
  prescriptionData: Prescription;
  prescriptionId: string;
  patients: Patient[];
  providers: Account[];
  navigate: (to: string) => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [formData, setFormData] = useState(() => getInitialFormData(prescriptionData));

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const formatDate = (date: string): string => {
        if (!date) return "";
        const parts = date.split("-");
        if (parts.length === 3) {
          return `${parts[1]}/${parts[2]}/${parts[0]}`;
        }
        return date;
      };

      const payload: Record<string, unknown> = {
        field_80: data.medication,
        field_24: data.instructions,
        field_28: data.status,
        field_75: data.patientId ? [data.patientId] : [],
        field_76: data.providerId ? [data.providerId] : [],
      };
      if (data.issueDate) {
        payload.field_25 = formatDate(data.issueDate);
      }
      if (data.expirationDate) {
        payload.field_26 = formatDate(data.expirationDate);
      }
      if (data.refills) {
        payload.field_27 = data.refills;
      }
      return apiRequest("PUT", `/api/prescriptions/${prescriptionId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions", prescriptionId] });
      toast({
        title: "Prescription Updated",
        description: "The prescription has been updated successfully.",
      });
      navigate(`/prescriptions/${prescriptionId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update prescription",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.medication) {
      toast({
        title: "Validation Error",
        description: "Please select a patient and medication",
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

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Edit Prescription"
        description={`Editing prescription for ${prescriptionData.field_80 || "medication"}`}
        className="mb-6"
      >
        <Button variant="outline" asChild data-testid="button-back">
          <Link href={`/prescriptions/${prescriptionId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            Prescription Details
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
                Prescribing Provider
              </Label>
              <Select
                value={formData.providerId}
                onValueChange={(value) => setFormData({ ...formData, providerId: value })}
              >
                <SelectTrigger data-testid="select-provider">
                  <SelectValue placeholder="Select a provider" />
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
              <Label htmlFor="medication" className="flex items-center gap-2">
                <Pill className="h-4 w-4" />
                Medication *
              </Label>
              <MedicationAutocomplete
                value={formData.medication}
                onChange={(value) => setFormData({ ...formData, medication: value })}
                placeholder="Search for medication..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Instructions
              </Label>
              <Textarea
                id="instructions"
                placeholder="Enter dosage and usage instructions..."
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                rows={3}
                data-testid="input-instructions"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="issueDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Issue Date
                </Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  data-testid="input-issue-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expirationDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Expiration Date
                </Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  data-testid="input-expiration-date"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="refills" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refills Remaining
                </Label>
                <Input
                  id="refills"
                  type="number"
                  min="0"
                  value={formData.refills}
                  onChange={(e) => setFormData({ ...formData, refills: e.target.value })}
                  data-testid="input-refills"
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
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                    <SelectItem value="Discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                <Link href={`/prescriptions/${prescriptionId}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
