"use client";

import {useCallback,useEffect,useMemo,useState} from "react";
import {CheckCircle2,FileText,LoaderCircle,Plus,RefreshCw,Save,Search,UploadCloud,X} from "lucide-react";
import {createClient} from "@/lib/supabase/client";

type RequestRow={id:string;project_id:string;item_id:string;request_number:number;created_at:string;description:string|null;make:string|null;purpose:string|null;boq_file_path:string|null;status:string;projects:{name:string}|null;items:{name:string;item_code:string|null;unit:string|null}|null;profiles:{full_name:string|null;email:string|null}|null};
type Vendor={id:string;name:string;contact_person:string|null;email:string|null;phone:string|null;gst_number:string|null};

export default function FulfilRequests({userId}:{userId:string}){
 const supabase=useMemo(()=>createClient(),[]);
 const [requests,setRequests]=useState<RequestRow[]>([]);
 const [vendors,setVendors]=useState<Vendor[]>([]);
 const [selected,setSelected]=useState<RequestRow|null>(null);
 const [vendorText,setVendorText]=useState("");
 const [vendorId,setVendorId]=useState("");
 const [showVendorList,setShowVendorList]=useState(false);
 const [addingVendor,setAddingVendor]=useState(false);
 const [newVendor,setNewVendor]=useState({contact_person:"",email:"",phone:"",gst_number:""});
 const [date,setDate]=useState(new Date().toISOString().slice(0,10));
 const [rate,setRate]=useState("");
 const [adjustedRate,setAdjustedRate]=useState("");
 const [make,setMake]=useState("");
 const [description,setDescription]=useState("");
 const [labour,setLabour]=useState("0");
 const [transport,setTransport]=useState("0");
 const [gst,setGst]=useState("");
 const [inclLabour,setInclLabour]=useState(false);
 const [inclTransport,setInclTransport]=useState(false);
 const [inclGst,setInclGst]=useState(false);
 const [file,setFile]=useState<File|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");

 const load=useCallback(async()=>{
  setError("");
  const [rq,vn]=await Promise.all([
   supabase.from("quotation_requests").select("id,project_id,item_id,request_number,created_at,description,make,purpose,boq_file_path,status,projects(name),items(name,item_code,unit),profiles!quotation_requests_estimator_id_fkey(full_name,email)").in("status",["pending","in_progress"]).order("created_at",{ascending:true}),
   supabase.from("vendors").select("id,name,contact_person,email,phone,gst_number").eq("is_active",true).order("name")
  ]);
  if(rq.error)setError(rq.error.message);else setRequests((rq.data??[]) as unknown as RequestRow[]);
  if(vn.error)setError(vn.error.message);else setVendors((vn.data??[]) as Vendor[]);
 },[supabase]);
 useEffect(()=>{void load()},[load]);
 const matches=vendors.filter(v=>v.name.toLowerCase().includes(vendorText.toLowerCase())).slice(0,8);
 function chooseRequest(r:RequestRow){setSelected(r);setVendorText("");setVendorId("");setDate(new Date().toISOString().slice(0,10));setRate("");setAdjustedRate("");setMake(r.make??"");setDescription(r.description??"");setLabour("0");setTransport("0");setGst("");setInclLabour(false);setInclTransport(false);setInclGst(false);setFile(null);setAddingVendor(false);setError("");setSuccess("");}
 async function createVendor(){
  const name=vendorText.trim();if(!name){setError("Enter a vendor name.");return;}
  setLoading(true);setError("");
  const {data,error}=await supabase.from("vendors").insert({name,...newVendor}).select("id,name,contact_person,email,phone,gst_number").single();
  if(error){
   if(error.code==="23505"){const {data:existing}=await supabase.from("vendors").select("id,name,contact_person,email,phone,gst_number").ilike("name",name).maybeSingle();if(existing){setVendors(v=>[...v.filter(x=>x.id!==existing.id),existing as Vendor]);setVendorId(existing.id);setVendorText(existing.name);setAddingVendor(false);setLoading(false);return;}}
   setError(error.message);setLoading(false);return;
  }
  setVendors(v=>[...v,data as Vendor].sort((a,b)=>a.name.localeCompare(b.name)));setVendorId(data.id);setVendorText(data.name);setAddingVendor(false);setNewVendor({contact_person:"",email:"",phone:"",gst_number:""});setLoading(false);
 }
 async function openFile(path:string){const {data,error}=await supabase.storage.from("quotation-files").createSignedUrl(path,60);if(error){setError(error.message);return;}if(data?.signedUrl)window.open(data.signedUrl,"_blank","noopener,noreferrer");}
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setError("");setSuccess("");
  if(!selected||!vendorId){setError("Select a vendor from the suggestions or add a new vendor.");return;}
  const n=Number(rate);if(!Number.isFinite(n)||n<0){setError("Enter a valid quoted rate.");return;}
  if(file&&file.size>20*1024*1024){setError("Quotation file must be 20 MB or smaller.");return;}
  setLoading(true);
  try{
   let path:string|null=null;
   if(file){path=userId+"/"+crypto.randomUUID()+"-"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_");const {error:up}=await supabase.storage.from("quotation-files").upload(path,file,{contentType:file.type||"application/octet-stream",upsert:false});if(up)throw up;}
   const {data:quote,error:quoteError}=await supabase.from("quotations").insert({
    request_id:selected.id,project_id:selected.project_id,item_id:selected.item_id,
    vendor_id:vendorId,quotation_date:date,quoted_rate:n,adjusted_rate:adjustedRate===""?null:Number(adjustedRate),
    labour:Number(labour||0),transport:Number(transport||0),gst_percent:gst===""?null:Number(gst),labour_included:inclLabour,transport_included:inclTransport,gst_included:inclGst,
    description:description.trim()||null,make:make.trim()||null,quotation_file_path:path,created_by:userId
   }).select("id").single();
   if(quoteError)throw quoteError;
   if(path&&file){const {error:metaError}=await supabase.from("quotation_attachments").insert({quotation_id:quote.id,request_id:selected.id,file_path:path,file_name:file.name,content_type:file.type||null,uploaded_by:userId});if(metaError)throw metaError;}
   const {error:statusError}=await supabase.from("quotation_requests").update({status:"completed",completed_at:new Date().toISOString()}).eq("id",selected.id);
   if(statusError)throw statusError;
   setSuccess("Quotation saved and request marked as completed.");setSelected(null);await load();
  }catch(err){setError(err instanceof Error?err.message:"Unable to save quotation.");}
  finally{setLoading(false);}
 }
 return <div className="grid gap-5 xl:grid-cols-[minmax(300px,.8fr)_minmax(0,1.2fr)]">
  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
   <div className="flex items-center justify-between"><div><p className="text-xs font-semibold tracking-[.16em] text-amber-700">PURCHASE WORK QUEUE</p><h2 className="mt-1 text-lg font-semibold">Pending Requests</h2></div><button onClick={()=>void load()} className="rounded-lg border border-slate-200 p-2 text-slate-600" title="Refresh"><RefreshCw size={16}/></button></div>
   <p className="mt-1 text-xs text-slate-500">{requests.length} request(s) awaiting quotation</p>
   <div className="mt-4 space-y-2">{requests.map(r=><button key={r.id} onClick={()=>chooseRequest(r)} className={`w-full rounded-lg border p-4 text-left transition ${selected?.id===r.id?"border-sky-500 bg-sky-50":"border-slate-200 hover:border-slate-300"}`}><div className="flex items-center justify-between gap-2"><span className="font-semibold text-slate-800">Request #{r.request_number}</span><span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase text-amber-700">{r.status.replace("_"," ")}</span></div><div className="mt-2 text-sm font-medium text-slate-700">{r.items?.name??"Item"}</div><div className="mt-1 text-xs text-slate-500">{r.projects?.name??"Project"} · {r.profiles?.full_name||r.profiles?.email||"Estimator"}</div><div className="mt-2 line-clamp-2 text-xs text-slate-500">{r.description||r.purpose||"No additional description"}</div></button>)}{!requests.length&&<div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No pending requests.</div>}</div>
  </section>
  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
   <p className="text-xs font-semibold tracking-[.16em] text-amber-700">QUOTATION ENTRY</p><h2 className="mt-1 text-lg font-semibold">Fulfil Request</h2>
   {!selected?<div className="mt-5 rounded-lg border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">Select a pending request to enter its quotation.</div>:<>
    <div className="mt-4 rounded-lg bg-slate-50 p-4"><div className="font-semibold text-slate-800">#{selected.request_number} · {selected.items?.name}</div><div className="mt-1 text-xs text-slate-500">{selected.projects?.name} · {selected.purpose||"No purpose specified"}</div><div className="mt-2 text-sm text-slate-600">{selected.description||"No specifications provided."}</div>{selected.boq_file_path&&<button onClick={()=>void openFile(selected.boq_file_path!)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky-700"><FileText size={14}/> View BOQ</button>}</div>
    <form onSubmit={submit} className="mt-5 space-y-4">
     <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Quotation date<input required type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"/></label><label className="text-sm font-medium text-slate-700">Make / Brand<input value={make} onChange={e=>setMake(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"/></label></div>
     <div className="relative"><label className="text-sm font-medium text-slate-700">Vendor name *</label><input required value={vendorText} onFocus={()=>setShowVendorList(true)} onChange={e=>{setVendorText(e.target.value);setVendorId("");setShowVendorList(true);setAddingVendor(false)}} placeholder="Start typing vendor name..." className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"/>{vendorId&&<span className="mt-1 block text-xs text-emerald-700">Existing vendor selected</span>}{showVendorList&&vendorText.trim()&&<div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">{matches.map(v=><button type="button" key={v.id} onClick={()=>{setVendorId(v.id);setVendorText(v.name);setShowVendorList(false)}} className="block w-full px-3 py-2.5 text-left text-sm hover:bg-slate-50">{v.name}<span className="block text-xs text-slate-400">{v.contact_person||v.phone||""}</span></button>)}{!matches.some(v=>v.name.toLowerCase()===vendorText.trim().toLowerCase())&&<button type="button" onClick={()=>{setAddingVendor(true);setShowVendorList(false)}} className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-3 text-left text-sm font-semibold text-sky-700"><Plus size={15}/> Add “{vendorText.trim()}” as a new vendor</button>}</div>}</div>
     {addingVendor&&<div className="rounded-lg border border-sky-200 bg-sky-50 p-4"><div className="mb-3 flex items-center justify-between"><span className="text-sm font-semibold">New vendor: {vendorText}</span><button type="button" onClick={()=>setAddingVendor(false)}><X size={16}/></button></div><div className="grid gap-2 sm:grid-cols-2">{(["contact_person","email","phone","gst_number"] as const).map(k=><input key={k} value={newVendor[k]} onChange={e=>setNewVendor(v=>({...v,[k]:e.target.value}))} placeholder={k.replace("_"," ").replace(/^./,s=>s.toUpperCase())} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"/>)}</div><button type="button" disabled={loading} onClick={()=>void createVendor()} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#075b83] px-4 py-2 text-sm font-semibold text-white"><Plus size={15}/> Save and select vendor</button></div>}
     <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Quoted rate (₹) *<input required type="number" min="0" step="0.01" value={rate} onChange={e=>setRate(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"/></label><label className="text-sm font-medium text-slate-700">Adjusted rate (₹)<input type="number" min="0" step="0.01" value={adjustedRate} onChange={e=>setAdjustedRate(e.target.value)} placeholder="Optional" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"/></label><label className="text-sm font-medium text-slate-700">Labour amount (₹)<input type="number" min="0" step="0.01" value={labour} onChange={e=>setLabour(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"/></label><label className="text-sm font-medium text-slate-700">Transport amount (₹)<input type="number" min="0" step="0.01" value={transport} onChange={e=>setTransport(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"/></label><label className="text-sm font-medium text-slate-700">GST (%)<input type="number" min="0" step="0.01" value={gst} onChange={e=>setGst(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"/></label></div>
     <div className="rounded-lg border border-slate-200 p-3"><p className="mb-2 text-xs font-semibold uppercase text-slate-500">Included in quoted rate</p><div className="flex flex-wrap gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={inclLabour} onChange={e=>setInclLabour(e.target.checked)}/> Labour</label><label className="flex items-center gap-2"><input type="checkbox" checked={inclTransport} onChange={e=>setInclTransport(e.target.checked)}/> Transportation</label><label className="flex items-center gap-2"><input type="checkbox" checked={inclGst} onChange={e=>setInclGst(e.target.checked)}/> GST</label></div><p className="mt-2 text-xs text-slate-500">These inclusion flags are retained in the form for workflow clarity; the legacy adjusted rate remains manually entered.</p></div>
     <label className="block text-sm font-medium text-slate-700">Quotation description / remarks<textarea rows={2} value={description} onChange={e=>setDescription(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"/></label>
     <label className="block text-sm font-medium text-slate-700">Attach quotation<input type="file" accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx" onChange={e=>setFile(e.target.files?.[0]??null)} className="mt-1.5 block w-full rounded-lg border border-slate-300 p-2 text-sm"/><span className="mt-1 block text-xs text-slate-400">Maximum 20 MB</span></label>
     {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
     {success&&<p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}
     <div className="flex justify-end"><button disabled={loading||!vendorId} className="inline-flex items-center gap-2 rounded-lg bg-[#075b83] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{loading?<LoaderCircle className="animate-spin" size={17}/>:<Save size={17}/>} Save quotation & complete request</button></div>
    </form>
   </>}
   {error&&!selected&&<p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
  </section>
 </div>;
}
