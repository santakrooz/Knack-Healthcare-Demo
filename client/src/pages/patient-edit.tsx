import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, User, Mail, Phone, Calendar, Stethoscope, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { MedicalConditionsInput } from "@/components/medical-conditions-input";
import type { Patient } from "@shared/schema";

function formatDobForInput(dob: string): string {
  if (!dob) return "";
  const parts = dob.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
  }
  return "";
}

function getInitialFormData(patientData: Patient | undefined) {
  if (!patientData) {
    return {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      status: "Active",
      medicalHistory: "",
    };
  }
  
  const rawName = patientData.field_6_raw;
  const firstName = typeof rawName === 'object' && rawName?.first ? rawName.first : "";
  const lastName = typeof rawName === 'object' && rawName?.last ? rawName.last : "";
  
  const rawEmail = patientData.field_7_raw;
  const email = typeof rawEmail === 'object' && rawEmail?.email ? rawEmail.email : (patientData.field_7 || "");
  
  const rawPhone = patientData.field_44_raw;
  const phone = typeof rawPhone === 'object' && rawPhone?.formatted ? rawPhone.formatted : (patientData.field_44 || "");
  
  const rawDob = patientData.field_46_raw;
  const dobStr = typeof rawDob === 'object' && rawDob?.date ? rawDob.date : (patientData.field_46 || "");
  
  return {
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth: formatDobForInput(dobStr),
    status: patientData.field_9_raw || patientData.field_9 || "Active",
    medicalHistory: patientData.field_47_raw || patientData.field_47 || "",
  };
}

export default function PatientEdit() {
  const [, params] = useRoute("/patients/:id/edit");
  const patientId = params?.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: patientData, isLoading } = useQuery<Patient>({
    queryKey: ["/api/patients", patientId],
    enabled: !!patientId,
    staleTime: 0,
  });

  if (isLoading || !patientData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PatientEditForm
      patientData={patientData}
      patientId={patientId!}
      navigate={navigate}
      toast={toast}
    />
  );
}

function PatientEditForm({
  patientData,
  patientId,
  navigate,
  toast,
}: {
  patientData: Patient;
  patientId: string;
  navigate: (to: string) => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [formData, setFormData] = useState(() => getInitialFormData(patientData));

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      let formattedDob = "";
      if (data.dateOfBirth) {
        const parts = data.dateOfBirth.split("-");
        if (parts.length === 3) {
          formattedDob = `${parts[1]}/${parts[2]}/${parts[0]}`;
        }
      }

      const payload: Record<string, unknown> = {
        field_6: {
          first: data.firstName,
          last: data.lastName,
        },
        field_7: { email: data.email },
        field_44: data.phone,
        field_9: data.status,
      };
      if (formattedDob) {
        payload.field_46 = formattedDob;
      }
      if (data.medicalHistory) {
        payload.field_47 = data.medicalHistory;
      }
      return apiRequest("PUT", `/api/patients/${patientId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patientId] });
      toast({
        title: "Patient Updated",
        description: "The patient record has been updated successfully.",
      });
      navigate(`/patients/${patientId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update patient",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      toast({
        title: "Validation Error",
        description: "Please enter patient name",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate(formData);
  };

  const rawName = patientData.field_6_raw;
  const patientName = (typeof rawName === 'object' && rawName?.full) ? rawName.full :
    (typeof rawName === 'object' ? `${rawName?.first || ""} ${rawName?.last || ""}`.trim() : "") ||
    patientData.field_6 || "Patient";

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Edit Patient"
        description={`Editing ${patientName}`}
        className="mb-6"
      >
        <Button variant="outline" asChild data-testid="button-back">
          <Link href={`/patients/${patientId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  data-testid="input-last-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-email"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  data-testid="input-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date of Birth
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  data-testid="input-dob"
                />
              </div>
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
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalHistory" className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Medical History
              </Label>
              <MedicalConditionsInput
                value={formData.medicalHistory}
                onChange={(value) => setFormData({ ...formData, medicalHistory: value })}
                placeholder="Search for medical conditions..."
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
                <Link href={`/patients/${patientId}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
