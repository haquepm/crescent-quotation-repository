import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Workspace from "@/components/workspace";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("full_name,email,role,account_status").eq("id", user.id).maybeSingle();
  if (!profile || profile.account_status !== "active") return <main className="min-h-screen grid place-items-center p-6"><div className="max-w-md rounded-2xl bg-white p-9 text-center shadow-sm border border-slate-100"><h1 className="text-xl font-semibold">Access awaiting approval</h1><p className="mt-3 text-sm leading-6 text-slate-500">Your Google account is signed in, but an Administrator must activate your account and assign your role before you can use the repository.</p><p className="mt-4 text-xs text-slate-400">{user.email}</p></div></main>;
  return <Workspace profile={profile}/>;
}