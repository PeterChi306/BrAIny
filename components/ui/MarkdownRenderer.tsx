'use client'

import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { cn } from '@/lib/utils'

// AI Response Polishing Function
function polishAIResponse(content: string): string {
  // Simple cleanup without breaking words
  let polished = content
    // Remove excessive newlines (more than 2)
    .replace(/\n{3,}/g, '\n\n')
    // Add spacing before headings (except first)
    .replace(/([^\n\r])(#{1,6})/g, '$1\n\n$2')
    // Clean up bullet points
    .replace(/^\*\s+/gm, '• ')
    .replace(/^\-\s+/gm, '• ')
    // Add spacing around horizontal rules
    .replace(/---/g, '\n---\n')
    // Clean up extra spaces at line ends
    .replace(/[ \t]+$/gm, '')
    .trim()
  
  return polished
}

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Polish the content before rendering
  const polishedContent = useMemo(() => polishAIResponse(content), [content])
  
  return (
    <div className={cn(
      // Base prose styling
      'prose prose-base max-w-none',
      'prose-gray dark:prose-invert',
      
      // Enhanced typography hierarchy
      'prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground',
      'prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-0 prose-h1:font-bold',
      'prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-6 prose-h2:font-semibold',
      'prose-h3:text-lg prose-h3:mb-3 prose-h3:mt-5 prose-h3:font-medium',
      'prose-h4:text-base prose-h4:mb-2 prose-h4:mt-4 prose-h4:font-medium',
      
      // Improved paragraph spacing and readability
      'prose-p:my-3 prose-p:leading-relaxed prose-p:text-foreground',
      'first:prose-p:mt-0 last:prose-p:mb-0',
      
      // Enhanced list styling
      'prose-ul:my-3 prose-ol:my-3',
      'prose-ul:space-y-2 prose-ol:space-y-2',
      'prose-li:my-1 prose-li:leading-relaxed prose-li:text-foreground',
      'prose-li:marker:text-blue-500 dark:prose-li:marker:text-blue-400',
      
      // Code styling
      'prose-code:bg-surface/80 dark:prose-code:bg-surface/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-mono prose-code:text-foreground',
      'prose-pre:bg-surface dark:prose-pre:bg-surface prose-pre:border prose-pre:border-border prose-pre:p-4 prose-pre:rounded-xl prose-pre:overflow-x-auto prose-pre:my-4',
      
      // Blockquote styling
      'prose-blockquote:border-l-3 prose-blockquote:border-blue-500 dark:prose-blockquote:border-blue-400 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-foreground/80 prose-blockquote:my-4',
      
      // Strong = important, blue accent
      'prose-strong:font-semibold prose-strong:text-blue-600 dark:prose-strong:text-blue-400',
      'prose-em:italic',
      'prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium',
      
      // Table styling
      'prose-table:text-sm prose-table:my-4',
      'prose-th:border prose-th:border-border prose-th:px-4 prose-th:py-3 prose-th:bg-surface/50 dark:prose-th:bg-surface/30 font-semibold',
      'prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-3',
      
      // Divider
      'prose-hr:border-border prose-hr:my-6',
      
      className
    )}>
      <div className="prose-content">
        <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Enhanced paragraph with proper text flow
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-foreground first:mt-0 last:mb-0 break-words">
              {children}
            </p>
          ),
          
          // Enhanced list components with proper spacing
          ul: ({ children }) => (
            <ul className="mb-4 pl-6 space-y-2 last:mb-0 list-disc marker:text-blue-500 dark:marker:text-blue-400">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 pl-6 space-y-2 last:mb-0 list-decimal marker:text-blue-500 dark:marker:text-blue-400">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed text-foreground ml-2">
              {children}
            </li>
          ),
          
          // Headings in blue for titles/important; body stays default
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-4 mt-0 text-blue-600 dark:text-blue-400 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mb-3 mt-6 text-blue-600 dark:text-blue-400">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mb-3 mt-5 text-blue-600 dark:text-blue-400">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold mb-2 mt-4 text-blue-600 dark:text-blue-400">
              {children}
            </h4>
          ),
          
          // Enhanced code block with better isolation
          code: ({ children, className, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !className && !match
            
            if (isInline) {
              return (
                <code className="bg-surface/80 dark:bg-surface/60 px-1.5 py-0.5 rounded-md text-sm font-mono text-foreground" {...props}>
                  {children}
                </code>
              )
            }
            return (
              <pre className="bg-surface dark:bg-surface border border-border p-4 rounded-xl overflow-x-auto my-4">
                <code className={`block text-sm font-mono text-foreground ${className || ''}`} {...props}>
                  {children}
                </code>
              </pre>
            )
          },
          
          // Enhanced blockquote with modern styling
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-blue-500 dark:border-blue-400 pl-4 italic my-4 text-foreground/80 bg-surface/30 dark:bg-surface/20 py-2 px-4 rounded-r-lg">
              {children}
            </blockquote>
          ),
          
          // Enhanced link styling
          a: ({ href, children }) => (
            <a 
              href={href} 
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          
          // Enhanced table styling
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-border rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border px-4 py-3 bg-surface/50 dark:bg-surface/30 font-semibold text-left text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-4 py-3 text-foreground">
              {children}
            </td>
          ),
        }}
      >
        {polishedContent}
      </ReactMarkdown>
      </div>
    </div>
  )
}