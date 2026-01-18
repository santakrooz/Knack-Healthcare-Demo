import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Pill,
  Edit,
  FileText,
  Heart,
  AlertCircle,
  Cake,
  Stethoscope,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import type { Patient, Appointment, Prescription, KnackRecordsResponse, KnackConnectionField } from "@shared/schema";
import { formatKnackDate, formatKnackTime, getPatientName as schemaGetPatientName } from "@shared/schema";

function getPatientName(patient: Patient): string {
  if (patient.field_6_raw?.full) return patient.field_6_raw.full;
  if (patient.field_6_raw) {
    return `${patient.field_6_raw.first || ""} ${patient.field_6_raw.last || ""}`.trim();
  }
  return patient.field_6 || "Unknown";
}

function getPatientInitials(patient: Patient): string {
  if (patient.field_6_raw) {
    const first = patient.field_6_raw.first?.[0] || "";
    const last = patient.field_6_raw.last?.[0] || "";
    return `${first}${last}`.toUpperCase();
  }
  const name = patient.field_6 || "";
  const parts = name.split(" ");
  return parts.map(p => p[0]).join("").toUpperCase().slice(0, 2) || "??";
}

function getEmail(patient: Patient): string {
  return patient.field_7_raw?.email || "";
}

function getPhone(patient: Patient): string {
  if (patient.field_44_raw?.formatted) return patient.field_44_raw.formatted;
  return patient.field_44 || "";
}

function getProfileImage(patient: Patient): string | undefined {
  return (patient as any).field_64_raw?.url || (patient as any).field_64_raw?.thumb_url;
}

function getDateOfBirth(patient: Patient): string {
  if (patient.field_46_raw?.date_formatted) return patient.field_46_raw.date_formatted;
  return patient.field_46 || "";
}

function getMedicalNotes(patient: Patient): string {
  return patient.field_47 || "";
}

function getOtherPhysicians(patient: Patient): string {
  return patient.field_48 || "";
}

export default function PatientProfile() {
  const [, params] = useRoute("/patients/:id");
  const patientId = params?.id;

  const { data: patient, isLoading: patientLoading } = useQuery<Patient>({
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
    apt => apt.field_70_raw?.some((p: KnackConnectionField) => p.id === patientId)
  ) || [];

  const patientPrescriptions = prescriptionsData?.records?.filter(
    rx => rx.field_75_raw?.some((p: KnackConnectionField) => p.id === patientId)
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

  const patientName = getPatientName(patient);
  const email = getEmail(patient);
  const phone = getPhone(patient);
  const dob = getDateOfBirth(patient);
  const medicalNotes = getMedicalNotes(patient);
  const otherPhysicians = getOtherPhysicians(patient);
  const status = patient.field_9 || "active";

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title={patientName}
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
                <AvatarImage src={getProfileImage(patient)} alt={patientName} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-medium">
                  {getPatientInitials(patient)}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-semibold">{patientName}</h2>
              <div className="mt-2">
                <StatusBadge status={status} />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate">{email}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{phone}</span>
                </div>
              )}
              {dob && (
                <div className="flex items-center gap-3">
                  <Cake className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{dob}</span>
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
          {medicalNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-red-500" />
                  Medical History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm whitespace-pre-wrap">{medicalNotes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {otherPhysicians && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Other Physicians
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {otherPhysicians.split(",").map((physician, index) => (
                    <div
                      key={index}
                      className="px-3 py-1.5 rounded-md bg-muted text-sm"
                    >
                      {physician.trim()}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
                    <Link
                      key={apt.id}
                      href={`/appointments/${apt.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover-elevate block"
                    >
                      <div>
                        <p className="font-medium">
                          {formatKnackDate(apt.field_21_raw) || formatKnackDate(apt.field_17_raw)} at {apt.field_19 || formatKnackTime(apt.field_21_raw) || "TBD"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {apt.field_20 || "General appointment"}
                        </p>
                      </div>
                      <StatusBadge status={apt.field_18 || "pending"} />
                    </Link>
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
