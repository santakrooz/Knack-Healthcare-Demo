import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import PatientNew from "@/pages/patient-new";
import PatientProfile from "@/pages/patient-profile";
import Appointments from "@/pages/appointments";
import AppointmentNew from "@/pages/appointment-new";
import Prescriptions from "@/pages/prescriptions";
import PrescriptionNew from "@/pages/prescription-new";
import Diagnoses from "@/pages/diagnoses";
import Insurance from "@/pages/insurance";
import Settings from "@/pages/settings";
import Help from "@/pages/help";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/patients" component={Patients} />
      <Route path="/patients/new" component={PatientNew} />
      <Route path="/patients/:id" component={PatientProfile} />
      <Route path="/appointments" component={Appointments} />
      <Route path="/appointments/new" component={AppointmentNew} />
      <Route path="/prescriptions" component={Prescriptions} />
      <Route path="/prescriptions/new" component={PrescriptionNew} />
      <Route path="/diagnoses" component={Diagnoses} />
      <Route path="/insurance" component={Insurance} />
      <Route path="/settings" component={Settings} />
      <Route path="/help" component={Help} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex h-14 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-auto">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
