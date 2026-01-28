import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, User, Mail, Phone, Calendar, Stethoscope } from "lucide-react";
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
import { PhysiciansMultiInput } from "@/components/physicians-multi-input";

export default function PatientNew() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    status: "active",
    dateOfBirth: "",
    medicalNotes: "",
    otherPhysicians: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload: Record<string, unknown> = {
        field_6: {
          first: data.firstName,
          middle: "",
          last: data.lastName,
          title: "",
        },
        field_7: { email: data.email },
        field_9: data.status,
      };
      if (data.phone) {
        payload.field_44 = data.phone;
      }
      if (data.dateOfBirth) {
        payload.field_46 = data.dateOfBirth;
      }
      if (data.medicalNotes) {
        payload.field_47 = data.medicalNotes;
      }
      if (data.otherPhysicians) {
        payload.field_61 = data.otherPhysicians;
      }
      return apiRequest("POST", "/api/patients", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Patient Created",
        description: "The patient has been added successfully.",
      });
      navigate("/patients");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create patient",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Add Patient"
        description="Create a new patient record"
        className="mb-6"
      >
        <Button variant="outline" asChild data-testid="button-back">
          <Link href="/patients">
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
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  data-testid="input-first-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  data-testid="input-last-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="patient@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
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
                data-testid="input-date-of-birth"
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending approval">Pending Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalNotes" className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Medical History (Optional)
              </Label>
              <MedicalConditionsInput
                value={formData.medicalNotes}
                onChange={(value) => setFormData({ ...formData, medicalNotes: value })}
                placeholder="Search for medical conditions..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherPhysicians" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Other Physicians (Optional)
              </Label>
              <PhysiciansMultiInput
                value={formData.otherPhysicians}
                onChange={(value) => setFormData({ ...formData, otherPhysicians: value })}
                placeholder="Search for physicians by name..."
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending ? "Creating..." : "Add Patient"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/patients">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
