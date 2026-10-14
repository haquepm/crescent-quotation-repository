"use client";

import { useEffect, useMemo, useState } from "react";
import { UploadCloud, Send, LoaderCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Project={id:string;name:string};
type Item={id:string;name:string;item_code:string|null;unit:string|null};

export default function SubmitRequest({userId}:{userId:string}) {
 const supabase=useMemo(()=>createClient(),[]);
 const [projects,setProjects]=useState<Project[]>([]);
 const [items,setItems]=useState<Item[]>([]);
 const [projectId,setProjectId]=useState("");
 const [itemName,setItemName]=useState("");
 const [description,setDescription]=useState("");
 const [make,setMake]=useState("");
 const [purpose,setPurpose]=useState("");
 const [requiredByDate,setRequiredByDate]=useState("");
 const [file,setFile]=useState<File|null>(null);
 const [loading,setLoading]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");

 useEffect(()=>{let live=true;(async()=>{
  const {data,error}=await supabase.from("projects").select("id,name").eq("is_active",true).order("name");
  if(!live)return;if(error)setError(error.message);else setProjects((data??[]) as Project[]);
 })();return()=>{live=false}},[supabase]);

 useEffect(()=>{let live=true;(async()=>{
  setItems([]);setItemName("");if(!projectId)return;
  const {data,error}=await supabase.from("items").select("id,name,item_code,unit").eq("is_active",true).order("name");
  if(!live)return;if(error)setError(error.message);else setItems((data??[]) as Item[]);
 })();return()=>{live=false}},[projectId,supabase]);

 async function resolveItemId():Promise<string>{
  const cleanName=itemName.trim().replace(/\\s+/g," ");
  if(!cleanName)throw new Error("Please enter or select an item.");
  const existing=items.find(i=>i.name.trim().toLocaleLowerCase()===cleanName.toLocaleLowerCase());
  if(existing)return existing.id;
  const {data,error}=await supabase.from("items").insert({name:cleanName,is_active:true}).select("id,name,item_code,unit").single();
  if(!error&&data){setItems(current=>[...current,data as Item].sort((a,b)=>a.name.localeCompare(b.name)));return data.id;}
  if(error?.code==="23505"){
   const {data:matches,error:lookupError}=await supabase.from("items").select("id,name,item_code,unit").eq("is_active",true);
   if(!lookupError){const match=(matches??[] as Item[]).find((i:Item)=>i.name.trim().toLocaleLowerCase()===cleanName.toLocaleLowerCase());if(match)return match.id;}
  }
  throw error??new Error("Unable to create this item.");
 }

 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setError("");setMessage("");
  if(!projectId||!itemName.trim()){setError("Please select a project and enter an item.");return;}
  if(!requiredByDate){setError("Please select the date by which the quotation is required.");return;}
  if(file&&file.size>20*1024*1024){setError("The BOQ file must be 20 MB or smaller.");return;}
  setLoading(true);
  let uploadedPath:string|null=null;
  try{
   const resolvedItemId=await resolveItemId();
   if(file){
    const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    uploadedPath=userId+"/"+crypto.randomUUID()+"-"+safeName;
    const {error:uploadError}=await supabase.storage.from("quotation-files").upload(uploadedPath,file,{contentType:file.type||"application/octet-stream",upsert:false});
    if(uploadError)throw uploadError;
   }
   const {data,error:insertError}=await supabase.from("quotation_requests").insert({
    project_id:projectId,item_id:resolvedItemId,estimator_id:userId,
    description:description.trim()||null,make:make.trim()||null,
    purpose:purpose.trim()||null,boq_file_path:uploadedPath,required_by_date:requiredByDate
   }).select("request_number").single();
   if(insertError)throw insertError;
   setMessage("Request #"+data.request_number+" submitted successfully.");
   setProjectId("");setItemName("");setDescription("");setMake("");setPurpose("");setRequiredByDate("");setFile(null);
   const input=document.getElementById("boq-file") as HTMLInputElement|null;if(input)input.value="";
  }catch(err){
   if(uploadedPath)await supabase.storage.from("quotation-files").remove([uploadedPath]);
   setError(err instanceof Error?err.message:"Unable to submit request.");
  }finally{setLoading(false);}
 }

 const today=new Date().toLocaleDateString("en-CA");
 return <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
  <div className="mb-6"><div className="text-xs font-semibold tracking-[.16em] text-amber-700">PURCHASE REQUEST</div><h2 className="mt-1 text-xl font-semibold text-slate-900">Submit Quotation Request</h2><p className="mt-1 text-sm text-slate-500">Send an item quotation request to the Purchase Team. Attach the BOQ or supporting document if available.</p></div>
  <form onSubmit={submit} className="space-y-5">
   <div className="grid gap-4 md:grid-cols-2">
    <label className="block text-sm font-medium text-slate-700">Project <span className="text-red-500">*</span>
     <select required value={projectId} onChange={e=>setProjectId(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"><option value="">Select project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
    </label>
    <label className="block text-sm font-medium text-slate-700">Item <span className="text-red-500">*</span>
     <input required list="quotation-item-options" value={itemName} onChange={e=>setItemName(e.target.value)} disabled={!projectId} autoComplete="off" placeholder={projectId?"Start typing an existing item or enter a new item":"Select a project first"} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"/>
     <datalist id="quotation-item-options">{items.map(i=><option key={i.id} value={i.name}>{i.item_code?i.item_code+" · "+(i.unit??""):""}</option>)}</datalist>
     <span className="mt-1 block text-xs font-normal text-slate-500">Choose a suggested item or type a new name. New items are saved to the item list for future requests.</span>
    </label>
    <label className="block text-sm font-medium text-slate-700">Quotation Required By <span className="text-red-500">*</span>
     <input required type="date" min={today} value={requiredByDate} onChange={e=>setRequiredByDate(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"/>
     <span className="mt-1 block text-xs font-normal text-slate-500">Deadline by which the Purchase Team should fulfil this request.</span>
    </label>
    <label className="block text-sm font-medium text-slate-700">Make / Brand
     <input value={make} onChange={e=>setMake(e.target.value)} placeholder="Preferred make or brand" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"/>
    </label>
    <label className="block text-sm font-medium text-slate-700">Purpose
     <input value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="Purpose of this quotation" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"/>
    </label>
   </div>
   <label className="block text-sm font-medium text-slate-700">Description / Specifications
    <textarea rows={4} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Enter specifications, size, grade, quantity details or other requirements" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"/>
   </label>
   <label className="block text-sm font-medium text-slate-700">BOQ / Supporting Document
    <span className="mt-2 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 p-4 hover:border-sky-500"><UploadCloud className="text-slate-400"/><span className="min-w-0 flex-1"><span className="block text-sm text-slate-700">{file?file.name:"Choose a file to attach"}</span><span className="text-xs text-slate-400">PDF, JPG, PNG, XLS or XLSX · Maximum 20 MB</span></span><input id="boq-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx" className="hidden" onChange={e=>setFile(e.target.files?.[0]??null)}/></span>
   </label>
   {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
   {message&&<p className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"><CheckCircle2 size={17}/>{message}</p>}
   <div className="flex justify-end"><button disabled={loading||!projects.length} className="inline-flex items-center gap-2 rounded-lg bg-[#075b83] px-6 py-3 text-sm font-semibold text-white hover:bg-[#064866] disabled:opacity-50">{loading?<LoaderCircle className="animate-spin" size={17}/>:<Send size={17}/>} Submit Request</button></div>
  </form>
 </section>;
}
