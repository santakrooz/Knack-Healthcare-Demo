import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import {
  Stethoscope,
  Plus,
  Search,
  User,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Filter,
  CalendarDays,
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
import type { Diagnosis, KnackRecordsResponse } from "@shared/schema";

export default function Diagnoses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: diagnosesData, isLoading } = useQuery<KnackRecordsResponse<Diagnosis>>({
    queryKey: ["/api/diagnoses"],
  });
  
  const diagnoses = diagnosesData?.records;

  const filteredDiagnoses = diagnoses?.filter((diagnosis) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      (diagnosis.field_18 || "").toLowerCase().includes(searchLower) ||
      (diagnosis.field_21 || "").toLowerCase().includes(searchLower) ||
      (diagnosis.field_20 || "").toLowerCase().includes(searchLower);
    const matchesStatus =
      statusFilter === "all" ||
      (diagnosis.field_22 || "").toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "N/A";
    try {
      return format(parseISO(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Diagnoses"
        description="Track and manage patient diagnoses"
        className="mb-6"
      >
        <Button asChild data-testid="button-new-diagnosis">
          <Link href="/diagnoses/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Diagnosis
          </Link>
        </Button>
      </PageHeader>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search diagnoses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-diagnoses"
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
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="chronic">Chronic</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <DataTableSkeleton columns={5} rows={8} />
          </CardContent>
        </Card>
      ) : !filteredDiagnoses || filteredDiagnoses.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={Stethoscope}
              title="No diagnoses found"
              description={
                searchQuery || statusFilter !== "all"
                  ? "No diagnoses match your search criteria."
                  : "Get started by adding your first diagnosis record."
              }
              action={
                !searchQuery && statusFilter === "all"
                  ? {
                      label: "Add Diagnosis",
                      onClick: () => (window.location.href = "/diagnoses/new"),
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
                  <TableHead className="w-[280px]">Diagnosis</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDiagnoses.map((diagnosis) => (
                  <TableRow
                    key={diagnosis.id}
                    className="hover-elevate"
                    data-testid={`diagnosis-row-${diagnosis.id}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30">
                          <Stethoscope className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {diagnosis.field_18 || "Unknown Diagnosis"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ID: {diagnosis.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{diagnosis.field_21 || "Unassigned"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{formatDate(diagnosis.field_19_raw?.date)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {diagnosis.field_20 ? (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">
                            {diagnosis.field_20}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No notes</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={diagnosis.field_22 || "active"} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-diagnosis-menu-${diagnosis.id}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/diagnoses/${diagnosis.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/diagnoses/${diagnosis.id}/edit`}>
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
      )}
    </div>
  );
}
