import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <h2>1. Information We Collect</h2>
        <p>
          We collect information you provide directly to us when you use our service, including URLs you submit, queries you make, and feedback you provide. We also collect usage data such as your interactions with the service and technical data about your device and connection.
        </p>
        
        <h2>2. How We Use Your Information</h2>
        <p>
          We use the information we collect to provide, maintain, and improve our services, including:
        </p>
        <ul>
          <li>Processing and storing web content you request</li>
          <li>Generating summaries and responses to your queries</li>
          <li>Analyzing usage patterns to improve the service</li>
          <li>Detecting and preventing fraudulent or abusive usage</li>
        </ul>
        
        <h2>3. Information Sharing</h2>
        <p>
          We do not share your personal information with third parties except in the following cases:
        </p>
        <ul>
          <li>With your consent</li>
          <li>To comply with legal obligations</li>
          <li>To protect our rights, privacy, safety, or property</li>
          <li>In connection with a merger, acquisition, or sale of assets</li>
        </ul>
        
        <h2>4. Data Retention</h2>
        <p>
          We retain your data for as long as necessary to provide the service and fulfill the purposes outlined in this policy. You can request deletion of your data by contacting us.
        </p>
        
        <h2>5. Security</h2>
        <p>
          We implement reasonable security measures to protect your information from unauthorized access, alteration, or destruction. However, no method of transmission or storage is 100% secure.
        </p>
        
        <h2>6. Your Rights</h2>
        <p>
          Depending on your location, you may have rights regarding your personal data, including:
        </p>
        <ul>
          <li>Accessing your data</li>
          <li>Correcting inaccurate data</li>
          <li>Deleting your data</li>
          <li>Restricting processing of your data</li>
          <li>Data portability</li>
        </ul>
        
        <h2>7. Changes to this Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
        </p>
        
        <h2>8. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us.
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