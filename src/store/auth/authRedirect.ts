import type { UserRole } from "@/store/auth/authTypes";

export function getLandingPathByRole(role: UserRole): string {
  if (role === "admin") {
    return "/admin/dashboard";
  }

  if (role === "staff") {
    return "/staff/dashboard";
  }

  return "/";
}

export function getDashboardPathByRole(role: UserRole): string | null {
  if (role === "admin") {
    return "/admin/dashboard";
  }

  if (role === "staff") {
    return "/staff/dashboard";
  }

  return null;
}
