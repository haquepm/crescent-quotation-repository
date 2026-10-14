"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, RotateCcw, FileText, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Project = { id: string; name: string };
type Item = { id: string; name: string; item_code: string | null };
type Quote = {
  id: string; quotation_date: string; quoted_rate: number; unit: string | null;
  labour: number | null; transport: number | null; gst_percent: number | null;
  description: string | null; make: string | null; quotation_file_path: string | null;
  vendors?: { name: string } | null;
};

export default function ProjectQuotationSearch({allowAttachments=true}:{allowAttachments?:boolean}) {
  const supabase = useMemo(() => createClient(), []);
  const [projects,setProjects] = useState<Project[]>([]);
  const [items,setItems] = useState<Item[]>([]);
  const [projectId,setProjectId] = useState("");
  const [itemName,setItemName] = useState("");
  const [itemMenuOpen,setItemMenuOpen] = useState(false);
  const matchingItems = items.filter(i=>!itemName.trim()||i.name.toLowerCase().includes(itemName.trim().toLowerCase())||(i.item_code??"").toLowerCase().includes(itemName.trim().toLowerCase())).slice(0,8);
  const [results,setResults] = useState<Quote[]>([]);
  const [loadingProjects,setLoadingProjects] = useState(true);
  const [loadingItems,setLoadingItems] = useState(false);
  const [searching,setSearching] = useState(false);
  const [searched,setSearched] = useState(false);
  const [error,setError] = useState("");
  const [vendorFilter,setVendorFilter] = useState("all");
  const [makeFilter,setMakeFilter] = useState("all");
  const [dateSort,setDateSort] = useState("latest");

  const vendorOptions = [...new Set(results.map(q=>q.vendors?.name?.trim()).filter((v): v is string => Boolean(v)))].sort((a,b)=>a.localeCompare(b));
  const makeOptions = [...new Set(results.map(q=>q.make?.trim()).filter((v): v is string => Boolean(v)))].sort((a,b)=>a.localeCompare(b));
  const filteredResults = results.filter(q =>
    (vendorFilter === "all" || q.vendors?.name === vendorFilter) &&
    (makeFilter === "all" || q.make === makeFilter)
  ).sort((a,b) => {
    const dateA = a.quotation_date ? new Date(a.quotation_date).getTime() : 0;
    const dateB = b.quotation_date ? new Date(b.quotation_date).getTime() : 0;
    return dateSort === "latest" ? dateB-dateA : dateA-dateB;
  });

  useEffect(() => {
    let live = true;
    async function load() {
      setLoadingProjects(true); setError("");
      const { data, error } = await supabase.from("projects").select("id,name").order("name");
      if (!live) return;
      if (error) setError(error.message); else setProjects((data ?? []) as Project[]);
      setLoadingProjects(false);
    }
    void load();
    return () => { live = false; };
  },[supabase]);

  useEffect(() => {
    let live = true;
    async function loadItems() {
      setItems([]); setItemName(""); setResults([]); setSearched(false); setVendorFilter("all"); setMakeFilter("all"); setDateSort("latest");
      if (!projectId) return;
      setLoadingItems(true); setError("");
      const { data, error } = await supabase.from("quotations").select("item_id,items(id,name,item_code)").eq("project_id",projectId);
      if (!live) return;
      if (error) { setError(error.message); setLoadingItems(false); return; }
      const unique = new Map<string,Item>();
      for (const row of data ?? []) {
        const item = row.items as unknown as Item | null;
        if (item?.id) unique.set(item.id,item);
      }
      setItems([...unique.values()].sort((a,b)=>a.name.localeCompare(b.name)));
      setLoadingItems(false);
    }
    void loadItems();
    return () => { live = false; };
  },[projectId,supabase]);

  async function search() {
    const chosen=items.find(i=>i.name.toLocaleLowerCase()===itemName.trim().toLocaleLowerCase());
    if (!projectId || !chosen) { setError("Please select an item from the suggestions."); return; }
    setSearching(true); setError(""); setSearched(false); setResults([]); setVendorFilter("all"); setMakeFilter("all"); setDateSort("latest");
    const { data, error } = await supabase.from("quotations")
      .select("id,quotation_date,quoted_rate,unit,labour,transport,gst_percent,description,make,quotation_file_path,vendors(name)")
      .eq("project_id",projectId).eq("item_id",chosen.id).order("quotation_date",{ascending:false});
    if (error) setError(error.message);
    else setResults((data ?? []) as unknown as Quote[]);
    setSearched(true); setSearching(false);
  }

  async function openAttachment(path: string | null) {
    if (!path) return;
    const { data,error } = await supabase.storage.from("quotation-files").createSignedUrl(path,60);
    if (error) { setError(error.message); return; }
    if (data?.signedUrl) window.open(data.signedUrl,"_blank","noopener,noreferrer");
  }

  return <section className="space-y-5">
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5"><div className="text-xs font-semibold tracking-[.16em] text-amber-700">PROJECT-WISE LOOKUP</div><h2 className="mt-1 text-xl font-semibold text-slate-900">Find Previous Quotations</h2><p className="mt-1 text-sm text-slate-500">Select a project, choose an item used in that project, then search its quotation history.</p></div>
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="block text-sm font-medium text-slate-700">Project
          <select value={projectId} onChange={e=>setProjectId(e.target.value)} disabled={loadingProjects} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm">
            <option value="">{loadingProjects?"Loading projects…":"Select project"}</option>
            {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <div className="relative">
          <label className="block text-sm font-medium text-slate-700">Item
            <input value={itemName} onChange={e=>{setItemName(e.target.value);setItemMenuOpen(true);}} onFocus={()=>setItemMenuOpen(true)} onBlur={()=>window.setTimeout(()=>setItemMenuOpen(false),150)} disabled={!projectId||loadingItems} autoComplete="off" placeholder={!projectId?"Select a project first":loadingItems?"Loading project items…":"Start typing an item name"} className="mt-2 w-full rounded-lg border border-[#2b5268] bg-[#0c2638] px-3 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-[#1687bd] focus:outline-none focus:ring-2 focus:ring-[#1687bd]/30 disabled:opacity-50"/>
          </label>
          {itemMenuOpen&&projectId&&!loadingItems&&<div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-[#27617d] !bg-[#0b2232] p-1 text-slate-100 shadow-2xl">
            {matchingItems.map(i=><button type="button" key={i.id} onMouseDown={e=>e.preventDefault()} onClick={()=>{setItemName(i.name);setItemMenuOpen(false);}} className="block w-full rounded-md px-3 py-2 text-left text-sm !text-slate-100 hover:!bg-[#164763] hover:!text-white"><span className="block font-medium">{i.name}</span>{i.item_code&&<span className="block text-xs !text-slate-400">{i.item_code}</span>}</button>)}
            {!matchingItems.length&&<p className="px-3 py-2 text-sm text-slate-400">No matching items for this project</p>}
          </div>}
        </div>
        <button onClick={search} disabled={!projectId||!itemName.trim()||searching} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#075b83] px-6 py-3 text-sm font-semibold text-white hover:bg-[#064866] disabled:cursor-not-allowed disabled:opacity-50">
          {searching?<LoaderCircle className="animate-spin" size={17}/>:<Search size={17}/>} Search
        </button>
      </div>
      {error&&<p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </div>
    {searched&&<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-5"><div><h3 className="font-semibold text-slate-800">Quotation history</h3><p className="mt-1 text-xs text-slate-500">{filteredResults.length} of {results.length} quotation record{results.length===1?"":"s"} shown</p></div><button onClick={()=>{setItemName("");setResults([]);setSearched(false);setVendorFilter("all");setMakeFilter("all");setDateSort("latest")}} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"><RotateCcw size={14}/> Reset item</button></div>
      {!results.length?<div className="p-10 text-center text-sm text-slate-500">No quotations were found for this project and item.</div>:
      <>
      <div className="grid gap-3 border-b border-slate-100 bg-slate-50 p-5 md:grid-cols-3">
        <label className="block text-xs font-semibold text-slate-600">Filter by Vendor
          <select value={vendorFilter} onChange={e=>setVendorFilter(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-800"><option value="all">All vendors</option>{vendorOptions.map(v=><option key={v} value={v}>{v}</option>)}</select>
        </label>
        <label className="block text-xs font-semibold text-slate-600">Filter by Make / Brand
          <select value={makeFilter} onChange={e=>setMakeFilter(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-800"><option value="all">All makes / brands</option>{makeOptions.map(m=><option key={m} value={m}>{m}</option>)}</select>
        </label>
        <label className="block text-xs font-semibold text-slate-600">Sort by Quotation Date
          <select value={dateSort} onChange={e=>setDateSort(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-800"><option value="latest">Latest first</option><option value="oldest">Oldest first</option></select>
        </label>
      </div>
      {!filteredResults.length?<div className="p-10 text-center text-sm text-slate-500">No quotations match the selected filters. Try changing or clearing the filters.</div>:
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Vendor</th><th className="px-4 py-3">Make / Description</th><th className="px-4 py-3 text-right">Quoted rate</th><th className="px-4 py-3">Unit</th><th className="px-4 py-3 text-right">Labour</th><th className="px-4 py-3 text-right">Transport</th><th className="px-4 py-3 text-right">GST</th>{allowAttachments&&<th className="px-4 py-3">Attachment</th>}</tr></thead><tbody className="divide-y divide-slate-100">{filteredResults.map(q=><tr key={q.id} className="hover:bg-slate-50/70"><td className="whitespace-nowrap px-4 py-3">{q.quotation_date?new Date(q.quotation_date).toLocaleDateString("en-IN"):"—"}</td><td className="px-4 py-3 font-medium">{q.vendors?.name??"—"}</td><td className="max-w-[240px] px-4 py-3"><div className="font-medium">{q.make||"—"}</div><div className="text-xs text-slate-500">{q.description||"—"}</div></td><td className="px-4 py-3 text-right tabular-nums">₹{Number(q.quoted_rate||0).toLocaleString("en-IN",{maximumFractionDigits:2})}</td><td className="px-4 py-3">{q.unit??"—"}</td><td className="px-4 py-3 text-right tabular-nums">{q.labour??"—"}</td><td className="px-4 py-3 text-right tabular-nums">{q.transport??"—"}</td><td className="px-4 py-3 text-right tabular-nums">{q.gst_percent==null?"—":String(q.gst_percent)+"%"}</td>{allowAttachments&&<td className="px-4 py-3">{q.quotation_file_path?<button onClick={()=>void openAttachment(q.quotation_file_path)} className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline"><FileText size={14}/> View file</button>:"—"}</td>}</tr>)}</tbody></table></div>}
      </>}
    </div>}
  </section>;
}