"use client";

import { useEffect, useMemo, useState } from "react";
import { FolderKanban, Package, Plus, RefreshCw, LoaderCircle, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Project={id:string;name:string;code:string|null;is_active:boolean;created_at:string};
type Item={id:string;name:string;item_code:string|null;category:string|null;unit:string|null;description:string|null;is_active:boolean;created_at:string};
export default function MasterDataManagement({userId}:{userId:string}){
 const db=useMemo(()=>createClient(),[]);
 const [tab,setTab]=useState<"projects"|"items">("projects");
 const [projects,setProjects]=useState<Project[]>([]);
 const [items,setItems]=useState<Item[]>([]);
 const [term,setTerm]=useState("");
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [projectName,setProjectName]=useState("");const [projectCode,setProjectCode]=useState("");
 const [itemName,setItemName]=useState("");const [itemCode,setItemCode]=useState("");const [category,setCategory]=useState("");const [unit,setUnit]=useState("");const [description,setDescription]=useState("");
 async function load(){
  setLoading(true);setError("");
  const [p,i]=await Promise.all([
   db.from("projects").select("id,name,code,is_active,created_at").order("name"),
   db.from("items").select("id,name,item_code,category,unit,description,is_active,created_at").order("name")
  ]);
  if(p.error||i.error)setError(p.error?.message||i.error?.message||"Unable to load master data.");
  else{setProjects((p.data??[]) as Project[]);setItems((i.data??[]) as Item[]);}
  setLoading(false);
 }
 useEffect(()=>{void load();},[]);
 const projectMatches=projects.filter(p=>(p.name+" "+(p.code||"")).toLowerCase().includes(term.toLowerCase()));
 const itemMatches=items.filter(i=>(i.name+" "+(i.item_code||"")+" "+(i.category||"")).toLowerCase().includes(term.toLowerCase()));
 async function addProject(){
  if(!projectName.trim())return;setBusy(true);setError("");setNotice("");
  const {error}=await db.from("projects").insert({name:projectName.trim(),code:projectCode.trim()||null,created_by:userId});
  if(error)setError(error.code==="23505"?"A project with the same unique details already exists.":error.message);
  else{setProjectName("");setProjectCode("");setNotice("Project created.");await load();}
  setBusy(false);
 }
 async function addItem(){
  if(!itemName.trim())return;setBusy(true);setError("");setNotice("");
  const {error}=await db.from("items").insert({name:itemName.trim(),item_code:itemCode.trim()||null,category:category.trim()||null,unit:unit.trim()||null,description:description.trim()||null});
  if(error)setError(error.code==="23505"?"This item and item code combination already exists.":error.message);
  else{setItemName("");setItemCode("");setCategory("");setUnit("");setDescription("");setNotice("Item created.");await load();}
  setBusy(false);
 }
 async function toggleProject(p:Project){
  setBusy(true);setError("");const {error}=await db.from("projects").update({is_active:!p.is_active}).eq("id",p.id);
  if(error)setError(error.message);else setProjects(old=>old.map(x=>x.id===p.id?{...x,is_active:!x.is_active}:x));setBusy(false);
 }
 async function toggleItem(i:Item){
  setBusy(true);setError("");const {error}=await db.from("items").update({is_active:!i.is_active}).eq("id",i.id);
  if(error)setError(error.message);else setItems(old=>old.map(x=>x.id===i.id?{...x,is_active:!x.is_active}:x));setBusy(false);
 }
 return <section className="space-y-5">
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
   <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Project & Item Masters</h2><p className="mt-1 text-sm text-slate-500">Create and maintain the approved project and item lists used in quotation requests.</p></div><button onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"><RefreshCw size={15}/> Refresh</button></div>
   <div className="mt-5 flex gap-2"><button onClick={()=>{setTab("projects");setTerm("");}} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${tab==="projects"?"bg-[#075b83] text-white":"bg-slate-100 text-slate-600"}`}><FolderKanban size={16}/> Projects ({projects.length})</button><button onClick={()=>{setTab("items");setTerm("");}} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${tab==="items"?"bg-[#075b83] text-white":"bg-slate-100 text-slate-600"}`}><Package size={16}/> Items ({items.length})</button></div>
  </div>
  {error&&<p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{notice&&<p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
   <h3 className="flex items-center gap-2 font-semibold"><Plus size={18}/> Add {tab==="projects"?"Project":"Item"}</h3>
   {tab==="projects"?<div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]"><label className="text-sm font-medium">Project name *<input value={projectName} onChange={e=>setProjectName(e.target.value)} placeholder="Enter project name" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"/></label><label className="text-sm font-medium">Project code<input value={projectCode} onChange={e=>setProjectCode(e.target.value)} placeholder="Optional code" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"/></label><button disabled={!projectName.trim()||busy} onClick={()=>void addProject()} className="self-end rounded-lg bg-[#075b83] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy?"Saving…":"Add Project"}</button></div>:<div className="mt-4 grid gap-4 md:grid-cols-2"><label className="text-sm font-medium">Item name *<input value={itemName} onChange={e=>setItemName(e.target.value)} placeholder="Enter item name" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"/></label><label className="text-sm font-medium">Item code<input value={itemCode} onChange={e=>setItemCode(e.target.value)} placeholder="Optional code" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"/></label><label className="text-sm font-medium">Category<input value={category} onChange={e=>setCategory(e.target.value)} placeholder="e.g. Civil, Electrical" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"/></label><label className="text-sm font-medium">Unit<input value={unit} onChange={e=>setUnit(e.target.value)} placeholder="e.g. Nos, Sqft, Cum, Kg" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"/></label><label className="text-sm font-medium md:col-span-2">Description<input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Optional description" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"/></label><div className="md:col-span-2"><button disabled={!itemName.trim()||busy} onClick={()=>void addItem()} className="rounded-lg bg-[#075b83] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy?"Saving…":"Add Item"}</button></div></div>}
  </div>
  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
   <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5"><h3 className="font-semibold">Existing {tab==="projects"?"Projects":"Items"}</h3><div className="relative w-full max-w-sm"><Search className="absolute left-3 top-3 text-slate-400" size={16}/><input value={term} onChange={e=>setTerm(e.target.value)} placeholder="Search…" className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm"/></div></div>
   {loading?<div className="p-8 text-center text-sm text-slate-500"><LoaderCircle className="mx-auto mb-2 animate-spin"/>Loading master data…</div>:tab==="projects"?<div className="divide-y divide-slate-100">{projectMatches.map(p=><div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><div className="font-medium">{p.name}</div><div className="text-xs text-slate-500">{p.code||"No project code"}</div></div><div className="flex items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-xs ${p.is_active?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500"}`}>{p.is_active?"Active":"Inactive"}</span><button disabled={busy} onClick={()=>void toggleProject(p)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium">{p.is_active?"Deactivate":"Activate"}</button></div></div>)}{!projectMatches.length&&<p className="p-8 text-center text-sm text-slate-500">No projects found.</p>}</div>:<div className="divide-y divide-slate-100">{itemMatches.map(i=><div key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div className="min-w-0"><div className="font-medium">{i.name}</div><div className="text-xs text-slate-500">{[i.item_code,i.category,i.unit].filter(Boolean).join(" · ")||"No additional details"}</div>{i.description&&<div className="mt-1 text-xs text-slate-400">{i.description}</div>}</div><div className="flex items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-xs ${i.is_active?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500"}`}>{i.is_active?"Active":"Inactive"}</span><button disabled={busy} onClick={()=>void toggleItem(i)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium">{i.is_active?"Deactivate":"Activate"}</button></div></div>)}{!itemMatches.length&&<p className="p-8 text-center text-sm text-slate-500">No items found.</p>}</div>}
  </div>
 </section>;
}
