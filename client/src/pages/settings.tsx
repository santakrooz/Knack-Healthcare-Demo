import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Database,
  Palette,
  Stethoscope,
  ExternalLink,
  RefreshCw,
  UserRound,
  Pill,
  HeartPulse,
  FileText,
  Activity,
  Scissors,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataSource {
  name: string;
  provider: string;
}

interface LookupInfo {
  name: string;
  apiName: string;
  version: string;
  versionLabel: string;
  sources: DataSource[];
  docsUrl: string;
}

interface HealthcareLookups {
  physicians: LookupInfo;
  prescriptions: LookupInfo;
  conditions: LookupInfo;
  diagnosis: LookupInfo;
  phenotypes: LookupInfo;
  procedures: LookupInfo;
}

interface LookupCardProps {
  lookup?: LookupInfo;
  isLoading: boolean;
  icon: React.ReactNode;
  extraContent?: React.ReactNode;
}

function LookupCard({ lookup, isLoading, icon, extraContent }: LookupCardProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 rounded-lg border p-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  if (!lookup) return null;

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="font-medium">{lookup.name}</h4>
        </div>
        <a
          href={lookup.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
          data-testid={`link-${lookup.name.toLowerCase().replace(/\s+/g, '-')}-docs`}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      <p className="text-sm text-muted-foreground">{lookup.apiName}</p>
      <div className="text-sm">
        <span className="font-medium">{lookup.versionLabel}:</span>{" "}
        <span className="text-muted-foreground">{lookup.version}</span>
      </div>
      <div className="text-sm">
        <span className="font-medium">Data Sources:</span>
        <ul className="mt-1 space-y-1 text-muted-foreground">
          {lookup.sources.map((source, idx) => (
            <li key={idx} className="leading-relaxed">
              {source.name} from {source.provider}
            </li>
          ))}
        </ul>
      </div>
      {extraContent}
    </div>
  );
}

export default function Settings() {
  const [showRxcui, setShowRxcui] = useState(() => {
    const saved = localStorage.getItem("medportal_show_rxcui");
    return saved === "true";
  });

  const [physicianSettings, setPhysicianSettings] = useState(() => {
    const saved = localStorage.getItem("medportal_physician_settings");
    return saved ? JSON.parse(saved) : {
      showNpi: false,
      showPhone: true,
      showFax: false,
      showAddress: false,
    };
  });

  const [conditionSettings, setConditionSettings] = useState(() => {
    const saved = localStorage.getItem("medportal_condition_settings");
    return saved ? JSON.parse(saved) : {
      showIcd10: false,
      showIcd9: false,
      codePosition: "append", // "prefix" or "append"
    };
  });

  useEffect(() => {
    localStorage.setItem("medportal_show_rxcui", showRxcui.toString());
  }, [showRxcui]);

  useEffect(() => {
    localStorage.setItem("medportal_physician_settings", JSON.stringify(physicianSettings));
  }, [physicianSettings]);

  useEffect(() => {
    localStorage.setItem("medportal_condition_settings", JSON.stringify(conditionSettings));
  }, [conditionSettings]);

  const updateConditionSetting = (key: string, value: boolean | string) => {
    setConditionSettings((prev: Record<string, boolean | string>) => ({ ...prev, [key]: value }));
  };

  const updatePhysicianSetting = (key: string, value: boolean) => {
    setPhysicianSettings((prev: Record<string, boolean>) => ({ ...prev, [key]: value }));
  };

  const { data: lookups, isLoading: lookupsLoading, refetch: refetchLookups, isFetching } = useQuery<HealthcareLookups>({
    queryKey: ["/api/healthcare-lookups/versions"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Settings"
        description="Manage your application preferences and configuration"
        className="mb-8"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <SettingsIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Configure your medical office information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="office-name">Office Name</Label>
                  <Input
                    id="office-name"
                    placeholder="Medical Office"
                    defaultValue="MedPortal Clinic"
                    data-testid="input-office-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="office-phone">Phone Number</Label>
                  <Input
                    id="office-phone"
                    placeholder="(555) 123-4567"
                    data-testid="input-office-phone"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="office-address">Address</Label>
                <Input
                  id="office-address"
                  placeholder="123 Medical Center Drive"
                  data-testid="input-office-address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="office-email">Email</Label>
                <Input
                  id="office-email"
                  type="email"
                  placeholder="contact@medportal.com"
                  data-testid="input-office-email"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Configure how you receive notifications
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Appointment Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications before scheduled appointments
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-appointment-reminders" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Patient Forms</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new patient forms are submitted
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-new-patient-forms" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch data-testid="switch-email-notifications" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Database className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle>Knack Integration</CardTitle>
                  <CardDescription>
                    Configure your Knack database connection
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Connection Status</p>
                    <p className="text-sm text-muted-foreground">
                      Your Knack database is connected and syncing
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      Connected
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Application ID</Label>
                <Input
                  value="696ac7e9d09e7f3ff5b8cfa6"
                  disabled
                  className="font-mono text-sm"
                  data-testid="input-knack-app-id"
                />
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value="••••••••••••••••"
                  disabled
                  data-testid="input-knack-api-key"
                />
                <p className="text-xs text-muted-foreground">
                  API key is securely stored in environment variables
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                    <Stethoscope className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <CardTitle>Healthcare Data Lookups</CardTitle>
                    <CardDescription>
                      External healthcare data sources used for lookups
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => refetchLookups()}
                  disabled={isFetching}
                  data-testid="button-refresh-lookups"
                >
                  <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <LookupCard 
                lookup={lookups?.physicians} 
                isLoading={lookupsLoading} 
                icon={<UserRound className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                extraContent={
                  <div className="space-y-3 pt-2 border-t mt-3">
                    <p className="text-xs text-muted-foreground font-medium">
                      Include in physician display (Name & Type always shown):
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">NPI #</Label>
                        <Switch 
                          checked={physicianSettings.showNpi}
                          onCheckedChange={(v) => updatePhysicianSetting("showNpi", v)}
                          data-testid="switch-physician-npi"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Phone</Label>
                        <Switch 
                          checked={physicianSettings.showPhone}
                          onCheckedChange={(v) => updatePhysicianSetting("showPhone", v)}
                          data-testid="switch-physician-phone"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Fax</Label>
                        <Switch 
                          checked={physicianSettings.showFax}
                          onCheckedChange={(v) => updatePhysicianSetting("showFax", v)}
                          data-testid="switch-physician-fax"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Address</Label>
                        <Switch 
                          checked={physicianSettings.showAddress}
                          onCheckedChange={(v) => updatePhysicianSetting("showAddress", v)}
                          data-testid="switch-physician-address"
                        />
                      </div>
                    </div>
                  </div>
                }
              />
              <LookupCard 
                lookup={lookups?.prescriptions} 
                isLoading={lookupsLoading}
                icon={<Pill className="h-4 w-4 text-green-600 dark:text-green-400" />}
                extraContent={
                  <div className="flex items-center justify-between pt-2 border-t mt-3">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Show RXCUI Code</Label>
                      <p className="text-xs text-muted-foreground">
                        Append RXCUI code to medication results
                      </p>
                    </div>
                    <Switch 
                      checked={showRxcui}
                      onCheckedChange={setShowRxcui}
                      data-testid="switch-show-rxcui"
                    />
                  </div>
                }
              />
              <LookupCard 
                lookup={lookups?.conditions} 
                isLoading={lookupsLoading}
                icon={<HeartPulse className="h-4 w-4 text-red-600 dark:text-red-400" />}
                extraContent={
                  <div className="space-y-3 pt-2 border-t mt-3">
                    <p className="text-xs text-muted-foreground font-medium">
                      ICD code display options:
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Show ICD-10-CM</Label>
                        <Switch 
                          checked={conditionSettings.showIcd10}
                          onCheckedChange={(v) => updateConditionSetting("showIcd10", v)}
                          data-testid="switch-condition-icd10"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Show ICD-9-CM</Label>
                        <Switch 
                          checked={conditionSettings.showIcd9}
                          onCheckedChange={(v) => updateConditionSetting("showIcd9", v)}
                          data-testid="switch-condition-icd9"
                        />
                      </div>
                      {(conditionSettings.showIcd10 || conditionSettings.showIcd9) && (
                        <div className="space-y-1.5">
                          <Label className="text-sm">Code Position</Label>
                          <Select
                            value={conditionSettings.codePosition}
                            onValueChange={(v) => updateConditionSetting("codePosition", v)}
                          >
                            <SelectTrigger className="h-8" data-testid="select-code-position">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="append">Append (Condition [CODE])</SelectItem>
                              <SelectItem value="prefix">Prefix (CODE - Condition)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                }
              />
              <LookupCard 
                lookup={lookups?.diagnosis} 
                isLoading={lookupsLoading}
                icon={<FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
              />
              <LookupCard 
                lookup={lookups?.phenotypes} 
                isLoading={lookupsLoading}
                icon={<Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
              />
              <LookupCard 
                lookup={lookups?.procedures} 
                isLoading={lookupsLoading}
                icon={<Scissors className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />}
              />
              <p className="text-xs text-muted-foreground pt-2">
                Data provided by{" "}
                <a
                  href="https://clinicaltables.nlm.nih.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-primary"
                  data-testid="link-nlm-clinical-tables"
                >
                  NLM Clinical Table Search Service
                </a>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize the look of your application
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle dark mode theme
                  </p>
                </div>
                <Switch data-testid="switch-dark-mode" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>
                    Manage security settings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full" data-testid="button-change-password">
                Change Password
              </Button>
              <Button variant="outline" className="w-full" data-testid="button-two-factor">
                Enable Two-Factor Auth
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Button className="w-full" data-testid="button-save-settings">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
