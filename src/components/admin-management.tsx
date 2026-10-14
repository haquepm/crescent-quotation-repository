"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, ShieldCheck, Users, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type TeamProfile = { id:string; full_name:string|null; email:string|null; role:"admin"|"estimator"|"purchase_manager"|"guest"; account_status:"pending"|"active"|"disabled"; created_at:string };
const roles = [
 {value:"estimator",label:"Estimator"},
 {value:"purchase_manager",label:"Purchase Manager"},
 {value:"guest",label:"Guest"},
 {value:"admin",label:"Admin"}
] as const;
const statuses = [
 {value:"pending",label:"Pending approval"},
 {value:"active",label:"Active"},
 {value:"disabled",label:"Disabled"}
] as const;

export default function AdminManagement({currentUserId}:{currentUserId:string}){
 const db=useMemo(()=>createClient(),[]);
 const [people,setPeople]=useState<TeamProfile[]>([]);
 const [drafts,setDrafts]=useState<Record<string,{role:TeamProfile["role"];account_status:TeamProfile["account_status"]}>>({});
 const [busy,setBusy]=useState<string|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 async function load(){
  setLoading(true);setError("");
  const {data,error}=await db.from("profiles").select("id,full_name,email,role,account_status,created_at").order("created_at",{ascending:false});
  if(error)setError(error.message);
  else {const rows=(data??[]) as TeamProfile[];setPeople(rows);setDrafts(Object.fromEntries(rows.map(p=>[p.id,{role:p.role,account_status:p.account_status}])));}
  setLoading(false);
 }
 useEffect(()=>{void load();},[]);
 async function save(person:TeamProfile){
  const draft=drafts[person.id];if(!draft)return;
  if(person.id===currentUserId && (draft.role!=="admin"||draft.account_status!=="active")){setError("You cannot change or deactivate your own administrator access.");return;}
  setBusy(person.id);setError("");setNotice("");
  const {error}=await db.from("profiles").update({role:draft.role,account_status:draft.account_status,updated_at:new Date().toISOString()}).eq("id",person.id);
  if(error)setError(error.message);
  else {setPeople(old=>old.map(p=>p.id===person.id?{...p,...draft}:p));setNotice("User access updated.");}
  setBusy(null);
 }
 return <section className="space-y-5">
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex items-center gap-3"><div className="rounded-lg bg-amber-50 p-3 text-amber-700"><ShieldCheck/></div><div><h2 className="text-xl font-semibold">User & Role Management</h2><p className="text-sm text-slate-500">Approve Google sign-ins and assign access by job role.</p></div></div>
    <button onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"><RefreshCw size={15}/> Refresh</button>
   </div>
   <div className="mt-5 grid gap-3 sm:grid-cols-3">
    <div className="rounded-lg bg-slate-50 p-4"><div className="text-xs text-slate-500">Total accounts</div><div className="mt-1 text-2xl font-semibold">{people.length}</div></div>
    <div className="rounded-lg bg-emerald-50 p-4"><div className="text-xs text-emerald-700">Active</div><div className="mt-1 text-2xl font-semibold text-emerald-800">{people.filter(p=>p.account_status==="active").length}</div></div>
    <div className="rounded-lg bg-amber-50 p-4"><div className="text-xs text-amber-700">Awaiting approval</div><div className="mt-1 text-2xl font-semibold text-amber-800">{people.filter(p=>p.account_status==="pending").length}</div></div>
   </div>
  </div>
  {error&&<p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
  {notice&&<p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
   <div className="border-b border-slate-100 px-6 py-4"><h3 className="flex items-center gap-2 font-semibold"><Users size={18}/> Registered Google Accounts</h3><p className="mt-1 text-xs text-slate-500">Employees must sign in with their company-approved Google account once before they appear here.</p></div>
   {loading?<div className="p-10 text-center text-sm text-slate-500"><LoaderCircle className="mx-auto mb-2 animate-spin"/>Loading users…</div>:people.length===0?<p className="p-8 text-center text-sm text-slate-500">No accounts have signed in yet.</p>:<div className="divide-y divide-slate-100">{people.map(person=>{const draft=drafts[person.id]??{role:person.role,account_status:person.account_status};const changed=draft.role!==person.role||draft.account_status!==person.account_status;const self=person.id===currentUserId;return <div key={person.id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto] lg:items-center">
    <div className="min-w-0"><div className="truncate font-medium text-slate-800">{person.full_name||"Name not provided"} {self&&<span className="ml-2 rounded-full bg-blue-50 px-2 py-1 text-[10px] text-blue-700">YOU</span>}</div><div className="truncate text-sm text-slate-500">{person.email||"No email"}</div><div className="mt-1 text-xs text-slate-400">Joined {new Date(person.created_at).toLocaleDateString("en-IN")}</div></div>
    <label className="text-xs font-medium text-slate-500">Role<select disabled={self} value={draft.role} onChange={e=>setDrafts(old=>({...old,[person.id]:{...draft,role:e.target.value as TeamProfile["role"]}}))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 disabled:bg-slate-100">{roles.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}</select></label>
    <label className="text-xs font-medium text-slate-500">Account status<select disabled={self} value={draft.account_status} onChange={e=>setDrafts(old=>({...old,[person.id]:{...draft,account_status:e.target.value as TeamProfile["account_status"]}}))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 disabled:bg-slate-100">{statuses.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
    <button disabled={!changed||busy===person.id||self} onClick={()=>void save(person)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#075b83] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">{busy===person.id?<LoaderCircle size={15} className="animate-spin"/>:"Save access"}</button>
   </div>})}</div>}
  </div>
 </section>;
}
