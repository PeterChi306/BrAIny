import { LegalLayout } from '@/components/ui/LegalLayout'

export default function TermsOfService() {
    return (
        <LegalLayout
            title="Terms of Service"
            lastUpdated="March 3, 2026"
            version="1.1"
        >
            <h3>1. Acceptance of Terms</h3>
            <p>
                By accessing or using the brAIny application, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
            </p>

            <h3>2. Eligibility</h3>
            <p>
                You must be at least 13 years of age to use this application. By creating an account, you represent and warrant that you meet this age requirement.
            </p>

            <h3>3. User Accounts</h3>
            <p>
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
            </p>

            <h3>4. Proper Use</h3>
            <p>
                brAIny is designed as an educational tool. Users are expected to use the AI tutor to enhance their understanding, not to facilitate academic dishonesty or cheating.
            </p>

            <h3>5. Intellectual Property</h3>
            <p>
                The Service and its original content, features, and functionality are and will remain the exclusive property of brAIny and its licensors.
            </p>

            <h3>6. Limitation of Liability</h3>
            <p>
                In no event shall brAIny, nor its directors, employees, or partners, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, or other intangible losses.
            </p>

            <h3>7. Termination</h3>
            <p>
                We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>

            <h3>8. Changes</h3>
            <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide at least 30 days' notice before any new terms take effect.
            </p>
        </LegalLayout>
    )
}
