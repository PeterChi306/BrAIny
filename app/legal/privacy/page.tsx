import { LegalLayout } from '@/components/ui/LegalLayout'

export default function PrivacyPolicy() {
    return (
        <LegalLayout
            title="Privacy Policy"
            lastUpdated="March 3, 2026"
            version="1.1"
        >
            <h3>1. Introduction</h3>
            <p>
                Your privacy is critically important to us. At brAIny, we have a few fundamental principles:
                We don’t ask you for personal information unless we truly need it. We don’t share your personal information with anyone except to comply with the law, develop our products, or protect our rights.
            </p>

            <h3>2. Information We Collect</h3>
            <p>
                As you use brAIny, we collect certain information to provide a personalized tutoring experience:
            </p>
            <ul>
                <li><strong>Account Information:</strong> Email, display name, and grade level.</li>
                <li><strong>Interaction Data:</strong> The content of your chats with the AI tutor, which helps us provide continuity.</li>
                <li><strong>Scan Data:</strong> Images and text extracted from documents you scan to help generate explanations.</li>
                <li><strong>Usage Analytics:</strong> Anonymous data about how you navigate the app to improve user experience.</li>
            </ul>

            <h3>3. How We Use Information</h3>
            <p>
                We use the collected information for the following purposes:
            </p>
            <ul>
                <li>To provide and maintain our Service, including to monitor the usage of our Service.</li>
                <li>To manage Your Account: your registration as a user of the Service.</li>
                <li>To personalize Your Tutoring: using your learning history to provide better explanations.</li>
                <li>To contact You: By email or other equivalent forms of electronic communication.</li>
            </ul>

            <h3>4. AI Data Processing</h3>
            <p>
                BrAIny uses advanced AI models to process your requests. While we use industry-standard encryption, please avoid sharing sensitive personal information (like passwords or financial data) within the chat interface.
            </p>

            <h3>5. Data Retention</h3>
            <p>
                We will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. You can request deletion of your data at any time through the Settings menu.
            </p>

            <h3>6. Security of Your Personal Data</h3>
            <p>
                The security of Your Personal Data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure.
            </p>

            <h3>7. Children's Privacy</h3>
            <p>
                We do not knowingly collect personally identifiable information from anyone under the age of 13. If You are a parent or guardian and You are aware that Your child has provided Us with Personal Data, please contact Us.
            </p>
        </LegalLayout>
    )
}
