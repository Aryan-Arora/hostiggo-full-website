import HelpArticle, { A, List, Note, P } from "@/components/help/HelpArticle";

export const metadata = {
  title: "Verify Your Identity · Hostiggo Help",
  description: "How Aadhaar identity verification works for Hostiggo hosts.",
};

export default function VerifyIdentityHelpPage() {
  return (
    <HelpArticle
      title="How to verify your identity"
      updated="September 26, 2026"
      intro={
        <p>
          Hostiggo verifies hosts using their Aadhaar card. Verification is <strong>optional</strong>:
          you can list and host without it, but verified hosts earn more guest trust and bookings.
        </p>
      }
      sections={[
        {
          id: "when",
          title: "When you'll be asked",
          body: (
            <>
              <P>
                The first time you start creating a listing, we show the verification page once. You
                can verify then, or choose <strong>&ldquo;Skip for now — I&apos;ll verify later&rdquo;</strong>.
                If you skip, the listing flow won&apos;t ask again.
              </P>
              <P>
                You can verify any time from{" "}
                <A href="/host/settings">Host Settings</A> → <strong>Identity Verification</strong> →{" "}
                <strong>Verify now</strong>.
              </P>
            </>
          ),
        },
        {
          id: "steps",
          title: "Step by step",
          body: (
            <List
              ordered
              items={[
                <>Upload a photo of the <strong>front</strong> and the <strong>back</strong> of your Aadhaar card (JPG, PNG or WEBP, up to 8 MB each). Make sure all four corners are visible and the details are readable.</>,
                <>Enter your <strong>full name</strong> exactly as it appears on your Aadhaar.</>,
                <>Enter your 12-digit <strong>Aadhaar number</strong>. We check it&apos;s a valid Aadhaar number as you type, so typos are caught straight away.</>,
                <>Tick the consent box allowing Hostiggo to use your Aadhaar photo and details for identity verification, in line with our <A href="/privacy">Privacy policy</A>.</>,
                <>Submit. You&apos;ll see &ldquo;Aadhaar details received — verification is in progress.&rdquo;</>,
              ]}
            />
          ),
        },
        {
          id: "status",
          title: "Checking your status",
          body: (
            <>
              <P>Host Settings → Identity Verification shows one of:</P>
              <List
                items={[
                  <><strong>Verify now</strong>: you haven&apos;t submitted yet.</>,
                  <><strong>Pending</strong>: your documents are in and verification is in progress.</>,
                  <><strong>Verified</strong>: your identity has been successfully verified.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "privacy",
          title: "How your documents are protected",
          body: (
            <>
              <P>
                Aadhaar photos are stored in a private storage bucket that is never reachable by a public
                link, separate from listing photos. They are used only for identity verification.
              </P>
              <Note>
                Verification currently uses Aadhaar only. Bank and PAN details for payouts are collected
                separately, see <A href="/help/payouts">Payouts &amp; bank details</A>.
              </Note>
            </>
          ),
        },
      ]}
    />
  );
}
