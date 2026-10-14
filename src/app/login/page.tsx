"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Building2, ShieldCheck, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
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
  return <main className="min-h-screen grid lg:grid-cols-[1.05fr_.95fr] bg-[#070811] text-white">
    <section className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-white/10 p-14">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_12%,rgba(142,111,255,.30),transparent_34%),radial-gradient(ellipse_at_15%_85%,rgba(38,157,177,.12),transparent_38%)]"/>
      <div className="relative flex items-center gap-3"><div className="rounded-2xl border border-white/10 bg-white/[.07] p-3 shadow-lg"><Building2 size={27}/></div><div><div className="font-bold tracking-[.13em]">CRESCENT</div><div className="text-[10px] tracking-[.28em] text-violet-200/70">CONTRACTORS</div></div></div>
      <div className="relative max-w-2xl"><p className="mb-5 flex items-center gap-2 text-xs font-semibold tracking-[.3em] text-violet-300"><Sparkles size={15}/> PROCUREMENT INTELLIGENCE</p><h1 className="text-6xl font-semibold leading-[1.12] tracking-[-.045em]">Every quotation.<br/><span className="bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">One trusted source.</span></h1><p className="mt-7 max-w-lg text-base leading-8 text-slate-300">A central workspace for quotation requests, vendor rates and informed purchasing decisions.</p></div>
      <div className="relative flex items-center justify-between text-xs text-slate-500"><span>Crescent Contractors · Internal business application</span><span className="text-slate-400">Designed &amp; Developed by <strong className="text-violet-200">Mutheeul Haq</strong></span></div>
    </section>
    <section className="relative flex items-center justify-center overflow-hidden p-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(126,99,207,.16),transparent_42%)]"/>
      <div className="relative w-full max-w-md">
        <div className="mb-12 flex items-center gap-3 lg:hidden"><Building2/><strong className="tracking-widest">CRESCENT CONTRACTORS</strong></div>
        <div className="mb-10"><p className="text-xs font-semibold tracking-[.28em] text-violet-300">QUOTATION REPOSITORY</p><h2 className="mt-4 text-4xl font-semibold tracking-tight text-white">Welcome back</h2><p className="mt-3 text-sm leading-6 text-slate-400">Sign in using your authorised Google account.</p></div>
        <button onClick={signIn} disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-xl border border-violet-200/20 bg-white/[.06] py-4 font-semibold text-white shadow-[0_12px_35px_rgba(0,0,0,.25)] transition hover:border-violet-200/40 hover:bg-white/[.1] disabled:opacity-60"><GoogleMark/>{loading ? "Connecting…" : "Continue with Google"}</button>
        <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldCheck size={15} className="text-violet-300"/> Secure sign-in · Access managed by Administrator</div>
        <p className="mt-16 text-center text-xs leading-6 text-slate-500">© {new Date().getFullYear()} Crescent Contractors. Internal use only.<br/><span className="text-slate-400">Designed &amp; Developed by <strong className="font-semibold text-violet-200">Mutheeul Haq</strong></span></p>
      </div>
    </section>
  </main>;
}

function GoogleMark() {
  return <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.73 6C44.45 38.05 46.98 31.95 46.98 24.55z"/><path fill="#FBBC05" d="M10.54 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.55 2.56 10.78l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.94-2.13 15.92-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.19 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>;
}