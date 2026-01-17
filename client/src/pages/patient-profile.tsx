import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Pill,
  Edit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import type { Account, Appointment, Prescription, KnackRecordsResponse } from "@shared/schema";
import { formatKnackDate, formatKnackTime, getPatientName } from "@shared/schema";

function getAccountName(account: Account): string {
  if (account.field_11_raw?.full) return account.field_11_raw.full;
  if (account.field_11_raw) {
    return `${account.field_11_raw.first || ""} ${account.field_11_raw.last || ""}`.trim();
  }
  return account.field_11 || "Unknown";
}

function getAccountInitials(account: Account): string {
  if (account.field_11_raw) {
    const first = account.field_11_raw.first?.[0] || "";
    const last = account.field_11_raw.last?.[0] || "";
    return `${first}${last}`.toUpperCase();
  }
  const name = account.field_11 || "";
  const parts = name.split(" ");
  return parts.map(p => p[0]).join("").toUpperCase().slice(0, 2);
}

function getEmail(account: Account): string {
  return account.field_12_raw?.email || "";
}

function getPhone(account: Account): string {
  if (account.field_67_raw?.formatted) return account.field_67_raw.formatted;
  return account.field_67 || "";
}

function getRole(account: Account): string {
  const parts: string[] = [];
  if (account.field_66_raw && account.field_66_raw.length > 0) {
    parts.push(account.field_66_raw.join(", "));
  }
  if (account.field_72_raw && account.field_72_raw.length > 0) {
    parts.push(account.field_72_raw.join(", "));
  }
  return parts.join(" - ") || "";
}

function getProfileImage(account: Account): string | undefined {
  return account.field_64_raw?.url || account.field_64_raw?.thumb_url;
}

export default function PatientProfile() {
  const [, params] = useRoute("/patients/:id");
  const patientId = params?.id;

  const { data: patient, isLoading: patientLoading } = useQuery<Account>({
    queryKey: ["/api/patients", patientId],
    enabled: !!patientId,
  });

  const { data: appointmentsData } = useQuery<KnackRecordsResponse<Appointment>>({
    queryKey: ["/api/appointments"],
    enabled: !!patientId,
  });

  const { data: prescriptionsData } = useQuery<KnackRecordsResponse<Prescription>>({
    queryKey: ["/api/prescriptions"],
    enabled: !!patientId,
  });

  const patientAppointments = appointmentsData?.records?.filter(
    apt => apt.field_74_raw?.some(p => p.id === patientId)
  ) || [];

  const patientPrescriptions = prescriptionsData?.records?.filter(
    rx => rx.field_75_raw?.some(p => p.id === patientId)
  ) || [];

  if (patientLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <Skeleton className="h-24 w-24 rounded-full" />
                <Skeleton className="h-6 w-32 mt-4" />
                <Skeleton className="h-4 w-24 mt-2" />
              </div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-full mb-4" />
              <Skeleton className="h-6 w-full mb-4" />
              <Skeleton className="h-6 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6 lg:p-8">
        <PageHeader
          title="Patient Not Found"
          description="The patient you're looking for doesn't exist."
          className="mb-6"
        >
          <Button variant="outline" asChild>
            <Link href="/patients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Patients
            </Link>
          </Button>
        </PageHeader>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title={getAccountName(patient)}
        description="Patient profile and medical records"
        className="mb-6"
      >
        <div className="flex gap-2">
          <Button variant="outline" asChild data-testid="button-back">
            <Link href="/patients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button asChild data-testid="button-edit">
            <Link href={`/patients/${patientId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={getProfileImage(patient)} alt={getAccountName(patient)} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-medium">
                  {getAccountInitials(patient)}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-semibold">{getAccountName(patient)}</h2>
              <div className="mt-2">
                <StatusBadge status={patient.field_14 || "active"} />
              </div>
              {getRole(patient) && (
                <p className="mt-2 text-sm text-muted-foreground">{getRole(patient)}</p>
              )}
            </div>

            <div className="mt-6 space-y-4">
              {getEmail(patient) && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">{getEmail(patient)}</span>
                </div>
              )}
              {getPhone(patient) && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{getPhone(patient)}</span>
                </div>
              )}
              {getRole(patient) && (
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{getRole(patient)}</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t">
              <Button className="w-full" asChild data-testid="button-book-appointment">
                <Link href={`/appointments/new?patient=${patientId}`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Book Appointment
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Appointments ({patientAppointments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patientAppointments.length > 0 ? (
                <div className="space-y-3">
                  {patientAppointments.slice(0, 5).map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                    >
                      <div>
                        <p className="font-medium">
                          {formatKnackDate(apt.field_29_raw)} at {formatKnackTime(apt.field_29_raw)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {apt.field_32 || "General appointment"}
                        </p>
                      </div>
                      <StatusBadge status={apt.field_30 || "pending"} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No appointments found for this patient.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Pill className="h-5 w-5 text-purple-600" />
                Prescriptions ({patientPrescriptions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patientPrescriptions.length > 0 ? (
                <div className="space-y-3">
                  {patientPrescriptions.slice(0, 5).map((rx) => (
                    <div
                      key={rx.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                    >
                      <div>
                        <p className="font-medium">{rx.field_80}</p>
                        <p className="text-sm text-muted-foreground">{rx.field_24}</p>
                      </div>
                      <StatusBadge status={rx.field_28 || "active"} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No prescriptions found for this patient.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
