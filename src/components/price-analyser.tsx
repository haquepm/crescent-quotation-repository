"use client";

import { useEffect,useMemo,useState } from "react";
import { BarChart3,Search,LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Project={id:string;name:string};
type Item={id:string;name:string;item_code:string|null};
type Quote={id:string;quotation_date:string;quoted_rate:number;adjusted_rate:number|null;labour:number;transport:number;gst_percent:number|null;make:string|null;description:string|null;vendors:{name:string}|null;projects:{name:string}|null;items:{name:string}|null};

export default function PriceAnalyser(){
 const supabase=useMemo(()=>createClient(),[]);
 const [projects,setProjects]=useState<Project[]>([]);
 const [items,setItems]=useState<Item[]>([]);
 const [projectId,setProjectId]=useState("");
 const [itemName,setItemName]=useState("");
 const [term,setTerm]=useState("");
 const [rows,setRows]=useState<Quote[]>([]);
 const [loading,setLoading]=useState(false);
 const [searched,setSearched]=useState(false);
 const [error,setError]=useState("");
 useEffect(()=>{let live=true;(async()=>{const {data,error}=await supabase.from("projects").select("id,name").eq("is_active",true).order("name");if(!live)return;if(error)setError(error.message);else setProjects((data??[]) as Project[])})();return()=>{live=false}},[supabase]);
 useEffect(()=>{let live=true;(async()=>{const {data,error}=await supabase.from("items").select("id,name,item_code").eq("is_active",true).order("name");if(!live)return;if(error)setError(error.message);else setItems((data??[]) as Item[])})();return()=>{live=false}},[supabase]);
 async function search(){setLoading(true);setError("");setSearched(false);const chosen=items.find(i=>i.name.toLocaleLowerCase()===itemName.trim().toLocaleLowerCase());if(itemName.trim()&&!chosen){setError("Please select an item from the suggestions, or clear the field to analyse all items.");setLoading(false);return;}let q=supabase.from("quotations").select("id,quotation_date,quoted_rate,adjusted_rate,labour,transport,gst_percent,make,description,vendors(name),projects(name),items(name)").order("quotation_date",{ascending:false}).limit(500);if(projectId)q=q.eq("project_id",projectId);if(chosen)q=q.eq("item_id",chosen.id);const {data,error}=await q;if(error)setError(error.message);else setRows((data??[]) as unknown as Quote[]);setLoading(false);setSearched(true)}
 const filtered=rows.filter(r=>!term||[r.vendors?.name,r.make,r.description,r.items?.name].some(v=>v?.toLowerCase().includes(term.toLowerCase())));
 const lowest=filtered.length?Math.min(...filtered.map(r=>Number(r.adjusted_rate??r.quoted_rate))):null;
 const money=(v:number)=>"₹"+Number(v||0).toLocaleString("en-IN",{maximumFractionDigits:2});
 return <section className="space-y-5">
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5"><div className="text-xs font-semibold tracking-[.16em] text-amber-700">RATE INTELLIGENCE</div><h2 className="mt-1 text-xl font-semibold text-slate-900">Price Analyser</h2><p className="mt-1 text-sm text-slate-500">Compare saved vendor quotations and identify the lowest adjusted rate.</p></div>
   <div className="grid gap-4 md:grid-cols-3 md:items-end">
    <label className="text-sm font-medium text-slate-700">Project<select value={projectId} onChange={e=>setProjectId(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"><option value="">All projects</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <label className="text-sm font-medium text-slate-700">Item<input list="price-analyser-items" value={itemName} onChange={e=>setItemName(e.target.value)} autoComplete="off" placeholder="All items — start typing to search" className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"/><datalist id="price-analyser-items">{items.map(i=><option key={i.id} value={i.name}>{i.item_code??""}</option>)}</datalist></label>
    <button onClick={search} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#075b83] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{loading?<LoaderCircle className="animate-spin" size={17}/>:<Search size={17}/>} Analyse quotations</button>
   </div>
   {error&&<p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
  </div>
  {searched&&<div className="space-y-4">
   <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-slate-200 bg-white p-5"><div className="text-xs text-slate-500">Matching quotations</div><div className="mt-1 text-2xl font-semibold">{filtered.length}</div></div><div className="rounded-xl border border-slate-200 bg-white p-5"><div className="text-xs text-slate-500">Lowest adjusted rate</div><div className="mt-1 text-2xl font-semibold text-emerald-700">{lowest===null?"—":money(lowest)}</div></div></div>
   <div className="rounded-xl border border-slate-200 bg-white p-5"><label className="block text-sm font-medium text-slate-700">Filter results<input value={term} onChange={e=>setTerm(e.target.value)} placeholder="Search vendor, make or description" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"/></label>
    <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-3 py-3">Date</th><th className="px-3 py-3">Project / Item</th><th className="px-3 py-3">Vendor</th><th className="px-3 py-3">Make / Description</th><th className="px-3 py-3 text-right">Quoted</th><th className="px-3 py-3 text-right">Adjusted</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(r=><tr key={r.id}><td className="whitespace-nowrap px-3 py-3">{new Date(r.quotation_date).toLocaleDateString("en-IN")}</td><td className="px-3 py-3"><div>{r.projects?.name??"—"}</div><div className="text-xs text-slate-500">{r.items?.name??"—"}</div></td><td className="px-3 py-3 font-medium">{r.vendors?.name??"—"}</td><td className="px-3 py-3"><div>{r.make??"—"}</div><div className="text-xs text-slate-500">{r.description??""}</div></td><td className="px-3 py-3 text-right">{money(r.quoted_rate)}</td><td className="px-3 py-3 text-right font-semibold">{money(Number(r.adjusted_rate??r.quoted_rate))}</td></tr>)}</tbody></table>{!filtered.length&&<p className="py-8 text-center text-sm text-slate-500">No quotation records match these filters.</p>}</div>
   </div>
  </div>}
 </section>;
}
