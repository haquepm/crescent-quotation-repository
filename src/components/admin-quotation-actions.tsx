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
type QuoteAttachment={id:string;file_path:string;file_name:string;content_type:string|null;created_at?:string};

export default function AdminQuotationActions({quote,onChanged}:{quote:EditableQuotation;onChanged:()=>void}) {
 const db=createClient();
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [attachments,setAttachments]=useState<QuoteAttachment[]>([]),[attachmentsLoading,setAttachmentsLoading]=useState(false),[newQuoteFile,setNewQuoteFile]=useState<File|null>(null),[newAdditionalFiles,setNewAdditionalFiles]=useState<File[]>([]);
 const [date,setDate]=useState(quote.quotation_date),[rate,setRate]=useState(String(quote.quoted_rate??"")),[unit,setUnit]=useState(quote.unit??"");
 const [labour,setLabour]=useState(String(quote.labour??0)),[transport,setTransport]=useState(String(quote.transport??0)),[gst,setGst]=useState(quote.gst_percent==null?"":String(quote.gst_percent));
 const [make,setMake]=useState(quote.make??""),[description,setDescription]=useState(quote.description??"");
 const [labourIncluded,setLabourIncluded]=useState(!!quote.labour_included),[transportIncluded,setTransportIncluded]=useState(!!quote.transport_included),[gstIncluded,setGstIncluded]=useState(!!quote.gst_included);
 async function loadAttachments(){
  setAttachmentsLoading(true);setError("");
  const {data,error}=await db.from("quotation_attachments").select("id,file_path,file_name,content_type,created_at").eq("quotation_id",quote.id).order("created_at",{ascending:true});
  if(error)setError(error.message);else setAttachments((data??[]) as QuoteAttachment[]);
  setAttachmentsLoading(false);
 }
 async function uploadOne(file:File){
  const {data:{user}}=await db.auth.getUser();if(!user?.id)throw new Error("Your session has expired. Please sign in again.");
  const path=user.id+"/"+crypto.randomUUID()+"-"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
  const {error}=await db.storage.from("quotation-files").upload(path,file,{contentType:file.type||"application/octet-stream",upsert:false});if(error)throw error;return path;
 }
 async function addFiles(){
  if(!newQuoteFile&&!newAdditionalFiles.length)return;
  setBusy(true);setError("");
  try{
   const {data:{user}}=await db.auth.getUser();if(!user?.id)throw new Error("Your session has expired. Please sign in again.");
   const rows:Array<{quotation_id:string;request_id:null;file_path:string;file_name:string;content_type:string|null;uploaded_by:string}> = [];
   let replacementPath:string|null=null;
   if(newQuoteFile){if(newQuoteFile.size>20*1024*1024)throw new Error("Quotation file must be 20 MB or smaller.");replacementPath=await uploadOne(newQuoteFile);rows.push({quotation_id:quote.id,request_id:null,file_path:replacementPath,file_name:newQuoteFile.name,content_type:newQuoteFile.type||null,uploaded_by:user.id});}
   for(const file of newAdditionalFiles){if(file.size>20*1024*1024)throw new Error("Each additional document must be 20 MB or smaller.");const path=await uploadOne(file);rows.push({quotation_id:quote.id,request_id:null,file_path:path,file_name:file.name,content_type:file.type||null,uploaded_by:user.id});}
   if(rows.length){const {error}=await db.from("quotation_attachments").insert(rows);if(error)throw error;}
   if(replacementPath){const {error}=await db.from("quotations").update({quotation_file_path:replacementPath}).eq("id",quote.id);if(error)throw error;}
   setNewQuoteFile(null);setNewAdditionalFiles([]);await loadAttachments();onChanged();
  }catch(e){setError(e instanceof Error?e.message:"Unable to upload attachments.");}
  setBusy(false);
 }
 async function removeAttachment(a:QuoteAttachment){
  if(!window.confirm("Remove this attachment from the quotation?"))return;
  setBusy(true);setError("");
  const {error}=await db.from("quotation_attachments").delete().eq("id",a.id);
  if(error){setError(error.message);setBusy(false);return;}
  if(a.file_path===quote.quotation_file_path){const {error:updateError}=await db.from("quotations").update({quotation_file_path:null}).eq("id",quote.id);if(updateError){setError(updateError.message);setBusy(false);return;}}
  const {error:storageError}=await db.storage.from("quotation-files").remove([a.file_path]);
  if(storageError)setError("Attachment record removed, but storage cleanup failed: "+storageError.message);
  await loadAttachments();onChanged();setBusy(false);
 }
 async function openAttachment(path:string){const {data,error}=await db.storage.from("quotation-files").createSignedUrl(path,60);if(error){setError(error.message);return;}if(data?.signedUrl)window.open(data.signedUrl,"_blank","noopener,noreferrer");}
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
  <button type="button" title="Edit quotation" onClick={()=>{setError("");setOpen(true);void loadAttachments();}} className="rounded-md border border-sky-700/50 px-2.5 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50"><Pencil size={14}/></button>
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
   <div className="mt-5 rounded-xl border border-[#31566d] bg-[#081c29] p-4">
    <h4 className="font-semibold text-white">Quotation attachments</h4><p className="mt-1 text-xs text-slate-400">Replace the main quotation file, add supporting documents, or remove outdated attachments.</p>
    <label className="mt-4 block text-sm">Replace main quotation file (optional)<input type="file" accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx" onChange={e=>setNewQuoteFile(e.target.files?.[0]??null)} className="mt-1.5 block w-full text-sm text-slate-300"/><span className="text-xs text-slate-500">Maximum 20 MB per file.</span></label>
    <label className="mt-4 block text-sm">Add additional documents<input type="file" multiple onChange={e=>setNewAdditionalFiles(Array.from(e.target.files??[]))} className="mt-1.5 block w-full text-sm text-slate-300"/><span className="text-xs text-slate-500">No document-count limit; maximum 20 MB per file.</span></label>
    {newAdditionalFiles.length>0&&<p className="mt-2 text-xs text-sky-300">{newAdditionalFiles.length} new supporting document(s) selected</p>}
    <button type="button" disabled={busy||(!newQuoteFile&&!newAdditionalFiles.length)} onClick={()=>void addFiles()} className="mt-3 rounded-lg bg-[#0878a8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Upload selected files</button>
    <div className="mt-4 border-t border-[#31566d] pt-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Existing files</p>
     {attachmentsLoading?<p className="text-sm text-slate-400">Loading attachments…</p>:attachments.length===0?<p className="text-sm text-slate-400">No attachment records found.</p>:<div className="space-y-2">{attachments.map(a=><div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#102b3b] px-3 py-2"><button type="button" onClick={()=>void openAttachment(a.file_path)} className="min-w-0 truncate text-left text-sm text-sky-300 hover:underline">{a.file_name}{a.file_path===quote.quotation_file_path?<span className="ml-2 text-xs text-amber-300">Main quotation</span>:null}</button><button type="button" disabled={busy} onClick={()=>void removeAttachment(a)} className="rounded-md border border-red-400/40 px-2 py-1 text-xs text-red-300 hover:bg-red-950/40 disabled:opacity-50">Remove</button></div>)}</div>}
    </div>
   </div>
   <div className="mt-4 flex flex-wrap gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={labourIncluded} onChange={e=>setLabourIncluded(e.target.checked)}/> Labour included</label><label className="flex items-center gap-2"><input type="checkbox" checked={transportIncluded} onChange={e=>setTransportIncluded(e.target.checked)}/> Transport included</label><label className="flex items-center gap-2"><input type="checkbox" checked={gstIncluded} onChange={e=>setGstIncluded(e.target.checked)}/> GST included</label></div>
   {error&&<p className="mt-4 rounded-lg bg-red-950/60 p-3 text-sm text-red-200">{error}</p>}
   <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={()=>setOpen(false)} className="rounded-lg border border-slate-500 px-4 py-2 text-sm">Cancel</button><button type="button" disabled={busy} onClick={()=>void save()} className="inline-flex items-center gap-2 rounded-lg bg-[#0878a8] px-5 py-2 text-sm font-semibold disabled:opacity-50">{busy&&<LoaderCircle className="animate-spin" size={15}/>}Save changes</button></div>
  </div></div>}
 </div>;
}
