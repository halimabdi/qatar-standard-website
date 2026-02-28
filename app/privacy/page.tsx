export const metadata = {
  title: 'Privacy Policy',
  description: 'Qatar Standard privacy policy',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
      <div className="prose-en text-gray-700 space-y-4">
        <p>Last updated: February 2026</p>

        <h2 className="text-xl font-bold text-gray-900 mt-8">Information We Collect</h2>
        <p>
          Qatar Standard collects minimal data. We use cookies to remember your language preference
          (Arabic or English) and admin authentication sessions. No personal information is collected
          from readers.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8">Analytics</h2>
        <p>
          We use Umami, a privacy-focused analytics tool, to understand how visitors use our website.
          Umami does not use cookies and does not collect personal data. All data is aggregated and anonymous.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8">Third-Party Services</h2>
        <p>
          We use Google AdSense to display advertisements. Google may use cookies and tracking technologies
          as described in their privacy policy. We also embed content from external sources which may set their
          own cookies.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8">Contact</h2>
        <p>
          For privacy-related inquiries, please contact us at newsdesk@qatar-standard.com.
        </p>
      </div>
    </div>
  );
}
