import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import {
  HelpCircle,
  Book,
  MessageCircle,
  Phone,
  Mail,
  FileText,
  Video,
  Search,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

const quickLinks = [
  {
    title: "Getting Started Guide",
    description: "Learn the basics of using MedPortal",
    icon: Book,
    href: "#",
  },
  {
    title: "Video Tutorials",
    description: "Watch step-by-step video guides",
    icon: Video,
    href: "#",
  },
  {
    title: "Documentation",
    description: "Detailed documentation and API reference",
    icon: FileText,
    href: "#",
  },
  {
    title: "Contact Support",
    description: "Get help from our support team",
    icon: MessageCircle,
    href: "#",
  },
];

const faqItems = [
  {
    question: "How do I add a new patient?",
    answer:
      "Navigate to the Patients section and click the 'Add Patient' button. Fill in the required information and submit the form.",
  },
  {
    question: "How do I schedule an appointment?",
    answer:
      "Go to Appointments, click 'New Appointment', select a patient, choose a date and time, and confirm the booking.",
  },
  {
    question: "How do I manage prescriptions?",
    answer:
      "The Prescriptions section allows you to create, edit, and track medications for your patients. You can also set reminders for refills.",
  },
  {
    question: "How does the Knack integration work?",
    answer:
      "MedPortal syncs with your Knack database in real-time. All data is securely stored and accessible through both platforms.",
  },
];

export default function Help() {
  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Help Center"
        description="Find answers to your questions and get support"
        className="mb-8"
      />

      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for help articles..."
            className="h-14 pl-12 text-lg"
            data-testid="input-search-help"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {quickLinks.map((link) => (
          <Card
            key={link.title}
            className="hover-elevate cursor-pointer"
            data-testid={`card-${link.title.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <link.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{link.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {link.description}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Find quick answers to common questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border p-4 hover-elevate"
                  data-testid={`faq-item-${index}`}
                >
                  <h4 className="font-semibold mb-2">{item.question}</h4>
                  <p className="text-sm text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>
                Can't find what you're looking for? Reach out to us.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Email Support</p>
                  <p className="text-sm text-muted-foreground">
                    support@medportal.com
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Phone Support</p>
                  <p className="text-sm text-muted-foreground">
                    1-800-MED-PORT
                  </p>
                </div>
              </div>
              <Button className="w-full" data-testid="button-contact-support">
                <MessageCircle className="mr-2 h-4 w-4" />
                Start Live Chat
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a
                href="#"
                className="flex items-center justify-between rounded-lg border p-3 hover-elevate"
              >
                <span className="font-medium">API Documentation</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
              <a
                href="#"
                className="flex items-center justify-between rounded-lg border p-3 hover-elevate"
              >
                <span className="font-medium">Release Notes</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
              <a
                href="#"
                className="flex items-center justify-between rounded-lg border p-3 hover-elevate"
              >
                <span className="font-medium">Community Forum</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
