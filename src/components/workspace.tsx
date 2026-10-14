"use client";

import { useState } from "react";
import ProjectQuotationSearch from "@/components/project-quotation-search";
import VendorManagement from "@/components/vendor-management";
import { createClient } from "@/lib/supabase/client";
import { Archive, BarChart3, Bell, CheckCircle2, ClipboardList, FilePlus2, LayoutDashboard, LogOut, Menu, Search, Users, X, Store } from "lucide-react";

type Profile = { full_name: string | null; email: string | null; role: string; account_status: string };
const allNav = [
 {label:"Overview",icon:LayoutDashboard,roles:["admin"]},
 {label:"Submit Request",icon:FilePlus2,roles:["admin","estimator"]},
 {label:"Fulfil Requests",icon:ClipboardList,roles:["admin","purchase_manager"]},
 {label:"Price Analyser",icon:BarChart3,roles:["admin","purchase_manager","estimator","guest"]},
 {label:"Project Quotations",icon:Search,roles:["admin","purchase_manager","guest"]},
 {label:"Vendors",icon:Store,roles:["admin","purchase_manager"]}
];

export default function Workspace({profile}:{profile:Profile}){
 const [active,setActive]=useState(profile.role==="guest"?"Price Analyser":profile.role==="estimator"?"Submit Request":"Overview");
 const [mobileOpen,setMobileOpen]=useState(false);
 async function signOut(){await createClient().auth.signOut();window.location.href="/login";}
 const name=profile.full_name||profile.email?.split("@")[0]||"Team member";
 const allowed=allNav.filter(n=>n.roles.includes(profile.role));
 return <div className="min-h-screen md:flex">
  {mobileOpen&&<button aria-label="Close navigation" onClick={()=>setMobileOpen(false)} className="fixed inset-0 z-30 bg-slate-950/30 md:hidden"/>}
  <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#102a43] text-white transition-transform md:static md:translate-x-0 ${mobileOpen?"translate-x-0":"-translate-x-full"}`}>
   <div className="flex h-20 items-center justify-between border-b border-white/10 px-6"><div><div className="text-sm font-bold tracking-[.16em]">CRESCENT</div><div className="mt-1 text-[10px] tracking-[.22em] text-blue-200/70">CONTRACTORS</div></div><button className="md:hidden" onClick={()=>setMobileOpen(false)}><X/></button></div>
   <div className="px-5 pt-7 pb-3 text-[10px] font-semibold tracking-[.2em] text-blue-200/50">WORKSPACE</div>
   <nav className="space-y-1 px-3">{allowed.map(item=><button key={item.label} onClick={()=>{setActive(item.label);setMobileOpen(false)}} className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition ${active===item.label?"bg-white/12 text-white":"text-blue-100/70 hover:bg-white/5 hover:text-white"}`}><item.icon size={18}/>{item.label}</button>)}</nav>
   {profile.role==="admin"&&<><div className="px-5 pt-8 pb-3 text-[10px] font-semibold tracking-[.2em] text-blue-200/50">ADMINISTRATION</div><nav className="px-3"><button onClick={()=>setActive("Administration")} className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm ${active==="Administration"?"bg-white/12":"text-blue-100/70 hover:bg-white/5"}`}><Users size={18}/> Users & Settings</button></nav></>}
   <div className="mt-auto border-t border-white/10 p-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-amber-500/20 text-sm font-semibold text-amber-200">{name.slice(0,1).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{name}</div><div className="text-xs capitalize text-blue-200/60">{profile.role.replace("_"," ")}</div></div><button title="Sign out" onClick={signOut} className="text-blue-200/60 hover:text-white"><LogOut size={17}/></button></div></div>
  </aside>
  <main className="min-w-0 flex-1">
   <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 md:px-9"><div className="flex items-center gap-3"><button className="md:hidden" onClick={()=>setMobileOpen(true)}><Menu/></button><div><div className="text-sm text-slate-400">Crescent Contractors / {active}</div><h1 className="text-lg font-semibold text-slate-800">{active}</h1></div></div><div className="flex items-center gap-4"><div className="hidden items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 sm:flex"><Search size={15}/><span>Quotation Repository</span></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium capitalize text-slate-600">{profile.role.replace("_"," ")}</span></div></header>
   <div className="mx-auto max-w-7xl p-5 md:p-9">
    <div className="mb-8"><p className="text-sm text-slate-500">Welcome back,</p><h2 className="mt-1 text-2xl font-semibold text-slate-900">{name}</h2><p className="mt-2 text-sm text-slate-500">{profile.role==="guest"?"Read-only access to the Price Analyser and project-wise quotation history.":"Your role-based workspace for quotations and vendor pricing."}</p></div>
    {active==="Project Quotations"?<ProjectQuotationSearch/>:active==="Vendors"?<VendorManagement/>:active==="Overview"?<div className="rounded-xl border border-slate-200 bg-white p-7"><h3 className="font-semibold">Quotation Repository</h3><p className="mt-2 text-sm text-slate-500">Manage quotation requests, vendor pricing and analysis from one workspace.</p></div>:<section className="rounded-xl border border-slate-200 bg-white p-8"><div className="flex items-center gap-3"><div className="rounded-lg bg-amber-50 p-3 text-amber-700">{active==="Submit Request"?<FilePlus2/>:active==="Fulfil Requests"?<ClipboardList/>:<BarChart3/>}</div><div><h3 className="font-semibold text-slate-800">{active}</h3><p className="text-sm text-slate-500">This module is being connected to the live quotation database.</p></div></div><div className="mt-6 rounded-lg border border-dashed border-slate-200 p-6"><p className="text-sm text-slate-600">{active==="Price Analyser"?"Search and compare saved quotation rates.":"The live form and database workflow will be enabled in the next implementation stage."}</p></div></section>}
   </div>
   <footer className="px-9 pb-7 text-xs text-slate-400">Crescent Contractors · Quotation Repository</footer>
  </main>
 </div>;
}