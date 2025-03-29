import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using webs, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.
        </p>
        
        <h2>2. Description of Service</h2>
        <p>
          Webs provides a web content retrieval, processing, and interaction service that allows users to fetch, summarize, and chat about web content.
        </p>
        
        <h2>3. User Responsibilities</h2>
        <p>
          You are responsible for your use of the service and any content you submit, post, or display. You may not use the service for any illegal or unauthorized purpose.
        </p>
        
        <h2>4. Content Policy</h2>
        <p>
          Content fetched through the service is subject to the terms of the original content providers. Webs does not claim ownership of any content retrieved through the service.
        </p>
        
        <h2>5. Privacy</h2>
        <p>
          Your privacy is important to us. Please review our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> to understand how we collect, use, and disclose information.
        </p>
        
        <h2>6. Modifications to Service</h2>
        <p>
          We reserve the right to modify or discontinue the service at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the service.
        </p>
        
        <h2>7. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, webs shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
        </p>
        
        <h2>8. Changes to Terms</h2>
        <p>
          We reserve the right to update these Terms of Service at any time. We will notify users of significant changes by posting an announcement on the service or by other means.
        </p>
        
        <h2>9. Contact</h2>
        <p>
          If you have any questions about these Terms, please contact us.
        </p>
      </div>
      
      <div className="mt-12 text-center">
        <Link href="/" className="text-primary hover:underline">
          Return to Home
        </Link>
      </div>
    </div>
  );
} 