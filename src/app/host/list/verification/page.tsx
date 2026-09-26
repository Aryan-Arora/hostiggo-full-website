import { redirect } from 'next/navigation';

// The mobile-app video-verification step was removed from the listing
// wizard (the app it pointed to doesn't exist yet). Keep the old URL
// working -- bookmarks, the post-sign-in redirect of older sessions -- by
// sending hosts to what is now the final step.
export default function VerificationPage() {
  redirect('/host/list/house-rules');
}
