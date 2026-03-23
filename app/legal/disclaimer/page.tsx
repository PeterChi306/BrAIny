import { LegalLayout } from '@/components/ui/LegalLayout'

export default function EducationalDisclaimer() {
    return (
        <LegalLayout
            title="Educational Disclaimer"
            lastUpdated="March 3, 2026"
            version="1.1"
        >
            <h3>1. AI-Generated Content</h3>
            <p>
                brAIny uses Artificial Intelligence to generate explanations, quizzes, and summaries. While our models are trained on educational data, AI can occasionally "hallucinate" or provide inaccurate information.
            </p>

            <h3>2. Not a Professional Advice</h3>
            <p>
                The information provided by brAIny is for educational and general informational purposes only. It is not intended as professional advice in fields like medicine, law, or engineering.
            </p>

            <h3>3. Independent Verification</h3>
            <p>
                Users are strongly encouraged to verify important facts with official textbooks, qualified teachers, or primary sources. brAIny is meant to supplement, not replace, traditional learning materials.
            </p>

            <h3>4. No Guarantee of Results</h3>
            <p>
                While brAIny aims to help you understand concepts faster, we do not guarantee specific academic results, test scores, or grades. Learning remains a human effort.
            </p>

            <h3>5. External Links</h3>
            <p>
                Our Service may contain links to third-party web sites or services that are not owned or controlled by brAIny. We assume no responsibility for the content or practices of any third-party sites.
            </p>
        </LegalLayout>
    )
}
