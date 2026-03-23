import { LegalLayout } from '@/components/ui/LegalLayout'

export default function CookiePolicy() {
    return (
        <LegalLayout
            title="Cookie Policy"
            lastUpdated="March 3, 2026"
            version="1.1"
        >
            <h3>1. What are Cookies?</h3>
            <p>
                Cookies are small text files that are placed on your device's browser when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site.
            </p>

            <h3>2. Essential Cookies</h3>
            <p>
                These cookies are strictly necessary to provide you with services available through our app and to use some of its features, such as access to secure areas.
            </p>

            <h3>3. Analytical and Performance Cookies</h3>
            <p>
                We use anonymous analytics cookies to help us understand how users interact with brAIny. This allow us to measure and improve the performance of our app.
            </p>

            <h3>4. Managing Cookies</h3>
            <p>
                Most web browsers allow some control of most cookies through the browser settings. However, if you choose to block essential cookies, the Service may not function correctly.
            </p>

            <h3>5. Third-Party Cookies</h3>
            <p>
                brAIny uses services like Supabase for authentication and session management, which may set their own cookies to ensure secure sign-ins.
            </p>
        </LegalLayout>
    )
}
