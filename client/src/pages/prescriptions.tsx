import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  Pill,
  Plus,
  Search,
  User,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Filter,
  CalendarDays,
  RefreshCw,
  FileText,
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
import type { Prescription, KnackRecordsResponse } from "@shared/schema";
import { getPatientName, formatKnackDate } from "@shared/schema";

export default function Prescriptions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [, navigate] = useLocation();

  const { data: prescriptionsData, isLoading } = useQuery<KnackRecordsResponse<Prescription>>({
    queryKey: ["/api/prescriptions"],
  });
  
  const prescriptions = prescriptionsData?.records;

  const filteredPrescriptions = prescriptions?.filter((prescription) => {
    const searchLower = searchQuery.toLowerCase();
    const medicationName = (prescription.field_80 || "").toLowerCase();
    const patientName = getPatientName(prescription.field_75_raw).toLowerCase();
    const matchesSearch =
      medicationName.includes(searchLower) ||
      patientName.includes(searchLower) ||
      (prescription.field_24 || "").toLowerCase().includes(searchLower);
    const matchesStatus =
      statusFilter === "all" ||
      (prescription.field_28 || "").toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Prescriptions"
        description="Manage patient prescriptions and medications"
        className="mb-6"
      >
        <Button asChild data-testid="button-new-prescription">
          <Link href="/prescriptions/new">
            <Plus className="mr-2 h-4 w-4" />
            New Prescription
          </Link>
        </Button>
      </PageHeader>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search prescriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-prescriptions"
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="discontinued">Discontinued</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <DataTableSkeleton columns={7} rows={8} />
          </CardContent>
        </Card>
      ) : !filteredPrescriptions || filteredPrescriptions.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={Pill}
              title="No prescriptions found"
              description={
                searchQuery || statusFilter !== "all"
                  ? "No prescriptions match your search criteria."
                  : "Get started by adding your first prescription."
              }
              action={
                !searchQuery && statusFilter === "all"
                  ? {
                      label: "Add Prescription",
                      onClick: () => (window.location.href = "/prescriptions/new"),
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
                  <TableHead className="w-[240px]">Medication & Dosage</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Instructions</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Refills</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrescriptions.map((prescription) => (
                  <TableRow
                    key={prescription.id}
                    className="hover-elevate cursor-pointer"
                    data-testid={`prescription-row-${prescription.id}`}
                    onClick={() => navigate(`/prescriptions/${prescription.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                          <Pill className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {prescription.field_80 || "Unknown Medication"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{getPatientName(prescription.field_75_raw)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 max-w-[200px]">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate text-sm">
                          {prescription.field_24 || "No instructions"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>
                          {formatKnackDate(prescription.field_25_raw)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>
                          {formatKnackDate(prescription.field_26_raw)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{prescription.field_27 ?? 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={prescription.field_28 || "active"} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-prescription-menu-${prescription.id}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/prescriptions/${prescription.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/prescriptions/${prescription.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Discontinue
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
