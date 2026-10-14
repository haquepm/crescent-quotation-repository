"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, LoaderCircle, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Vendor={id:string;name:string;contact_person:string|null;email:string|null;phone:string|null;gst_number:string|null};
export default function VendorManagement(){
 const db=useMemo(()=>createClient(),[]);
 const [vendors,setVendors]=useState<Vendor[]>([]);
 const [term,setTerm]=useState("");
 const [name,setName]=useState(""); const [contact,setContact]=useState(""); const [email,setEmail]=useState(""); const [phone,setPhone]=useState(""); const [gst,setGst]=useState("");
 const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [success,setSuccess]=useState("");
 async function load(){const {data,error}=await db.from("vendors").select("id,name,contact_person,email,phone,gst_number").eq("is_active",true).order("name");if(error)setError(error.message);else setVendors((data??[]) as Vendor[]);}
 useEffect(()=>{void load();},[]);
 const matches=vendors.filter(v=>v.name.toLowerCase().includes(term.toLowerCase()));
 async function add(){
  const clean=name.trim(); if(!clean)return;
  setBusy(true);setError("");setSuccess("");
  const existing=vendors.find(v=>v.name.toLowerCase()===clean.toLowerCase());
  if(existing){setError("This vendor already exists. Select it from the existing vendor list.");setBusy(false);return;}
  const {data,error}=await db.from("vendors").insert({name:clean,contact_person:contact.trim()||null,email:email.trim()||null,phone:phone.trim()||null,gst_number:gst.trim()||null}).select("id,name,contact_person,email,phone,gst_number").single();
  if(error)setError(error.message);else{setVendors(old=>[...old,data as Vendor].sort((a,b)=>a.name.localeCompare(b.name)));setSuccess("Vendor added successfully.");setName("");setContact("");setEmail("");setPhone("");setGst("");}
  setBusy(false);
 }
 return <section className="space-y-5">
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
   <div className="mb-5 flex items-center gap-3"><div className="rounded-lg bg-amber-50 p-3 text-amber-700"><Users/></div><div><h2 className="text-xl font-semibold">Vendor Directory</h2><p className="text-sm text-slate-500">Search existing vendors or add a new vendor for quotation entry.</p></div></div>
   <label className="block text-sm font-medium">Find existing vendor
    <div className="relative mt-2"><Search className="absolute left-3 top-3 text-slate-400" size={17}/><input value={term} onChange={e=>setTerm(e.target.value)} placeholder="Start typing vendor name…" className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3 text-sm"/></div>
   </label>
   <div className="mt-3 max-h-56 overflow-auto rounded-lg border border-slate-100">{matches.length?matches.map(v=><div key={v.id} className="flex justify-between border-b border-slate-100 px-4 py-3 text-sm"><span className="font-medium">{v.name}</span><span className="text-slate-500">{v.phone||v.email||""}</span></div>):<p className="p-4 text-sm text-slate-500">No matching vendor found.</p>}</div>
  </div>
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
   <h3 className="flex items-center gap-2 font-semibold"><Plus size={18}/> Add New Vendor</h3><p className="mt-1 text-sm text-slate-500">A duplicate name is not allowed.</p>
   <div className="mt-5 grid gap-4 md:grid-cols-2">
    <label className="text-sm font-medium">Vendor name *<input value={name} onChange={e=>setName(e.target.value)} list="known-vendors" placeholder="Enter vendor name" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"/><datalist id="known-vendors">{vendors.map(v=><option key={v.id} value={v.name}/>)}</datalist></label>
    <label className="text-sm font-medium">Contact person<input value={contact} onChange={e=>setContact(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"/></label>
    <label className="text-sm font-medium">Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"/></label>
    <label className="text-sm font-medium">Phone<input value={phone} onChange={e=>setPhone(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"/></label>
    <label className="text-sm font-medium md:col-span-2">GST number<input value={gst} onChange={e=>setGst(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"/></label>
   </div>
   {error&&<p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{success&&<p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}
   <button disabled={!name.trim()||busy} onClick={()=>void add()} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#075b83] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy?<LoaderCircle className="animate-spin" size={16}/>:<Plus size={16}/>} Add Vendor</button>
  </div>
 </section>;
}