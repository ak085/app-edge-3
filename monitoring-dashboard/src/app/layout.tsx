import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'BacPipes Monitoring Dashboard',
  description: 'Real-time monitoring for BacPipes TimescaleDB sensor data',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="bg-primary text-primary-foreground shadow-md">
            <div className="container mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold">BacPipes Monitoring Dashboard</h1>
              <p className="text-sm opacity-90">Real-time TimescaleDB Data Visualization</p>
            </div>
          </header>

          {/* Navigation */}
          <nav className="bg-secondary border-b">
            <div className="container mx-auto px-4">
              <ul className="flex space-x-6 py-3">
                <li>
                  <Link href="/" className="hover:text-primary font-medium">
                    Live Values
                  </Link>
                </li>
                <li>
                  <Link href="/trends" className="hover:text-primary font-medium">
                    Trends
                  </Link>
                </li>
                <li>
                  <Link href="/export" className="hover:text-primary font-medium">
                    Export CSV
                  </Link>
                </li>
                <li>
                  <Link href="/health" className="hover:text-primary font-medium">
                    Database Health
                  </Link>
                </li>
              </ul>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 container mx-auto px-4 py-6">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-muted text-muted-foreground text-sm py-4 mt-auto">
            <div className="container mx-auto px-4 text-center">
              BacPipes Monitoring Dashboard | Port 3002
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
