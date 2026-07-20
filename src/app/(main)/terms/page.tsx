import type { Metadata } from "next"

import {
	LegalDocument,
	LegalList,
	LegalListItem,
	LegalSection,
} from "@/components/legal/LegalDocument"
import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
	title: "Terms of Service",
	description: `${siteConfig.name} Terms of Service and user agreement`,
}

const toc = [
	{ id: "agreement", label: "Agreement" },
	{ id: "license", label: "Use license" },
	{ id: "disclaimer", label: "Disclaimer" },
	{ id: "limitations", label: "Limitations" },
	{ id: "accounts", label: "Accounts" },
	{ id: "content", label: "User content" },
	{ id: "third-party", label: "Third parties" },
	{ id: "conduct", label: "Conduct" },
	{ id: "termination", label: "Termination" },
	{ id: "law", label: "Governing law" },
	{ id: "changes", label: "Changes" },
	{ id: "contact", label: "Contact" },
]

export default function TermsPage() {
	return (
		<LegalDocument
			title="Terms of Service"
			description={`Rules for using ${siteConfig.name} — accounts, content, and what we ask of you while you decide what to watch next.`}
			updated="April 18, 2026"
			toc={toc}
			related={{ href: "/privacy", label: "Privacy Policy" }}
		>
			<LegalSection id="agreement" title="1. Agreement to Terms">
				<p>
					By accessing and using {siteConfig.name} (&quot;the Service&quot;), you accept and
					agree to be bound by these terms. If you do not agree, please do not use the
					Service.
				</p>
			</LegalSection>

			<LegalSection id="license" title="2. Use License">
				<p>
					Permission is granted to use {siteConfig.name} for personal, non-commercial
					viewing. This is a license, not a transfer of title. Under this license you may
					not:
				</p>
				<LegalList>
					<LegalListItem>Modify or copy the materials</LegalListItem>
					<LegalListItem>
						Use the materials for any commercial purpose or public display
					</LegalListItem>
					<LegalListItem>
						Attempt to decompile or reverse engineer any software in the Service
					</LegalListItem>
					<LegalListItem>
						Remove any copyright or other proprietary notations from the materials
					</LegalListItem>
					<LegalListItem>
						Transfer the materials to another person or &quot;mirror&quot; them on another
						server
					</LegalListItem>
					<LegalListItem>
						Violate any applicable laws related to access or use of the Service
					</LegalListItem>
					<LegalListItem>
						Harass or cause distress or inconvenience to any person
					</LegalListItem>
				</LegalList>
			</LegalSection>

			<LegalSection id="disclaimer" title="3. Disclaimer">
				<p>
					The materials on {siteConfig.name} are provided on an &apos;as is&apos; basis.{" "}
					{siteConfig.name} makes no warranties, expressed or implied, and disclaims all
					other warranties including implied warranties of merchantability, fitness for a
					particular purpose, or non-infringement of intellectual property or other rights.
				</p>
				<p>
					Further, {siteConfig.name} does not warrant or make any representations concerning
					the accuracy, likely results, or reliability of the materials on the Service or on
					any sites linked to it.
				</p>
			</LegalSection>

			<LegalSection id="limitations" title="4. Limitations">
				<p>
					In no event shall {siteConfig.name} or its suppliers be liable for any damages
					(including loss of data or profit, or business interruption) arising out of the
					use or inability to use the Service, even if {siteConfig.name} or an authorized
					representative has been notified of the possibility of such damage.
				</p>
			</LegalSection>

			<LegalSection id="accounts" title="5. User Accounts">
				<p>
					If you create an account, you are responsible for maintaining the confidentiality
					of your credentials and for all activity under your account. You agree to:
				</p>
				<LegalList>
					<LegalListItem>
						Provide accurate, current, and complete information during registration
					</LegalListItem>
					<LegalListItem>Maintain and promptly update your account information</LegalListItem>
					<LegalListItem>Not share your password or account access with others</LegalListItem>
					<LegalListItem>Take responsibility for all activities under your account</LegalListItem>
					<LegalListItem>
						Notify us immediately of any unauthorized use of your account
					</LegalListItem>
				</LegalList>
			</LegalSection>

			<LegalSection id="content" title="6. User-Generated Content">
				<p>
					{siteConfig.name} may allow you to post ratings, reviews, diary entries, and other
					content. By submitting content, you grant {siteConfig.name} a worldwide,
					non-exclusive, royalty-free license to use, copy, reproduce, process, adapt,
					modify, publish, transmit, display, and distribute that content in connection with
					the Service.
				</p>
				<p>
					You represent that you own or have the necessary rights to submit the content and
					that it does not violate third-party intellectual property rights or applicable
					laws.
				</p>
			</LegalSection>

			<LegalSection id="third-party" title="7. Third-Party Services">
				<p>{siteConfig.name} uses third-party services to provide functionality, including:</p>
				<LegalList>
					<LegalListItem>TMDB for movie data and imagery</LegalListItem>
					<LegalListItem>Google for authentication and Gemini recommendations</LegalListItem>
					<LegalListItem>Infrastructure and monitoring providers</LegalListItem>
				</LegalList>
				<p>
					Your use of those services is subject to their respective terms and privacy
					policies. {siteConfig.name} is not responsible for third-party content or policies.
				</p>
			</LegalSection>

			<LegalSection id="conduct" title="8. Prohibited Conduct">
				<p>You agree not to:</p>
				<LegalList>
					<LegalListItem>Violate any applicable law or regulation</LegalListItem>
					<LegalListItem>Infringe on intellectual property rights</LegalListItem>
					<LegalListItem>
						Post abusive, harassing, defamatory, or obscene content
					</LegalListItem>
					<LegalListItem>Spam or flood the Service</LegalListItem>
					<LegalListItem>Attempt to gain unauthorized access to the Service</LegalListItem>
					<LegalListItem>
						Engage in automated data collection or scraping
					</LegalListItem>
					<LegalListItem>
						Interfere with or disrupt the integrity of the Service
					</LegalListItem>
				</LegalList>
			</LegalSection>

			<LegalSection id="termination" title="9. Termination">
				<p>
					{siteConfig.name} may terminate or suspend your account and access immediately,
					without prior notice, for any reason, including if you breach these Terms or if we
					reasonably believe you are in breach.
				</p>
			</LegalSection>

			<LegalSection id="law" title="10. Governing Law">
				<p>
					These terms are governed by and construed in accordance with the laws of the
					jurisdiction in which {siteConfig.name} is operated, and you irrevocably submit to
					the exclusive jurisdiction of the courts in that location.
				</p>
			</LegalSection>

			<LegalSection id="changes" title="11. Changes to Terms">
				<p>
					We may modify or replace these Terms at any time. If a revision is material, we
					will try to provide at least 30 days&apos; notice before new terms take effect.
					Continued use of {siteConfig.name} after revised Terms are posted means you accept
					the changes.
				</p>
			</LegalSection>

			<LegalSection id="contact" title="12. Contact Us">
				<p>
					Questions about these Terms? Reach us through the contact information on the
					Service, or email{" "}
					<a href="mailto:legal@frameo.app">legal@frameo.app</a>.
				</p>
			</LegalSection>
		</LegalDocument>
	)
}
