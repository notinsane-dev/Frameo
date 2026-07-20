import type { Metadata } from "next"

import {
	LegalDocument,
	LegalList,
	LegalListItem,
	LegalSection,
	LegalSubheading,
} from "@/components/legal/LegalDocument"
import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
	title: "Privacy Policy",
	description: `${siteConfig.name} Privacy Policy — how we collect and use your data`,
}

const toc = [
	{ id: "introduction", label: "Introduction" },
	{ id: "collection", label: "Collection" },
	{ id: "use", label: "Use of data" },
	{ id: "providers", label: "Providers" },
	{ id: "retention", label: "Retention" },
	{ id: "security", label: "Security" },
	{ id: "rights", label: "Your rights" },
	{ id: "cookies", label: "Cookies" },
	{ id: "ccpa", label: "CCPA" },
	{ id: "gdpr", label: "GDPR" },
	{ id: "children", label: "Children" },
	{ id: "links", label: "Third-party links" },
	{ id: "changes", label: "Changes" },
	{ id: "contact", label: "Contact" },
]

export default function PrivacyPage() {
	return (
		<LegalDocument
			title="Privacy Policy"
			description={`How ${siteConfig.name} collects, uses, and protects your information when you rate films, build watchlists, and get recommendations.`}
			updated="April 18, 2026"
			toc={toc}
			related={{ href: "/terms", label: "Terms of Service" }}
		>
			<LegalSection id="introduction" title="1. Introduction">
				<p>
					{siteConfig.name} (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the{" "}
					{siteConfig.name} website and application. This page explains our policies on the
					collection, use, and disclosure of personal data when you use the Service, and the
					choices you have associated with that data.
				</p>
			</LegalSection>

			<LegalSection id="collection" title="2. Information Collection and Use">
				<p>
					We collect several types of information to provide and improve the Service.
				</p>

				<LegalSubheading>Personal data</LegalSubheading>
				<LegalList>
					<LegalListItem>Email address (when you create an account)</LegalListItem>
					<LegalListItem>Name (when provided during authentication)</LegalListItem>
					<LegalListItem>
						Profile picture (when linked to social authentication)
					</LegalListItem>
					<LegalListItem>Movie ratings and watchlist data</LegalListItem>
					<LegalListItem>User preferences and viewing history</LegalListItem>
				</LegalList>

				<LegalSubheading>Usage data</LegalSubheading>
				<LegalList>
					<LegalListItem>Pages visited and time spent</LegalListItem>
					<LegalListItem>Search queries and recommendations viewed</LegalListItem>
					<LegalListItem>Device type and operating system</LegalListItem>
					<LegalListItem>Browser type and version</LegalListItem>
					<LegalListItem>IP address</LegalListItem>
					<LegalListItem>Referring URL and exit pages</LegalListItem>
					<LegalListItem>Click patterns and interactions</LegalListItem>
				</LegalList>

				<LegalSubheading>Cookies and tracking</LegalSubheading>
				<p>
					We use cookies, web beacons, and similar technologies to track activity on the
					Service and store certain information. This helps us improve your experience and
					provide personalized recommendations.
				</p>

				<LegalSubheading>Authentication data</LegalSubheading>
				<p>
					When you sign in with Google, we receive certain information from Google&apos;s
					authentication service, including your name, email address, and profile picture
					(if applicable).
				</p>
			</LegalSection>

			<LegalSection id="use" title="3. Use of Data">
				<p>{siteConfig.name} uses collected data to:</p>
				<LegalList>
					<LegalListItem>Provide and maintain the Service</LegalListItem>
					<LegalListItem>Notify you about changes to the Service</LegalListItem>
					<LegalListItem>
						Allow participation in interactive features of the Service
					</LegalListItem>
					<LegalListItem>Provide customer support</LegalListItem>
					<LegalListItem>Analyze usage so we can improve the Service</LegalListItem>
					<LegalListItem>Monitor usage of the Service</LegalListItem>
					<LegalListItem>
						Detect, prevent, and address technical issues and fraudulent activity
					</LegalListItem>
					<LegalListItem>Provide personalized movie recommendations</LegalListItem>
					<LegalListItem>Improve AI recommendation systems</LegalListItem>
				</LegalList>
			</LegalSection>

			<LegalSection id="providers" title="4. Third-Party Service Providers">
				<p>
					We may employ third-party companies and individuals to facilitate the Service,
					provide it on our behalf, perform Service-related tasks, or help analyze usage.
					These parties have access to personal data only to perform those tasks and are
					obligated not to disclose or use it for any other purpose.
				</p>

				<LegalSubheading>Services we use</LegalSubheading>
				<LegalList>
					<LegalListItem>
						<strong className="text-[var(--color-text)]">Google Authentication</strong> —
						sign-in
					</LegalListItem>
					<LegalListItem>
						<strong className="text-[var(--color-text)]">TMDB</strong> — movie data and
						imagery
					</LegalListItem>
					<LegalListItem>
						<strong className="text-[var(--color-text)]">Google Gemini</strong> —
						personalized recommendations
					</LegalListItem>
					<LegalListItem>
						<strong className="text-[var(--color-text)]">Hosting providers</strong> —
						infrastructure
					</LegalListItem>
					<LegalListItem>
						<strong className="text-[var(--color-text)]">Sentry</strong> — error tracking
					</LegalListItem>
				</LegalList>
				<p>
					Please review the privacy policies of these third-party services to understand how
					they handle your data.
				</p>
			</LegalSection>

			<LegalSection id="retention" title="5. Data Retention">
				<p>
					{siteConfig.name} retains personal data only as long as necessary to provide the
					Service and as required by law.
				</p>
				<LegalList>
					<LegalListItem>
						Account data is retained for as long as your account exists
					</LegalListItem>
					<LegalListItem>
						Ratings and watchlist data are retained until you delete them or your account
					</LegalListItem>
					<LegalListItem>Usage analytics may be retained for up to 12 months</LegalListItem>
					<LegalListItem>
						You can request deletion of your personal data at any time
					</LegalListItem>
				</LegalList>
			</LegalSection>

			<LegalSection id="security" title="6. Data Security">
				<p>
					The security of your data matters to us, but no method of transmission over the
					Internet or electronic storage is 100% secure. While we strive to use commercially
					acceptable means to protect personal data, we cannot guarantee absolute security.
				</p>
			</LegalSection>

			<LegalSection id="rights" title="7. Your Rights">
				<p>You have the following rights regarding your personal data:</p>
				<LegalList>
					<LegalListItem>
						<strong className="text-[var(--color-text)]">Access</strong> — request a copy
						of personal data we hold about you
					</LegalListItem>
					<LegalListItem>
						<strong className="text-[var(--color-text)]">Correction</strong> — correct
						inaccurate personal data
					</LegalListItem>
					<LegalListItem>
						<strong className="text-[var(--color-text)]">Deletion</strong> — request
						deletion of your personal data
					</LegalListItem>
					<LegalListItem>
						<strong className="text-[var(--color-text)]">Restrict processing</strong> —
						limit how we use your data
					</LegalListItem>
					<LegalListItem>
						<strong className="text-[var(--color-text)]">Portability</strong> — request
						your data in a portable format
					</LegalListItem>
					<LegalListItem>
						<strong className="text-[var(--color-text)]">Object</strong> — object to
						certain processing of your data
					</LegalListItem>
				</LegalList>
				<p>
					To exercise any of these rights, contact us using the details in the Contact
					section below.
				</p>
			</LegalSection>

			<LegalSection id="cookies" title="8. Cookies">
				<p>
					{siteConfig.name} uses cookies to enhance your experience. Cookies are small data
					files that may include an anonymous unique identifier.
				</p>
				<p>
					You can accept or refuse cookies and learn when a cookie is sent to your device.
					Refusing cookies may limit some parts of the Service.
				</p>

				<LegalSubheading>Types of cookies we use</LegalSubheading>
				<LegalList>
					<LegalListItem>
						<strong className="text-[var(--color-text)]">Session</strong> — authentication
						and navigation
					</LegalListItem>
					<LegalListItem>
						<strong className="text-[var(--color-text)]">Preference</strong> — remember
						your settings
					</LegalListItem>
					<LegalListItem>
						<strong className="text-[var(--color-text)]">Analytics</strong> — understand
						how you use the Service
					</LegalListItem>
					<LegalListItem>
						<strong className="text-[var(--color-text)]">Security</strong> — protect
						against fraud and unauthorized access
					</LegalListItem>
				</LegalList>
			</LegalSection>

			<LegalSection id="ccpa" title="9. CCPA (California Residents)">
				<p>
					If you are a California resident, you have rights under the California Consumer
					Privacy Act (CCPA), including:
				</p>
				<LegalList>
					<LegalListItem>
						The right to know what personal information is collected, used, shared, or sold
					</LegalListItem>
					<LegalListItem>
						The right to delete personal information collected from you
					</LegalListItem>
					<LegalListItem>
						The right to opt out of the sale or sharing of your personal information
					</LegalListItem>
					<LegalListItem>
						The right to non-discrimination for exercising your CCPA rights
					</LegalListItem>
				</LegalList>
			</LegalSection>

			<LegalSection id="gdpr" title="10. GDPR (European Residents)">
				<p>
					If you are in the European Economic Area (EEA), you have data protection rights
					under the General Data Protection Regulation (GDPR). For more information about
					your rights and how to exercise them, contact us using the details below.
				</p>
			</LegalSection>

			<LegalSection id="children" title="11. Children's Privacy">
				<p>
					{siteConfig.name} does not knowingly collect personal data from children under 13.
					If we become aware that a child under 13 has provided personal data, we will take
					steps to delete it and terminate the account. If you are a parent or guardian and
					believe your child has provided personal data, contact us immediately.
				</p>
			</LegalSection>

			<LegalSection id="links" title="12. Third-Party Links">
				<p>
					The Service may contain links to websites we do not operate. This Privacy Policy
					applies only to our Service. We are not responsible for third-party privacy
					practices. Review their policies before providing personal information.
				</p>
			</LegalSection>

			<LegalSection id="changes" title="13. Changes to This Policy">
				<p>
					We may update this Privacy Policy from time to time. We will post the new policy
					on this page and update the &quot;Last updated&quot; date at the top.
				</p>
			</LegalSection>

			<LegalSection id="contact" title="14. Contact Us">
				<p>Questions about this Privacy Policy? Contact us at:</p>
				<p>
					<a href="mailto:privacy@frameo.app">privacy@frameo.app</a>
				</p>
			</LegalSection>
		</LegalDocument>
	)
}
