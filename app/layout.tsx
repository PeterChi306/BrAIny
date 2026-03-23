import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { UserTierProvider } from '@/contexts/UserTierContext'
import { AppTimeTrackerProvider } from '@/components/AppTimeTrackerProvider'
import { NotificationProvider } from '@/components/NotificationProvider'
import { AppSidebarLayout } from '@/components/AppSidebarLayout'

export const metadata: Metadata = {
  title: 'brAIny - AI-Powered Study Assistant',
  description: 'Your intelligent learning companion for middle and high school',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-background">
        <ThemeProvider>
          <UserTierProvider>
            <AppTimeTrackerProvider>
              <NotificationProvider>
                <AppSidebarLayout>
                  {children}
                </AppSidebarLayout>
              </NotificationProvider>
            </AppTimeTrackerProvider>
          </UserTierProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

