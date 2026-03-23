'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { BottomNavigation } from '@/components/BottomNavigation'

interface LegalLayoutProps {
    title: string
    lastUpdated: string
    version: string
    children: React.ReactNode
}

export function LegalLayout({ title, lastUpdated, version, children }: LegalLayoutProps) {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 pb-24 transition-colors duration-300">
            {/* Premium Sticky Header */}
            <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                        </button>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                            {title}
                        </h1>
                    </div>
                    <div className="hidden sm:block text-right">
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-500 font-bold">
                            Legal Document
                        </p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-6 py-12">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 sm:p-12 shadow-sm">
                    <div className="mb-10 pb-8 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
                            Official Policy
                        </p>
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                            {title}
                        </h2>
                        <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-400 dark:text-gray-500">
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                                Last Updated: {lastUpdated}
                            </span>
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                                Version: {version}
                            </span>
                        </div>
                    </div>

                    <article className="prose prose-slate dark:prose-invert max-w-none 
            prose-h3:text-lg prose-h3:font-bold prose-h3:text-gray-900 dark:prose-h3:text-white prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-gray-600 dark:prose-p:text-gray-400 prose-p:leading-relaxed prose-p:mb-6
            prose-ul:text-gray-600 dark:prose-ul:text-gray-400 prose-li:mb-2 text-sm sm:text-base">
                        {children}
                    </article>

                    <div className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-800 text-center">
                        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                            End of document. By using brAIny, you acknowledge and agree to the terms stated above.
                        </p>
                    </div>
                </div>
            </main>

            <BottomNavigation />
        </div>
    )
}
