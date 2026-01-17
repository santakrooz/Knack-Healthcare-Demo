import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { DataTableSkeleton } from "@/components/data-table-skeleton";
import type { KnackRecordsResponse } from "@shared/schema";

// Patient interface for object_2 data
interface Patient {
  id: string;
  field_6: string;
  field_6_raw?: { first?: string; last?: string; full?: string };
  field_7_raw?: { email: string };
  field_44?: string;
  field_44_raw?: { formatted?: string };
  field_9?: string;
  field_9_raw?: string;
  field_64_raw?: { url?: string; thumb_url?: string };
}

// Helper to get name from Patient
function getPatientName(patient: Patient): string {
  if (patient.field_6_raw?.full) {
    return patient.field_6_raw.full;
  }
  if (patient.field_6_raw) {
    return `${patient.field_6_raw.first || ""} ${patient.field_6_raw.last || ""}`.trim();
  }
  return patient.field_6 || "Unknown";
}

// Helper to get initials from Patient
function getInitials(patient: Patient): string {
  if (patient.field_6_raw) {
    const first = patient.field_6_raw.first?.[0] || "";
    const last = patient.field_6_raw.last?.[0] || "";
    return `${first}${last}`.toUpperCase();
  }
  const name = patient.field_6 || "";
  const parts = name.split(" ");
  return parts.map(p => p[0]).join("").toUpperCase().slice(0, 2);
}

// Helper to get email from Patient
function getEmail(patient: Patient): string {
  if (patient.field_7_raw?.email) {
    return patient.field_7_raw.email;
  }
  return "";
}

// Helper to get phone from Patient
function getPhone(patient: Patient): string {
  if (patient.field_44_raw?.formatted) {
    return patient.field_44_raw.formatted;
  }
  return patient.field_44 || "";
}

// Helper to get profile image URL
function getProfileImage(patient: Patient): string | undefined {
  return patient.field_64_raw?.url || patient.field_64_raw?.thumb_url;
}

export default function Patients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const { data: patientsData, isLoading } = useQuery<KnackRecordsResponse<Patient>>({
    queryKey: ["/api/patients"],
  });
  
  const patients = patientsData?.records;

  const filteredPatients = patients?.filter((patient) => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = getPatientName(patient).toLowerCase();
    const email = getEmail(patient).toLowerCase();
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Patients"
        description="Manage patient records and intake forms"
        className="mb-6"
      >
        <Button asChild data-testid="button-add-patient">
          <Link href="/patients/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </Link>
        </Button>
      </PageHeader>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-patients"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            data-testid="button-view-table"
          >
            Table
          </Button>
          <Button
            variant={viewMode === "cards" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("cards")}
            data-testid="button-view-cards"
          >
            Cards
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <DataTableSkeleton columns={5} rows={8} />
          </CardContent>
        </Card>
      ) : !filteredPatients || filteredPatients.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={Users}
              title="No patients found"
              description={
                searchQuery
                  ? "No patients match your search criteria. Try a different search term."
                  : "Get started by adding your first patient record."
              }
              action={
                !searchQuery
                  ? {
                      label: "Add Patient",
                      onClick: () => (window.location.href = "/patients/new"),
                    }
                  : undefined
              }
            />
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow
                    key={patient.id}
                    className="hover-elevate"
                    data-testid={`patient-row-${patient.id}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={getProfileImage(patient)} alt={getPatientName(patient)} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {getInitials(patient)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {getPatientName(patient)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ID: {patient.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getEmail(patient) && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">
                            {getEmail(patient)}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getPhone(patient) && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{getPhone(patient)}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={patient.field_9 || "active"} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-patient-menu-${patient.id}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/patients/${patient.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/patients/${patient.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient) => (
            <Card
              key={patient.id}
              className="hover-elevate"
              data-testid={`patient-card-${patient.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={getProfileImage(patient)} alt={getPatientName(patient)} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                        {getInitials(patient)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-lg">
                        {getPatientName(patient)}
                      </p>
                      <StatusBadge status={patient.field_9 || "active"} />
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/patients/${patient.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/patients/${patient.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-6 space-y-3">
                  {getEmail(patient) && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{getEmail(patient)}</span>
                    </div>
                  )}
                  {getPhone(patient) && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{getPhone(patient)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/patients/${patient.id}`}>View Profile</Link>
                  </Button>
                  <Button size="sm" className="flex-1" asChild>
                    <Link href={`/appointments/new?patient=${patient.id}`}>
                      Book Appointment
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
