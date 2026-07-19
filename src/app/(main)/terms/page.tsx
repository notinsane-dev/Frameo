import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "CineAI Terms of Service and User Agreement",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold font-playfair mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
            Terms of Service
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
              1. Agreement to Terms
            </h2>
            <p>
              By accessing and using CineAI (&quot;the Service&quot;), you accept and agree to be bound by
              the terms and provision of this agreement. If you do not agree to abide by the above, please
              do not use this service.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              2. Use License
            </h2>
            <p className="mb-4">
              Permission is granted to temporarily download one copy of the materials (information or
              software) on CineAI for personal, non-commercial transitory viewing only. This is the grant
              of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to decompile or reverse engineer any software contained on CineAI</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or &quot;mirror&quot; the materials on any other server</li>
              <li>Violate any applicable laws or regulations related to access to or use of the Service</li>
              <li>Harass or cause distress or inconvenience to any person</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              3. Disclaimer
            </h2>
            <p className="mb-4">
              The materials on CineAI are provided on an &apos;as is&apos; basis. CineAI makes no warranties,
              expressed or implied, and hereby disclaims and negates all other warranties including, without
              limitation, implied warranties or conditions of merchantability, fitness for a particular
              purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
            <p>
              Further, CineAI does not warrant or make any representations concerning the accuracy, likely
              results, or reliability of the use of the materials on its Internet web site or otherwise
              relating to such materials or on any sites linked to this site.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              4. Limitations
            </h2>
            <p>
              In no event shall CineAI or its suppliers be liable for any damages (including, without
              limitation, damages for loss of data or profit, or due to business interruption) arising
              out of the use or inability to use the materials on CineAI, even if CineAI or a CineAI
              authorized representative has been notified orally or in writing of the possibility of such
              damage.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              5. User Accounts and Content
            </h2>
            <p className="mb-4">
              If you create an account on CineAI, you are responsible for maintaining the confidentiality
              of your account information and password, and you are responsible for all activities that
              occur under your account. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Not share your password or account access with others</li>
              <li>Take responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              6. User-Generated Content
            </h2>
            <p className="mb-4">
              CineAI may allow you to post, submit, or display content such as movie ratings, reviews, and
              recommendations. By submitting content to CineAI, you grant CineAI a worldwide, non-exclusive,
              royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit,
              display, and distribute such content.
            </p>
            <p>
              You represent and warrant that you own or have the necessary rights to submit the content and
              that your content does not violate any third-party intellectual property rights or applicable laws.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              7. Third-Party Services
            </h2>
            <p className="mb-4">
              CineAI uses third-party services to provide its functionality, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>TMDB API for movie data and information</li>
              <li>Google API for authentication and recommendations</li>
              <li>Third-party infrastructure providers</li>
            </ul>
            <p className="mt-4">
              Your use of these services is subject to their respective terms and privacy policies. CineAI
              is not responsible for the content or policies of third-party services.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              8. Prohibited Conduct
            </h2>
            <p className="mb-4">You agree not to engage in any of the following conduct:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Violating any applicable law or regulation</li>
              <li>Infringing on intellectual property rights</li>
              <li>Posting abusive, harassing, defamatory, or obscene content</li>
              <li>Spamming or flooding the Service</li>
              <li>Attempting to gain unauthorized access to the Service</li>
              <li>Engaging in any form of automated data collection or scraping</li>
              <li>Interfering with or disrupting the integrity of the Service</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              9. Termination
            </h2>
            <p>
              CineAI may terminate or suspend your account and access to the Service immediately, without
              prior notice or liability, for any reason whatsoever, including if you breach the Terms of
              Service or if CineAI reasonably believes you are in breach of these terms.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              10. Governing Law
            </h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of the
              jurisdiction in which CineAI is operated, and you irrevocably submit to the exclusive
              jurisdiction of the courts in that location.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              11. Changes to Terms
            </h2>
            <p>
              CineAI reserves the right to modify or replace these Terms at any time. If a revision is material,
              we will try to provide at least 30 days notice prior to any new terms taking effect. Your continued
              use of CineAI following the posting of revised Terms means that you accept and agree to the changes.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-2xl font-bold font-playfair text-yellow-400 mb-4">
              12. Contact Us
            </h2>
            <p>
              If you have any questions about these Terms of Service, please contact us through the contact
              information provided on our website.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-16 pt-8 border-t border-gray-700 flex justify-between items-center">
          <Link
            href="/"
            className="text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            ← Back to Home
          </Link>
          <Link
            href="/privacy"
            className="text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            Privacy Policy →
          </Link>
        </div>
      </div>
    </div>
  )
}
