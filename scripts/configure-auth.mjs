#!/usr/bin/env node

const PROJECT_REF = "jhihqmkqvbwfniwculhk";
const SITE_URL = "http://localhost:3000";
const REDIRECT_URLS = [
  "http://localhost:3000",
  "http://localhost:3000/auth/callback",
];

const OTP_EMAIL_CONTENT = `<h2>Your Hostiggo login code</h2>
<p>Enter this code to sign in:</p>
<p style="font-size: 28px; letter-spacing: 4px; font-weight: bold; color: #1B3FA0;">{{ .Token }}</p>
<p>This code expires in 1 hour.</p>`;

const OTP_EMAIL_SUBJECT = "Your Hostiggo login code";

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.error(
      "\nMissing SUPABASE_ACCESS_TOKEN.\n\n" +
        "1. Go to https://supabase.com/dashboard/account/tokens\n" +
        "2. Create a new personal access token\n" +
        "3. Add it to .env.local:\n\n" +
        "   SUPABASE_ACCESS_TOKEN=your-token-here\n\n" +
        "4. Run this script again: node scripts/configure-auth.mjs\n"
    );
    process.exit(1);
  }

  console.log("Updating auth configuration...");

  // Step 1: Update Site URL and Redirect URLs
  const patchRes = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        site_url: SITE_URL,
        redirect_urls: REDIRECT_URLS,
      }),
    }
  );

  if (!patchRes.ok) {
    const body = await patchRes.text();
    console.error(`Failed to update URL config (${patchRes.status}):`, body);
    process.exit(1);
  }

  console.log("  Site URL:       " + SITE_URL);
  console.log("  Redirect URLs:  " + JSON.stringify(REDIRECT_URLS));

  // Step 2: Update Magic Link email template to send 6-digit OTP
  const templateRes = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mailer_subjects_magic_link: OTP_EMAIL_SUBJECT,
        mailer_templates_magic_link_content: OTP_EMAIL_CONTENT,
      }),
    }
  );

  if (!templateRes.ok) {
    const body = await templateRes.text();
    console.error(`Failed to update email template (${templateRes.status}):`, body);
    console.log("\n⚠️  Email template update failed. You may need to update it manually:");
    console.log("   Supabase Dashboard → Authentication → Email Templates → Magic Link");
    console.log("   Replace the body with content using {{ .Token }} (6-digit code)");
    process.exit(1);
  }

  const templateUpdated = await templateRes.json();
  console.log("  Email template: 6-digit OTP (replaced magic link)");

  console.log("\n✅ Done! Auth configuration updated successfully.");
  console.log("   Users will now receive a 6-digit code in their email instead of a magic link.");
}

main();
