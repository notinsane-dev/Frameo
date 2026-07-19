import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "CineAI Privacy Policy - How we collect and use your data",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold font-playfair mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
            Privacy Policy
          </h1>
          <p className="text-gray-400 text-lg">
            Last updated: April 18, 2026
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-gray-300 leading-relaxed">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              1. Introduction
            </h2>
            <p>
              CineAI (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the CineAI website and application. This page
              informs you of our policies regarding the collection, use, and disclosure of personal data
              when you use our Service and the choices you have associated with that data.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              2. Information Collection and Use
            </h2>
            <p className="mb-4">We collect several different types of information for various purposes to provide and improve our Service to you.</p>
            
            <h3 className="text-xl font-semibold text-yellow-300 mb-3">Types of Data Collected:</h3>
            
            <div className="ml-4 space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-2">Personal Data:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Email address (when you create an account)</li>
                  <li>Name (when provided during authentication)</li>
                  <li>Profile picture (when linked to social authentication)</li>
                  <li>Movie ratings and watchlist data</li>
                  <li>User preferences and viewing history</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Usage Data:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Pages visited and time spent</li>
                  <li>Search queries and recommendations viewed</li>
                  <li>Device type and operating system</li>
                  <li>Browser type and version</li>
                  <li>IP address</li>
                  <li>Referring URL and exit pages</li>
                  <li>Click patterns and interactions</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Cookies and Tracking Technologies:</h4>
                <p>
                  We use cookies, web beacons, and similar technologies to track your activity on our Service
                  and store certain information. This helps us improve your experience and provide personalized
                  recommendations.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Authentication Data:</h4>
                <p>
                  When you sign in with Google, we receive certain information from Google&apos;s authentication
                  service, including your name, email address, and profile picture (if applicable).
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              3. Use of Data
            </h2>
            <p className="mb-4">CineAI uses the collected data for various purposes:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To allow you to participate in interactive features of our Service</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information so we can improve our Service</li>
              <li>To monitor the usage of our Service</li>
              <li>To detect, prevent and address technical issues and fraudulent activity</li>
              <li>To provide you with personalized movie recommendations</li>
              <li>To improve AI recommendation algorithms</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              4. Third-Party Service Providers
            </h2>
            <p className="mb-4">
              We may employ third-party companies and individuals to facilitate our Service, to provide the
              Service on our behalf, to perform Service-related services, or to assist us in analyzing how
              our Service is used. These third parties have access to your personal data only to perform
              these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
            </p>

            <h3 className="text-xl font-semibold text-yellow-300 mb-3">Third-Party Services We Use:</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Google Authentication:</strong> For user authentication and sign-in</li>
              <li><strong>TMDB (The Movie Database):</strong> For movie data, images, and information</li>
              <li><strong>Google Gemini API:</strong> For generating personalized recommendations</li>
              <li><strong>Vercel:</strong> For hosting and infrastructure</li>
              <li><strong>Sentry:</strong> For error tracking and monitoring</li>
            </ul>

            <p className="mt-4 text-sm">
              Please review the privacy policies of these third-party services to understand how they handle
              your data.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              5. Data Retention
            </h2>
            <p className="mb-4">
              CineAI will retain your personal data only for as long as necessary to provide our Service
              and as required by law. 
            </p>
            <p>
              Specifically:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>Account data is retained for as long as your account exists</li>
              <li>Ratings and watchlist data is retained until you delete them or your account</li>
              <li>Usage analytics may be retained for up to 12 months</li>
              <li>You can request deletion of your personal data at any time</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              6. Data Security
            </h2>
            <p>
              The security of your data is important to us but remember that no method of transmission over
              the Internet or method of electronic storage is 100% secure. While we strive to use commercially
              acceptable means to protect your personal data, we cannot guarantee its absolute security.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              7. Your Rights
            </h2>
            <p className="mb-4">You have the following rights regarding your personal data:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Right to Access:</strong> You can request a copy of all personal data we hold about you</li>
              <li><strong>Right to Correction:</strong> You can correct inaccurate personal data</li>
              <li><strong>Right to Deletion:</strong> You can request deletion of your personal data</li>
              <li><strong>Right to Restrict Processing:</strong> You can restrict how we use your data</li>
              <li><strong>Right to Data Portability:</strong> You can request your data in a portable format</li>
              <li><strong>Right to Object:</strong> You can object to certain processing of your data</li>
            </ul>

            <p className="mt-4">
              To exercise any of these rights, please contact us using the contact information provided below.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              8. Cookies
            </h2>
            <p className="mb-4">
              CineAI uses cookies to enhance your experience. Cookies are files with a small amount of data
              which may include an anonymous unique identifier.
            </p>
            <p className="mb-4">
              You have the option to either accept or refuse these cookies and know when a cookie is being
              sent to your device. If you choose to refuse our cookies, you may not be able to use some
              portions of this Service.
            </p>

            <h3 className="text-xl font-semibold text-yellow-300 mb-3">Types of Cookies We Use:</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Session Cookies:</strong> For authentication and navigation</li>
              <li><strong>Preference Cookies:</strong> To remember your settings</li>
              <li><strong>Analytics Cookies:</strong> To understand how you use our Service</li>
              <li><strong>Security Cookies:</strong> To protect against fraud and unauthorized access</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              9. CCPA Privacy Rights (California Residents)
            </h2>
            <p className="mb-4">
              If you are a California resident, you have the following rights under the California Consumer
              Privacy Act (CCPA):
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The right to know what personal information is collected, used, shared or sold</li>
              <li>The right to delete personal information collected from you</li>
              <li>The right to opt-out of the sale or sharing of your personal information</li>
              <li>The right to non-discrimination for exercising your CCPA rights</li>
            </ul>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              10. GDPR Privacy Rights (European Residents)
            </h2>
            <p>
              If you are located in the European Economic Area (EEA), you have data protection rights under
              the General Data Protection Regulation (GDPR). For more information about your GDPR rights and
              how to exercise them, please contact us using the information below.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              11. Children&apos;s Privacy
            </h2>
            <p>
              CineAI does not knowingly collect personal data from children under the age of 13. If we become
              aware that a child under 13 has provided us with personal data, we will take steps to delete such
              information and terminate the child&apos;s account. If you are a parent or guardian and believe your
              child has provided us with personal data, please contact us immediately.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              12. Third-Party Links
            </h2>
            <p>
              Our Service may contain links to other websites that are not operated by us. This Privacy Policy
              applies only to our Service. We are not responsible for the privacy practices of third-party websites.
              We encourage you to review the privacy policies of any third-party websites before providing your
              personal information.
            </p>
          </section>

          {/* Section 13 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              13. Changes to This Privacy Policy
            </h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting
              the new Privacy Policy on this page and updating the &quot;Last updated&quot; date at the top of this
              Privacy Policy.
            </p>
          </section>

          {/* Section 14 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              14. Contact Us
            </h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-yellow-400">
              privacy@cineai.app
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-16 pt-8 border-t border-gray-700 flex justify-between items-center">
          <Link
            href="/terms"
            className="text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            ← Terms of Service
          </Link>
          <Link
            href="/"
            className="text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            Back to Home →
          </Link>
        </div>
      </div>
    </div>
  )
}
