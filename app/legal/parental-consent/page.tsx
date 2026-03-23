import { LegalLayout } from '@/components/ui/LegalLayout'

export default function ParentalConsent() {
    return (
        <LegalLayout
            title="Parental Consent Info"
            lastUpdated="March 3, 2026"
            version="1.1"
        >
            <h3>1. Our Commitment to Safety</h3>
            <p>
                brAIny is committed to providing a safe and productive learning environment for all students. We take the privacy and safety of younger users very seriously.
            </p>

            <h3>2. Age Requirement</h3>
            <p>
                Currently, brAIny is intended for use by individuals who are <strong>at least 13 years of age</strong>. We do not knowingly collect personal information from children under 13 without verifiable parental consent.
            </p>

            <h3>3. Why the Age Limit?</h3>
            <p>
                The Children's Online Privacy Protection Act (COPPA) requires specific protections for children under 13. To maintain a streamlined experience while ensuring total compliance, we currently restrict account creation to those 13 and older.
            </p>

            <h3>4. Guidance for Parents</h3>
            <p>
                We encourage parents and guardians to spend time online with their children to witness the educational benefits of AI while maintaining supervision of their digital activities.
            </p>

            <h3>5. Requesting Deletion</h3>
            <p>
                If you believe that your child under 13 has created an account on brAIny without your consent, please contact us immediately at support@brainy.ai. We will take steps to verify the situation and permanently delete the account and all associated data.
            </p>
        </LegalLayout>
    )
}
