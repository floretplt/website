import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export function isAllowedAdminEmail(email: string | undefined) {
  if (!email) return false;
  const expected = process.env.ADMIN_EMAIL;
  if (!expected) {
    return process.env.NODE_ENV !== "production";
  }
  return email === expected;
}

export async function requireAdmin() {
  const user = await getUser();
  if (!user || !isAllowedAdminEmail(user.email ?? undefined)) {
    redirect("/admin/login");
  }
  return user;
}
