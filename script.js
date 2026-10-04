const GA4_ID = "G-1HY3WV9BKV";
const C = window.INFRALINK_CONFIG || {};

const year = new Date().getFullYear();
document.querySelectorAll("[data-year], #year").forEach(el => {
  el.textContent = year;
});

const menu = document.querySelector(".menu");
const nav = document.querySelector(".navlinks");
if (menu && nav) {
  menu.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menu.setAttribute("aria-expanded", String(open));
  });
}

window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function () {
  window.dataLayer.push(arguments);
};
gtag("js", new Date());
gtag("config", GA4_ID);

const gaScript = document.createElement("script");
gaScript.async = true;
gaScript.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_ID;
document.head.appendChild(gaScript);

function setFormError(status, message) {
  status.textContent = message;
  status.dataset.error = "true";
}

async function readApiResponse(response) {
  const raw = await response.text();
  let data = null;

  if (raw.trim()) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message = data?.message || raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    throw new Error(message || `Unable to submit the form (HTTP ${response.status}).`);
  }

  if (data && data.success === false) {
    throw new Error(data.message || "Unable to submit the form.");
  }

  return data || {};
}

document.querySelectorAll("form[data-lead-form]").forEach(form => {
  form.addEventListener("submit", async event => {
    event.preventDefault();

    const status = form.querySelector(".form-status");
    const button = form.querySelector("button[type='submit']");
    const email = form.querySelector("[name='email']");
    const nameField = form.querySelector("[name='name']");
    const websiteField = form.querySelector("[name='company_website']");
    const honeypot = form.querySelector("[name='company_fax']");

    if (!status || !button || !email) return;

    if (nameField) {
      nameField.value = nameField.value.replace(/\u00a0/g, " ").trim().replace(/\s+/g, " ");
      if (!nameField.value) {
        setFormError(status, "Please enter your name.");
        nameField.focus();
        return;
      }
    }

    email.value = email.value.replace(/\u00a0/g, " ").trim().replace(/\s+/g, " ");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      setFormError(status, "Please enter a valid email address, for example name@company.com.");
      email.focus();
      return;
    }

    if (websiteField && websiteField.value.trim()) {
      let value = websiteField.value.trim()
        .replace(/^https?:\/\//i, "")
        .replace(/^www\./i, "")
        .replace(/\/$/, "");

      if (!/^(?=.{3,200}$)([a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/i.test(value)) {
        setFormError(status, "Please enter the company website as a domain, for example company.com.");
        websiteField.focus();
        return;
      }

      websiteField.value = value;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
    data.name = fullName || String(data.name || "").trim();
    if (!data.name && nameField) data.name = nameField.value.trim();
    data.lead_type = form.dataset.leadForm || "contact";
    data.services = [...form.querySelectorAll("input[name='services']:checked")].map(input => input.value);

    // Honeypot: silently ignore bots without sending anything.
    if (honeypot && honeypot.value.trim()) {
      status.textContent = "Thanks.";
      return;
    }

    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = "Submitting…";
    status.textContent = "Submitting…";
    status.removeAttribute("data-error");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const endpoint = C.leadApiUrl || "https://api.infralinksolution.com/api/leads";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      await readApiResponse(response);

      gtag("event", "generate_lead", {
        lead_type: form.dataset.leadForm
      });

      window.location.assign("/thank-you.html");
    } catch (error) {
      const message =
        error?.name === "AbortError"
          ? "The request timed out. Please try again."
          : error instanceof TypeError
            ? "We couldn't connect to our secure enquiry service. Please try again in a moment."
            : error?.message || "Something went wrong. Please try again.";

      setFormError(status, message);
      button.disabled = false;
      button.removeAttribute("aria-busy");
      button.textContent = form.dataset.leadForm === "contact" ? "Send Enquiry →" : "Get Your Free IT Health Check →";
    } finally {
      clearTimeout(timeout);
    }
  });
});

const bookingUrl = C.bookingUrl || "";
document.querySelectorAll(".booking-link").forEach(link => {
  if (bookingUrl) {
    link.href = bookingUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  } else {
    link.href = "contact.html";
  }
});
