import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Database,
  Palette,
} from "lucide-react";

export default function Settings() {
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
