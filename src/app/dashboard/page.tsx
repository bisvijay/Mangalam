import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarDays, Users, BedDouble, MessageSquare } from "lucide-react";
import { getStore } from "@/lib/data";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const store = getStore();
  let bookingCount = 0;
  let customerCount = 0;
  let inquiryCount = 0;

  try {
    const bookings = await store.list("bookings");
    bookingCount = bookings.length;
  } catch { /* empty */ }
  try {
    const customers = await store.list("customers");
    customerCount = customers.length;
  } catch { /* empty */ }
  try {
    const inquiries = await store.list("inquiries");
    inquiryCount = inquiries.length;
  } catch { /* empty */ }

  const stats = [
    {
      title: "Bookings",
      value: String(bookingCount),
      description: "Total bookings",
      icon: CalendarDays,
      href: "/dashboard/bookings",
    },
    {
      title: "Rooms",
      value: "18",
      description: "Total rooms (3 floors)",
      icon: BedDouble,
      href: "/dashboard/bookings",
    },
    {
      title: "Customers",
      value: String(customerCount),
      description: "Total customers",
      icon: Users,
      href: "/dashboard/customers",
    },
    {
      title: "Inquiries",
      value: String(inquiryCount),
      description: "Website inquiries",
      icon: MessageSquare,
      href: "/dashboard/inquiries",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user?.name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <CardDescription>{stat.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
