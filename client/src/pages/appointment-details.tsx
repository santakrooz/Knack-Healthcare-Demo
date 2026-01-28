import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  UserCheck,
  UserPlus,
  FileText,
  Edit,
  ClipboardList,
  Scissors,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import type { Appointment } from "@shared/schema";
import { getPatientName, getProviderName, formatKnackDate, formatKnackTime } from "@shared/schema";
import { parseListField } from "@/lib/utils";

export default function AppointmentDetails() {
  const [, params] = useRoute("/appointments/:id");
  const appointmentId = params?.id;

  const { data: appointment, isLoading, error } = useQuery<Appointment>({
    queryKey: ["/api/appointments", appointmentId],
    enabled: !!appointmentId,
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

  if (error || !appointment) {
    return (
      <div className="p-6 lg:p-8">
        <PageHeader
          title="Appointment Not Found"
          description="The requested appointment could not be found"
          className="mb-6"
        >
          <Button variant="outline" asChild>
            <Link href="/appointments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Appointments
            </Link>
          </Button>
        </PageHeader>
      </div>
    );
  }

  const patientName = getPatientName(appointment.field_70_raw);
  const providerName = getProviderName(appointment.field_71_raw);
  const appointmentDate = formatKnackDate(appointment.field_21_raw) || formatKnackDate(appointment.field_17_raw);
  const appointmentTime = appointment.field_19 || formatKnackTime(appointment.field_21_raw) || "";
  const status = appointment.field_18 || "Pending";
  const reason = appointment.field_20 || "";
  const referringPhysician = appointment.field_99 || "";
  const diagnosis = appointment.field_100 || "";
  const phenotypes = appointment.field_102 || "";
  const procedures = appointment.field_101 || "";
  
  const diagnosisList = parseListField(diagnosis);
  const phenotypesList = parseListField(phenotypes);
  const proceduresList = parseListField(procedures);

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Appointment Details"
        description={`Appointment for ${patientName}`}
        className="mb-6"
      >
        <div className="flex gap-2">
          <Button variant="outline" asChild data-testid="button-back">
            <Link href="/appointments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button asChild data-testid="button-edit-appointment">
            <Link href={`/appointments/${appointmentId}/edit`}>
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
              <Calendar className="h-5 w-5 text-primary" />
              Appointment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Date</span>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{appointmentDate}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Time</span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{appointmentTime || "TBD"}</span>
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
                <p className="text-sm text-muted-foreground">Provider</p>
                <p className="font-semibold">{providerName}</p>
              </div>
            </div>
            {referringPhysician && (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <UserPlus className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Referring Physician</p>
                  <p className="font-semibold">{referringPhysician}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {reason && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Reason for Visit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{reason}</p>
            </CardContent>
          </Card>
        )}

        {phenotypesList.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-pink-600" />
                Phenotypes (Symptoms)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {phenotypesList.map((phenotype, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-sm"
                    data-testid={`phenotype-badge-${index}`}
                  >
                    {phenotype}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {diagnosisList.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-orange-600" />
                Diagnosis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {diagnosisList.map((diag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-sm inline-block max-w-full whitespace-normal break-words"
                    data-testid={`diagnosis-badge-${index}`}
                  >
                    {diag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {proceduresList.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5 text-teal-600" />
                Procedures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {proceduresList.map((proc, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-sm"
                    data-testid={`procedure-badge-${index}`}
                  >
                    {proc}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
