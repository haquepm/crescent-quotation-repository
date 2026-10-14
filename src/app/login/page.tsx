"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Building2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const params = useSearchParams();
  async function signIn() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      });
      if (error) throw error;
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unable to start Google sign-in.");
      setLoading(false);
    }
  }
  return <main className="min-h-screen grid lg:grid-cols-2 bg-white">
    <section className="hidden lg:flex flex-col justify-between p-14 text-white" style={{background:"linear-gradient(145deg,#102a43,#17496b)"}}>
      <div className="flex items-center gap-3"><div className="rounded-xl bg-white/10 p-3"><Building2 size={27}/></div><span className="font-semibold tracking-wide">CRESCENT CONTRACTORS</span></div>
      <div><p className="text-xs tracking-[.28em] text-amber-300 mb-4">PROCUREMENT INTELLIGENCE</p><h1 className="text-5xl font-semibold leading-tight max-w-xl">Every quotation.<br/>One trusted source.</h1><p className="mt-6 text-blue-100/75 max-w-md leading-7">A central workspace for quotation requests, vendor rates and informed purchasing decisions.</p></div>
      <p className="text-xs text-blue-100/50">Crescent Contractors · Internal business application</p>
    </section>
    <section className="flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="lg:hidden flex items-center gap-3 mb-14"><Building2/><strong>CRESCENT CONTRACTORS</strong></div>
        <div className="mb-10"><p className="text-sm font-semibold tracking-widest text-amber-700">QUOTATION REPOSITORY</p><h2 className="mt-3 text-3xl font-semibold text-slate-900">Welcome back</h2><p className="mt-2 text-slate-500">Sign in using your authorised Google account.</p></div>
        {params.get("error") && <p className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">Sign-in could not be completed. Please try again.</p>}
        <button onClick={signIn} disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3.5 font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"><GoogleMark/>{loading ? "Connecting…" : "Continue with Google"}</button>
        <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-400"><ShieldCheck size={15}/> Secure sign-in · Access managed by Administrator</div>
        <p className="mt-16 text-center text-xs text-slate-400">© {new Date().getFullYear()} Crescent Contractors. Internal use only.</p>
      </div>
    </section>
  </main>;
}

function GoogleMark() {
  return <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.73 6C44.45 38.05 46.98 31.95 46.98 24.55z"/><path fill="#FBBC05" d="M10.54 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.55 2.56 10.78l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.94-2.13 15.92-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.19 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>;
}