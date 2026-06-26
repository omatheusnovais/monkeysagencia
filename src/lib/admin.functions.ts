import { createServerFn } from "@tanstack/react-start";

const ADMIN_EMAIL = "monkeys@crm.local";
const ADMIN_PASSWORD = "fgib2mmz";

// Idempotent admin seeding. Safe to call from the login page on mount.
export const seedAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) throw listErr;

  const existing = list.users.find((u) => u.email === ADMIN_EMAIL);
  if (existing) return { ok: true, created: false };

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { username: "monkeys" },
  });
  if (error) throw error;
  return { ok: true, created: true };
});
