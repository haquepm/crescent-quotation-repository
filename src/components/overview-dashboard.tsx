"use client";
import {useEffect,useMemo,useState} from "react";
import {ClipboardList,Store,Package,RefreshCw} from "lucide-react";
import {createClient} from "@/lib/supabase/client";
export default function OverviewDashboard(){
 const db=useMemo(()=>createClient(),[]);
 const [counts,setCounts]=useState({quotations:0,vendors:0,items:0});
 const [loading,setLoading]=useState(true); const [error,setError]=useState("");
 async function load(){setLoading(true);setError("");const [q,v,i]=await Promise.all([
  db.from("quotations").select("id",{count:"exact",head:true}),
  db.from("vendors").select("id",{count:"exact",head:true}).eq("is_active",true),
  db.from("items").select("id",{count:"exact",head:true}).eq("is_active",true)
 ]);if(q.error||v.error||i.error)setError(q.error?.message||v.error?.message||i.error?.message||"Unable to load overview.");else setCounts({quotations:q.count??0,vendors:v.count??0,items:i.count??0});setLoading(false);}
 useEffect(()=>{void load()},[]);
 const cards=[{label:"Total Quotations Stored",value:counts.quotations,icon:ClipboardList},{label:"Total Vendors",value:counts.vendors,icon:Store},{label:"Total Items",value:counts.items,icon:Package}];
 return <section><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-semibold tracking-[.16em] text-amber-500">REPOSITORY OVERVIEW</p><h2 className="mt-1 text-xl font-semibold text-white">At a glance</h2></div><button onClick={()=>void load()} className="rounded-lg border border-sky-900 bg-[#0b2637] p-2 text-sky-200 hover:bg-[#12384e]" title="Refresh counts"><RefreshCw size={16}/></button></div>
 <div className="grid gap-4 md:grid-cols-3">{cards.map(c=><div key={c.label} className="rounded-2xl border border-sky-900/80 bg-gradient-to-br from-[#102f43] to-[#091d2b] p-6 shadow-lg"><div className="flex items-center justify-between"><span className="text-sm text-sky-100/75">{c.label}</span><span className="rounded-xl bg-[#006EB6]/20 p-3 text-sky-300"><c.icon size={21}/></span></div><div className="mt-5 text-4xl font-semibold tracking-tight text-white">{loading?"—":c.value.toLocaleString("en-IN")}</div><div className="mt-2 text-xs text-sky-100/45">Live database count</div></div>)}</div>
 {error&&<p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-200">{error}</p>}</section>;
}
