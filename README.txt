InfraLink Solution — Final Website

Included:
- Homepage and service pages aligned with the approved Homepage/Services content.
- Microsoft 365 + Google Workspace messaging.
- info@infralinksolution.com used as the public email.
- GA4: G-1HY3WV9BKV.
- Microsoft Clarity: yr1v5n2ahv.
- Free IT Health Check form prepared for Cloudflare Worker -> Brevo List #5.
- Contact form prepared for the same lead endpoint.
- Microsoft Bookings CTA placeholders.
- Responsive Inter-based design using InfraLink navy/cyan palette.
- SEO metadata, canonical URLs, sitemap and robots.txt.
- Privacy page updated for analytics/lead/booking integrations.

BEFORE DEPLOYMENT:
1. Open config.js and set bookingUrl to your Microsoft Bookings public URL.
2. Set leadApiUrl to the deployed Cloudflare Worker endpoint. Recommended: https://api.infralinksolution.com/leads.
3. Deploy cloudflare-worker/worker.js separately and store the Brevo key as Worker secret BREVO_API_KEY.
4. In Brevo, make sure the category/multiple-choice values match the website values.
5. Test a real form submission and confirm the contact appears in Brevo List #5.
