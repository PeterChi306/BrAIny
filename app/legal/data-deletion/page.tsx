import { LegalLayout } from '@/components/ui/LegalLayout'

export default function DataDeletion() {
    return (
        <LegalLayout
            title="Data Deletion Policy"
            lastUpdated="March 3, 2026"
            version="1.1"
        >
            <h3>1. Your Data, Your Choice</h3>
            <p>
                At brAIny, we believe you should have total control over your digital footprint. You have the right to request the permanent deletion of your account and all associated data at any time.
            </p>

            <h3>2. What Is Deleted</h3>
            <p>
                When you request account deletion, the following data is permanently purged from our active databases:
            </p>
            <ul>
                <li>Your user profile and credentials.</li>
                <li>Complete chat history across all modes.</li>
                <li>All scanned documents and extracted text.</li>
                <li>All learning progress, XP, and streak records.</li>
                <li>Notification settings and smart reminders.</li>
            </ul>

            <h3>3. How to Delete Your Account</h3>
            <p>
                The simplest way to delete your data is through the app:
                Navigate to <strong>Settings</strong> → <strong>Legal & Privacy</strong> → <strong>Delete My Account</strong>.
                You will be asked to confirm your intention before the process begins.
            </p>

            <h3>4. Process Time</h3>
            <p>
                Most data is deleted instantly upon confirmation. However, some data may persist in our secure backups for up to 30 days before being completely purged. This is a standard safety measure for data integrity.
            </p>

            <h3>5. Irreversibility</h3>
            <p>
                Please be aware that account deletion is <strong>permanent</strong>. Once completed, your data cannot be recovered even by our support team.
            </p>
        </LegalLayout>
    )
}
