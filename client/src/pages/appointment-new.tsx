import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Calendar, Clock, User, UserCheck, FileText } from "lucide-react";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Account, KnackRecordsResponse } from "@shared/schema";

interface Patient {
  id: string;
  field_6: string;
  field_6_raw?: { first?: string; last?: string; full?: string };
  field_7_raw?: { email: string };
  profile_keys?: string;
}

export default function AppointmentNew() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    patientId: "",
    providerId: "",
    date: "",
    time: "",
    status: "Scheduled",
    notes: "",
  });

  const { data: patientsData } = useQuery<KnackRecordsResponse<Patient>>({
    queryKey: ["/api/patients"],
  });

  const { data: staffData } = useQuery<KnackRecordsResponse<Account>>({
    queryKey: ["/api/staff"],
  });

  const patients = patientsData?.records || [];
  const providers = staffData?.records || [];

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const dateTime = `${data.date} ${data.time}`;
      const payload = {
        field_29: dateTime,
        field_30: data.status,
        field_31: data.notes,
        field_74: data.patientId ? [data.patientId] : [],
        field_77: data.providerId ? [data.providerId] : [],
      };
      return apiRequest("POST", "/api/appointments", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment Created",
        description: "The appointment has been scheduled successfully.",
      });
      navigate("/appointments");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create appointment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.date || !formData.time) {
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
        title="New Appointment"
        description="Schedule a new patient appointment"
        className="mb-6"
      >
        <Button variant="outline" asChild data-testid="button-back">
          <Link href="/appointments">
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  data-testid="input-date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time *
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  data-testid="input-time"
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
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Requested">Requested</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this appointment..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                data-testid="input-notes"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending ? "Creating..." : "Create Appointment"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/appointments">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
