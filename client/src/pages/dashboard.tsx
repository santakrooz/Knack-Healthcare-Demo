import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Calendar,
  Pill,
  ClipboardList,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatsCard } from "@/components/stats-card";
import { StatusBadge } from "@/components/status-badge";
import { DashboardSkeleton } from "@/components/data-table-skeleton";
import { PageHeader } from "@/components/page-header";
import type { DashboardStats, Appointment } from "@shared/schema";
import { formatKnackTime } from "@shared/schema";

// Patient interface for object_2 data
interface Patient {
  id: string;
  field_6: string;
  field_6_raw?: { first?: string; last?: string; full?: string };
  field_7_raw?: { email: string };
  field_9?: string;
  field_9_raw?: string;
  field_64_raw?: { url?: string; thumb_url?: string };
}

// Helper functions for Patient (object_2)
function getPatientName(patient: Patient): string {
  if (patient.field_6_raw?.full) {
    return patient.field_6_raw.full;
  }
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
  return parts.map(p => p[0]).join("").toUpperCase().slice(0, 2);
}

function getPatientEmail(patient: Patient): string {
  return patient.field_7_raw?.email || "";
}

function getProfileImage(patient: Patient): string | undefined {
  return patient.field_64_raw?.url || patient.field_64_raw?.thumb_url;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentPatients, isLoading: patientsLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients/recent"],
  });

  const { data: todayAppointments, isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/today"],
  });

  const isLoading = statsLoading || patientsLoading || appointmentsLoading;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <PageHeader
          title="Dashboard"
          description="Welcome back! Here's an overview of your medical office."
          className="mb-8"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  const statsData = stats || {
    totalPatients: 0,
    todayAppointments: 0,
    activePrescriptions: 0,
    pendingForms: 0,
  };

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's an overview of your medical office."
        className="mb-8"
      >
        <Button asChild data-testid="button-new-appointment">
          <Link href="/appointments/new">
            <Calendar className="mr-2 h-4 w-4" />
            New Appointment
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Patients"
          value={statsData.totalPatients}
          subtitle="Registered patients"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatsCard
          title="Total Appointments"
          value={statsData.todayAppointments}
          subtitle="Currently scheduled"
          icon={Calendar}
          iconClassName="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        />
        <StatsCard
          title="Active Prescriptions"
          value={statsData.activePrescriptions}
          subtitle="Currently active"
          icon={Pill}
          iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        />
        <StatsCard
          title="Pending Forms"
          value={statsData.pendingForms}
          subtitle="Awaiting review"
          icon={ClipboardList}
          iconClassName="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Today's Schedule
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/appointments" data-testid="link-view-all-appointments">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {todayAppointments && todayAppointments.length > 0 ? (
              <div className="space-y-4">
                {todayAppointments.slice(0, 5).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center gap-4 rounded-lg border p-4 hover-elevate"
                    data-testid={`appointment-item-${appointment.id}`}
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {appointment.field_74_raw?.[0]?.identifier || "Unknown Patient"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatKnackTime(appointment.field_29_raw) || "Time TBD"}
                      </p>
                    </div>
                    <StatusBadge status={appointment.field_30 || "pending"} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No appointments scheduled for today
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="/appointments/new">Schedule Appointment</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold">
              Recent Patients
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/patients" data-testid="link-view-all-patients">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentPatients && recentPatients.length > 0 ? (
              <div className="space-y-4">
                {recentPatients.slice(0, 5).map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center gap-4 rounded-lg border p-4 hover-elevate"
                    data-testid={`patient-item-${patient.id}`}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={getProfileImage(patient)} alt={getPatientName(patient)} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {getPatientInitials(patient)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {getPatientName(patient)}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {getPatientEmail(patient) || "No email"}
                      </p>
                    </div>
                    <StatusBadge status={patient.field_9 || "active"} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No patients registered yet
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="/patients/new">Add Patient</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-6"
              asChild
            >
              <Link href="/patients/new" data-testid="button-quick-add-patient">
                <Users className="h-6 w-6 text-primary" />
                <span>Add Patient</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-6"
              asChild
            >
              <Link href="/appointments/new" data-testid="button-quick-schedule">
                <Calendar className="h-6 w-6 text-primary" />
                <span>Schedule Appointment</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-6"
              asChild
            >
              <Link href="/prescriptions/new" data-testid="button-quick-prescription">
                <Pill className="h-6 w-6 text-primary" />
                <span>New Prescription</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-6"
              asChild
            >
              <Link href="/diagnoses/new" data-testid="button-quick-diagnosis">
                <ClipboardList className="h-6 w-6 text-primary" />
                <span>Add Diagnosis</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
