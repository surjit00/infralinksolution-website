const GA4_ID = "G-1HY3WV9BKV";
const CONFIG = window.INFRALINK_CONFIG || {};

document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());

const menu = document.querySelector(".menu");
const links = document.querySelector(".navlinks");
if (menu && links) {
  menu.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    menu.setAttribute("aria-expanded", String(open));
  });
}

// Preserve campaign attribution for lead follow-up.
(() => {
  const params = new URLSearchParams(window.location.search);
  const keys = ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","gclid","msclkid"];
  const attribution = {};
  let found = false;
  keys.forEach(key => { const value = params.get(key); if (value) { attribution[key] = value; found = true; } });
  if (found) { try { localStorage.setItem("infralink_attribution", JSON.stringify(attribution)); } catch (_) {} }
})();

// GA4
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
window.gtag("js", new Date());
window.gtag("config", GA4_ID, { send_page_view: true, cookie_flags: "SameSite=Lax;Secure" });
const gaScript = document.createElement("script");
gaScript.async = true;
gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`;
document.head.appendChild(gaScript);

function trackEvent(eventName, params = {}) {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", eventName, { page_location: window.location.href, page_title: document.title, ...params });
}

document.querySelectorAll("[data-track]").forEach(el => el.addEventListener("click", () => {
  trackEvent(el.dataset.track, { link_text: (el.textContent || "").trim().slice(0,100), link_url: el.href || "" });
}));

document.querySelectorAll('a[href^="mailto:"]').forEach(el => el.addEventListener("click", () => {
  trackEvent("email_click", { email_address: (el.getAttribute("href") || "").replace(/^mailto:/i, "") });
}));

// Microsoft Bookings. Add the public URL to config.js after creating the booking page.
document.querySelectorAll(".booking-link").forEach(link => {
  if (CONFIG.bookingUrl) {
    link.href = CONFIG.bookingUrl;
    link.target = "_blank";
    link.rel = "noopener";
  } else {
    link.href = "free-it-assessment.html";
    link.addEventListener("click", e => {
      e.preventDefault();
      alert("Microsoft Bookings will be available here after the public booking URL is added to config.js.");
    });
  }
});

function getAttribution() {
  try { return JSON.parse(localStorage.getItem("infralink_attribution") || "{}"); } catch (_) { return {}; }
}

function formToPayload(form) {
  const fd = new FormData(form);
  const services = fd.getAll("services");
  const data = Object.fromEntries(fd.entries());
  data.services = services;
  data.attribution = getAttribution();
  data.page_url = window.location.href;
  return data;
}

async function submitLeadForm(form) {
  const status = form.querySelector(".form-status");
  const button = form.querySelector('button[type="submit"]');
  if (!CONFIG.leadApiUrl || CONFIG.leadApiUrl.includes("YOUR")) {
    if (status) status.textContent = "Form endpoint is not configured yet.";
    return;
  }
  if (status) { status.textContent = "Submitting…"; status.removeAttribute("data-error"); }
  if (button) { button.disabled = true; button.dataset.originalText = button.textContent; button.textContent = "Submitting…"; }
  try {
    const response = await fetch(CONFIG.leadApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formToPayload(form))
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) throw new Error(result.message || "Unable to submit the form.");
    trackEvent("generate_lead", { lead_type: form.dataset.leadForm || "website_lead" });
    if (form.dataset.leadForm === "assessment") trackEvent("free_it_assessment_success");
    if (form.dataset.leadForm === "contact") trackEvent("contact_enquiry_success");
    window.location.href = "thank-you.html";
  } catch (error) {
    console.error(error);
    if (status) { status.textContent = error.message || "Something went wrong. Please email info@infralinksolution.com."; status.dataset.error = "true"; }
    if (button) { button.disabled = false; button.textContent = button.dataset.originalText || "Submit"; }
  }
}

document.querySelectorAll("form[data-lead-form]").forEach(form => {
  form.addEventListener("submit", event => {
    event.preventDefault();
    trackEvent(form.dataset.gaForm || "form_submit", { form_id: form.dataset.gaForm || form.dataset.leadForm });
    submitLeadForm(form);
  });
});

if (/\/pricing(?:\.html)?(?:\/)?$/i.test(window.location.pathname)) trackEvent("pricing_page_view");
