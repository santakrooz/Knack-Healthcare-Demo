import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Pill, User, FileText, Calendar, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MedicationAutocomplete } from "@/components/medication-autocomplete";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { KnackRecordsResponse } from "@shared/schema";

interface Patient {
  id: string;
  field_6: string;
  field_6_raw?: { first?: string; last?: string; full?: string };
  field_7_raw?: { email: string };
}

export default function PrescriptionNew() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    medication: "",
    instructions: "",
    issueDate: "",
    expirationDate: "",
    refills: 0,
    patientId: "",
    status: "Active",
  });

  const { data: patientsData } = useQuery<KnackRecordsResponse<Patient>>({
    queryKey: ["/api/patients"],
  });

  const patients = patientsData?.records || [];

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        field_80: data.medication,
        field_24: data.instructions,
        field_25: data.issueDate,
        field_26: data.expirationDate,
        field_27: data.refills,
        field_28: data.status,
        field_75: data.patientId ? [data.patientId] : [],
      };
      return apiRequest("POST", "/api/prescriptions", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      toast({
        title: "Prescription Created",
        description: "The prescription has been added successfully.",
      });
      navigate("/prescriptions");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create prescription",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.medication || !formData.instructions || !formData.issueDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const getPatientName = (patient: Patient): string => {
    if (patient.field_6_raw?.full) return patient.field_6_raw.full;
    if (patient.field_6_raw) {
      return `${patient.field_6_raw.first || ""} ${patient.field_6_raw.last || ""}`.trim();
    }
    return patient.field_6 || "Unknown";
  };

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="New Prescription"
        description="Create a new patient prescription"
        className="mb-6"
      >
        <Button variant="outline" asChild data-testid="button-back">
          <Link href="/prescriptions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-purple-600" />
            Prescription Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="medication" className="flex items-center gap-2">
                <Pill className="h-4 w-4" />
                Medication & Dosage *
              </Label>
              <MedicationAutocomplete
                value={formData.medication}
                onChange={(value) => setFormData({ ...formData, medication: value })}
                placeholder="Search for medication (e.g., Lisinopril, Aspirin)"
              />
              <p className="text-xs text-muted-foreground">
                Start typing to search the drug database
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Patient
              </Label>
              <Select
                value={formData.patientId}
                onValueChange={(value) => setFormData({ ...formData, patientId: value })}
              >
                <SelectTrigger data-testid="select-patient">
                  <SelectValue placeholder="Select a patient (optional)" />
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
              <Label htmlFor="instructions" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Instructions *
              </Label>
              <Textarea
                id="instructions"
                placeholder="e.g., Take one tablet in the morning with food"
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
                  Issue Date *
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
                  Number of Refills
                </Label>
                <Input
                  id="refills"
                  type="number"
                  min="0"
                  value={formData.refills}
                  onChange={(e) => setFormData({ ...formData, refills: parseInt(e.target.value) || 0 })}
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
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending ? "Creating..." : "Create Prescription"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/prescriptions">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
