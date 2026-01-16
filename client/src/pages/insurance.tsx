import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Building2,
  Plus,
  Search,
  Phone,
  Globe,
  MapPin,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { EmptyState } from "@/components/empty-state";
import { DataTableSkeleton } from "@/components/data-table-skeleton";
import type { InsuranceCompany, KnackRecordsResponse } from "@shared/schema";

export default function Insurance() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: companiesData, isLoading } = useQuery<KnackRecordsResponse<InsuranceCompany>>({
    queryKey: ["/api/insurance"],
  });
  
  const companies = companiesData?.records;

  const filteredCompanies = companies?.filter((company) => {
    const searchLower = searchQuery.toLowerCase();
    return (company.field_27 || "").toLowerCase().includes(searchLower);
  });

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Insurance Companies"
        description="Manage insurance provider information"
        className="mb-6"
      >
        <Button asChild data-testid="button-add-insurance">
          <Link href="/insurance/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Link>
        </Button>
      </PageHeader>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search insurance companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-insurance"
          />
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <DataTableSkeleton columns={4} rows={6} />
          </CardContent>
        </Card>
      ) : !filteredCompanies || filteredCompanies.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={Building2}
              title="No insurance companies found"
              description={
                searchQuery
                  ? "No companies match your search criteria."
                  : "Get started by adding your first insurance company."
              }
              action={
                !searchQuery
                  ? {
                      label: "Add Company",
                      onClick: () => (window.location.href = "/insurance/new"),
                    }
                  : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company) => (
            <Card
              key={company.id}
              className="hover-elevate"
              data-testid={`insurance-card-${company.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">
                        {company.field_27 || "Unknown Company"}
                      </p>
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
                        <Link href={`/insurance/${company.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/insurance/${company.id}/edit`}>
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
                </div>

                <div className="mt-6 space-y-3">
                  {company.field_28 && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{company.field_28}</span>
                    </div>
                  )}
                  {company.field_29 && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={company.field_29_raw?.url || company.field_29}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        {company.field_29}
                      </a>
                    </div>
                  )}
                  {company.field_30 && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{company.field_30}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/insurance/${company.id}`}>View Details</Link>
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
