import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft,
  Pill,
  Calendar,
  User,
  UserCheck,
  FileText,
  Edit,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import type { Prescription } from "@shared/schema";
import { formatKnackDate, getPatientName, getProviderName } from "@shared/schema";

export default function PrescriptionDetails() {
  const [, params] = useRoute("/prescriptions/:id");
  const prescriptionId = params?.id;

  const { data: prescription, isLoading, error } = useQuery<Prescription>({
    queryKey: ["/api/prescriptions", prescriptionId],
    enabled: !!prescriptionId,
  });

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-6 w-32 bg-muted rounded" />
                <div className="h-4 w-64 bg-muted rounded" />
                <div className="h-4 w-48 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="p-6 lg:p-8">
        <PageHeader
          title="Prescription Not Found"
          description="The requested prescription could not be found"
          className="mb-6"
        >
          <Button variant="outline" asChild>
            <Link href="/prescriptions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Prescriptions
            </Link>
          </Button>
        </PageHeader>
      </div>
    );
  }

  const medication = prescription.field_80 || "Unknown Medication";
  const instructions = prescription.field_24 || "";
  const issueDate = formatKnackDate(prescription.field_25_raw);
  const expirationDate = formatKnackDate(prescription.field_26_raw);
  const refills = prescription.field_27 || 0;
  const status = prescription.field_28 || "Active";
  const patientName = getPatientName(prescription.field_75_raw);
  const providerName = getProviderName(prescription.field_76_raw);

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Prescription Details"
        description={medication}
        className="mb-6"
      >
        <div className="flex gap-2">
          <Button variant="outline" asChild data-testid="button-back">
            <Link href="/prescriptions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button asChild data-testid="button-edit-prescription">
            <Link href={`/prescriptions/${prescriptionId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-purple-600" />
              Medication Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Medication</span>
              <span className="font-medium">{medication}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Issue Date</span>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{issueDate}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Expiration Date</span>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{expirationDate}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Refills Remaining</span>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{refills}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Patient & Provider
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Patient</p>
                <p className="font-semibold">{patientName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prescribing Provider</p>
                <p className="font-semibold">{providerName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {instructions && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-600" />
                Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="whitespace-pre-wrap">{instructions}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
