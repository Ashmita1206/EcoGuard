"use client";

import React from "react"

import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { loggingFetcher } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Headphones,
  LayoutDashboard,
  Phone,
  BookOpen,
  Settings,
  Users,
  BarChart3,
  Bell,
  LogOut,
  Menu,
  X,
  Lightbulb,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "",
    icon: LayoutDashboard,
    roles: ["agent", "supervisor", "admin"],
  },
  {
    label: "My Calls",
    href: "/calls",
    icon: Phone,
    roles: ["agent"],
  },
  {
    label: "Coaching",
    href: "/coaching",
    icon: Lightbulb,
    roles: ["agent"],
  },
  {
    label: "Team Calls",
    href: "/calls",
    icon: Phone,
    roles: ["supervisor"],
  },
  {
    label: "Team Performance",
    href: "/team",
    icon: Users,
    roles: ["supervisor"],
  },
  {
    label: "Evaluations",
    href: "/evaluations",
    icon: FileText,
    roles: ["supervisor"],
  },
  {
    label: "All Calls",
    href: "/calls",
    icon: Phone,
    roles: ["admin"],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    roles: ["admin"],
  },
  {
    label: "Users",
    href: "/users",
    icon: Users,
    roles: ["admin"],
  },
  {
    label: "SOPs",
    href: "/sops",
    icon: BookOpen,
    roles: ["supervisor", "admin"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["admin"],
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole: UserRole | UserRole[];
}

export function DashboardLayout({
  children,
  requiredRole,
}: DashboardLayoutProps) {
  const { user, isLoading, isAuthenticated, isAuthorized, logout } =
    useAuth(requiredRole);
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    } else if (!isLoading && isAuthenticated && !isAuthorized) {
      // Redirect to appropriate dashboard based on role
      switch (user?.role) {
        case "admin":
          router.push("/admin");
          break;
        case "supervisor":
          router.push("/supervisor");
          break;
        default:
          router.push("/agent");
      }
    }
  }, [isLoading, isAuthenticated, isAuthorized, router, user]);

  // Fetch notifications (logs before/after in loggingFetcher)
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const key = typeof window !== 'undefined' ? localStorage.getItem('notificationKey') : null;
        if (!key) {
          // eslint-disable-next-line no-console
          console.warn('[notifications] notificationKey missing in localStorage');
        }

        const headers: Record<string, string> = key ? { 'x-notification-key': key } : {};
        const url = `/api/notifications`;
        const result = await loggingFetcher(url, { headers });
        // notifications fetched
        const items = result?.notifications || result?.alerts || [];
        setNotifications(Array.isArray(items) ? items : []);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[notifications] fetch failed', err);
      }
    };

    fetchNotifications();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAuthorized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Accessing EchoGuard — redirecting...</p>
        </div>
      </div>
    );
  }

  const baseRoute = `/${user.role}`;
  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <Headphones className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-sidebar-foreground">
              EchoGuard
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {filteredNavItems.map((item) => {
              const href = `${baseRoute}${item.href}`;
              const isActive =
                pathname === href ||
                (item.href !== "" && pathname.startsWith(href));

              return (
                <a
                  key={item.label}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.name}
                </p>
                <p className="text-xs text-sidebar-foreground/60 capitalize">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative" onClick={() => {
              // notifications clicked
            }}>
              <Bell className="h-5 w-5" />
              {notifications.length > 0 ? (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-destructive text-xs text-white">
                  {notifications.length}
                </span>
              ) : (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
