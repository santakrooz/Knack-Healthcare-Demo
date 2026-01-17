import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Calendar,
  Plus,
  Search,
  Clock,
  User,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Filter,
  UserCheck,
  Pill,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { Appointment, KnackRecordsResponse } from "@shared/schema";
import { getPatientName, getProviderName, formatKnackDate, formatKnackTime } from "@shared/schema";

export default function Appointments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: appointmentsData, isLoading } = useQuery<KnackRecordsResponse<Appointment>>({
    queryKey: ["/api/appointments"],
  });
  
  const appointments = appointmentsData?.records;

  const filteredAppointments = appointments?.filter((appointment) => {
    const searchLower = searchQuery.toLowerCase();
    const patientName = getPatientName(appointment.field_74_raw).toLowerCase();
    const providerName = getProviderName(appointment.field_77_raw).toLowerCase();
    const matchesSearch =
      patientName.includes(searchLower) ||
      providerName.includes(searchLower) ||
      (appointment.field_32 || "").toLowerCase().includes(searchLower);
    const matchesStatus =
      statusFilter === "all" ||
      (appointment.field_30 || "").toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Appointments"
        description="Schedule and manage patient appointments"
        className="mb-6"
      >
        <Button asChild data-testid="button-new-appointment">
          <Link href="/appointments/new">
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Link>
        </Button>
      </PageHeader>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search appointments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-appointments"
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="requested">Requested</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <DataTableSkeleton columns={6} rows={8} />
          </CardContent>
        </Card>
      ) : !filteredAppointments || filteredAppointments.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={Calendar}
              title="No appointments found"
              description={
                searchQuery || statusFilter !== "all"
                  ? "No appointments match your search criteria."
                  : "Get started by scheduling your first appointment."
              }
              action={
                !searchQuery && statusFilter === "all"
                  ? {
                      label: "Schedule Appointment",
                      onClick: () => (window.location.href = "/appointments/new"),
                    }
                  : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Date & Time</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Prescription</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => (
                  <TableRow
                    key={appointment.id}
                    className="hover-elevate"
                    data-testid={`appointment-row-${appointment.id}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {formatKnackDate(appointment.field_29_raw)}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatKnackTime(appointment.field_29_raw) || "TBD"}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{getPatientName(appointment.field_74_raw)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <span>{getProviderName(appointment.field_77_raw)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {appointment.field_78_raw && appointment.field_78_raw.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-purple-500" />
                          <span className="truncate max-w-[150px]">
                            {appointment.field_78_raw[0].identifier}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={appointment.field_30 || "pending"} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-appointment-menu-${appointment.id}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/appointments/${appointment.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/appointments/${appointment.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Cancel
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
      )}
    </div>
  );
}
