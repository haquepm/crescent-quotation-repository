"use client";

import { useState } from "react";
import { Pencil, Trash2, X, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type EditableQuotation = {
 id:string; quotation_date:string; quoted_rate:number; unit:string|null;
 labour:number|null; transport:number|null; gst_percent:number|null;
 labour_included?:boolean; transport_included?:boolean; gst_included?:boolean;
 make:string|null; description:string|null; quotation_file_path:string|null;
};

export default function AdminQuotationActions({quote,onChanged}:{quote:EditableQuotation;onChanged:()=>void}) {
 const db=createClient();
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [date,setDate]=useState(quote.quotation_date),[rate,setRate]=useState(String(quote.quoted_rate??"")),[unit,setUnit]=useState(quote.unit??"");
 const [labour,setLabour]=useState(String(quote.labour??0)),[transport,setTransport]=useState(String(quote.transport??0)),[gst,setGst]=useState(quote.gst_percent==null?"":String(quote.gst_percent));
 const [make,setMake]=useState(quote.make??""),[description,setDescription]=useState(quote.description??"");
 const [labourIncluded,setLabourIncluded]=useState(!!quote.labour_included),[transportIncluded,setTransportIncluded]=useState(!!quote.transport_included),[gstIncluded,setGstIncluded]=useState(!!quote.gst_included);
 async function save(){
  const n=Number(rate);if(!date||!Number.isFinite(n)||n<0){setError("Enter a valid quotation date and quoted rate.");return;}
  setBusy(true);setError("");
  const {error}=await db.from("quotations").update({quotation_date:date,quoted_rate:n,unit:unit.trim()||null,labour:Number(labour||0),transport:Number(transport||0),gst_percent:gst===""?null:Number(gst),make:make.trim()||null,description:description.trim()||null,labour_included:labourIncluded,transport_included:transportIncluded,gst_included:gstIncluded}).eq("id",quote.id);
  setBusy(false);if(error){setError(error.message);return;}setOpen(false);onChanged();
 }
 async function remove(){
  if(!window.confirm("Delete this quotation permanently? This cannot be undone."))return;
  setBusy(true);setError("");
  const {data:attachments,error:attachmentError}=await db.from("quotation_attachments").select("file_path").eq("quotation_id",quote.id);
  if(attachmentError){setError(attachmentError.message);setBusy(false);return;}
  const paths=[...new Set([quote.quotation_file_path,...(attachments??[]).map(a=>a.file_path)].filter((p):p is string=>!!p))];
  if(paths.length){const {error:storageError}=await db.storage.from("quotation-files").remove(paths);if(storageError){setError("Could not remove quotation files: "+storageError.message);setBusy(false);return;}}
  const {error}=await db.from("quotations").delete().eq("id",quote.id);
  setBusy(false);if(error){setError(error.message);return;}onChanged();
 }
 return <div className="flex items-center gap-2">
  <button type="button" title="Edit quotation" onClick={()=>{setError("");setOpen(true)}} className="rounded-md border border-sky-700/50 px-2.5 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50"><Pencil size={14}/></button>
  <button type="button" title="Delete quotation" disabled={busy} onClick={()=>void remove()} className="rounded-md border border-red-300 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 size={14}/></button>
  {open&&<div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#24516b] bg-[#0b2232] p-6 text-slate-100 shadow-2xl">
   <div className="mb-5 flex items-center justify-between"><div><h3 className="text-lg font-semibold">Edit quotation</h3><p className="text-xs text-slate-400">Correct the saved quotation details.</p></div><button type="button" onClick={()=>setOpen(false)} className="rounded-lg p-2 hover:bg-white/10"><X size={18}/></button></div>
   <div className="grid gap-4 sm:grid-cols-2">
    <label className="text-sm">Quotation date<input type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#31566d] bg-[#101827] px-3 py-2.5"/></label>
    <label className="text-sm">Quoted rate (₹)<input type="number" min="0" step="0.01" value={rate} onChange={e=>setRate(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#31566d] bg-[#101827] px-3 py-2.5"/></label>
    <label className="text-sm">Unit<input value={unit} onChange={e=>setUnit(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#31566d] bg-[#101827] px-3 py-2.5"/></label>
    <label className="text-sm">Make / Brand<input value={make} onChange={e=>setMake(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#31566d] bg-[#101827] px-3 py-2.5"/></label>
    <label className="text-sm">Labour amount (₹)<input type="number" min="0" step="0.01" value={labour} onChange={e=>setLabour(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#31566d] bg-[#101827] px-3 py-2.5"/></label>
    <label className="text-sm">Transport amount (₹)<input type="number" min="0" step="0.01" value={transport} onChange={e=>setTransport(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#31566d] bg-[#101827] px-3 py-2.5"/></label>
    <label className="text-sm">GST (%)<input type="number" min="0" step="0.01" value={gst} onChange={e=>setGst(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#31566d] bg-[#101827] px-3 py-2.5"/></label>
    <label className="text-sm sm:col-span-2">Description / Specifications<textarea rows={3} value={description} onChange={e=>setDescription(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#31566d] bg-[#101827] px-3 py-2.5"/></label>
   </div>
   <div className="mt-4 flex flex-wrap gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={labourIncluded} onChange={e=>setLabourIncluded(e.target.checked)}/> Labour included</label><label className="flex items-center gap-2"><input type="checkbox" checked={transportIncluded} onChange={e=>setTransportIncluded(e.target.checked)}/> Transport included</label><label className="flex items-center gap-2"><input type="checkbox" checked={gstIncluded} onChange={e=>setGstIncluded(e.target.checked)}/> GST included</label></div>
   {error&&<p className="mt-4 rounded-lg bg-red-950/60 p-3 text-sm text-red-200">{error}</p>}
   <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={()=>setOpen(false)} className="rounded-lg border border-slate-500 px-4 py-2 text-sm">Cancel</button><button type="button" disabled={busy} onClick={()=>void save()} className="inline-flex items-center gap-2 rounded-lg bg-[#0878a8] px-5 py-2 text-sm font-semibold disabled:opacity-50">{busy&&<LoaderCircle className="animate-spin" size={15}/>}Save changes</button></div>
  </div></div>}
 </div>;
}
