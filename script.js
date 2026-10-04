const GA4_ID="G-1HY3WV9BKV",C=window.INFRALINK_CONFIG||{};
const year=new Date().getFullYear();
document.querySelectorAll("[data-year],#year").forEach(el=>{el.textContent=year});

const m=document.querySelector(".menu"),n=document.querySelector(".navlinks");
if(m&&n)m.addEventListener("click",()=>{const o=n.classList.toggle("open");m.setAttribute("aria-expanded",o)});

window.dataLayer=window.dataLayer||[];
window.gtag=window.gtag||function(){dataLayer.push(arguments)};
gtag("js",new Date());
gtag("config",GA4_ID);
const gs=document.createElement("script");
gs.async=1;
gs.src="https://www.googletagmanager.com/gtag/js?id="+GA4_ID;
document.head.appendChild(gs);

function setFormError(status,message){
  status.textContent=message;
  status.dataset.error="true";
}

async function readApiResponse(response){
  const raw=await response.text();
  let data=null;
  if(raw.trim()){
    try{data=JSON.parse(raw)}catch{data=null}
  }
  if(!response.ok){
    const message=data?.message||raw.replace(/<[^>]*>/g," ").replace(/\\s+/g," ").trim();
    throw new Error(message||`Unable to submit the form (HTTP ${response.status}).`);
  }
  if(data&&data.success===false)throw new Error(data.message||"Unable to submit the form.");
  return data;
}

document.querySelectorAll("form[data-lead-form]").forEach(f=>f.addEventListener("submit",async e=>{
  e.preventDefault();
  const s=f.querySelector(".form-status"),b=f.querySelector("button"),em=f.querySelector('[name="email"]'),w=f.querySelector('[name="company_website"]');
  if(!s||!b||!em)return;

  em.value=em.value.replace(/\u00a0/g," ").trim().replace(/\s+/g,"");
  if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(em.value)){
    setFormError(s,"Please enter a valid business email address, for example name@company.com.");
    em.focus();
    return;
  }

  if(w&&w.value.trim()){
    let v=w.value.trim().replace(/^https?:\\/\\//i,"").replace(/^www\\./i,"").replace(/\\/$/,"");
    if(!/^(?=.{3,200}$)([a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z]{2,63}$/i.test(v)){
      setFormError(s,"Please enter the company website as a domain, for example company.com.");
      w.focus();
      return;
    }
    w.value=v;
  }

  const d=Object.fromEntries(new FormData(f).entries());
  d.name=[d.first_name,d.last_name].filter(Boolean).join(" ").trim();
  d.services=[...f.querySelectorAll('input[name="services"]:checked')].map(x=>x.value);
  if(d.website){return;}

  b.disabled=true;
  b.setAttribute("aria-busy","true");
  b.textContent="Submitting…";
  s.textContent="Submitting…";
  s.removeAttribute("data-error");

  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),15000);

  try{
    const endpoint=C.leadApiUrl||"https://api.infralinksolution.com/api/leads";
    const r=await fetch(endpoint,{
      method:"POST",
      headers:{"Content-Type":"application/json","Accept":"application/json"},
      body:JSON.stringify(d),
      signal:controller.signal
    });
    await readApiResponse(r);
    gtag("event","generate_lead",{lead_type:f.dataset.leadForm});
    location.href="/thank-you.html";
  }catch(x){
    const message=x.name==="AbortError"
      ?"The request timed out. Please try again."
      :x instanceof TypeError
        ?"We couldn't connect to our secure enquiry service. Please try again in a moment."
        :(x.message||"Something went wrong. Please try again.");
    setFormError(s,message);
    b.disabled=false;
    b.removeAttribute("aria-busy");
    b.textContent="Get Your Free IT Assessment →";
  }finally{
    clearTimeout(timeout);
  }
}));

const bookingUrl=C.bookingUrl||"";
document.querySelectorAll(".booking-link").forEach(a=>{
  if(bookingUrl){
    a.href=bookingUrl;
    a.target="_blank";
    a.rel="noopener noreferrer";
  }else{
    a.href="contact.html";
  }
});
