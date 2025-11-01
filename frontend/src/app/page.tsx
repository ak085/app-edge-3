import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">BacPipes</h1>
          <p className="text-sm text-muted-foreground">BACnet to MQTT Pipeline</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Card */}
          <div className="card bg-card p-8 rounded-lg">
            <h2 className="text-3xl font-bold mb-4">Hello BacPipes! 🎯</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Welcome to BacPipes - Your BACnet to MQTT data pipeline.
            </p>

            {/* Status */}
            <div className="bg-secondary p-4 rounded-md mb-6">
              <h3 className="font-semibold mb-2">✅ Milestone 1: Foundation Complete</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Docker Compose configured (postgres, frontend, worker)</li>
                <li>Next.js 15 + Tailwind CSS v4 + Shadcn/ui</li>
                <li>PostgreSQL database ready</li>
                <li>Prisma ORM with complete schema</li>
                <li>Web UI accessible</li>
              </ul>
            </div>

            {/* Navigation Menu */}
            <div className="border-t border-border pt-6">
              <h3 className="font-semibold mb-4">Navigation (Coming in Future Milestones)</h3>
              <nav className="grid grid-cols-2 gap-4">
                <NavCard
                  title="Discovery"
                  description="Scan BACnet network and discover devices"
                  href="/discovery"
                  milestone="M2"
                  disabled
                />
                <NavCard
                  title="Points"
                  description="Configure and tag discovered points"
                  href="/points"
                  milestone="M3"
                  disabled
                />
                <NavCard
                  title="Monitoring"
                  description="Real-time MQTT publishing dashboard"
                  href="/monitoring"
                  milestone="M5"
                  disabled
                />
                <NavCard
                  title="Settings"
                  description="Configure MQTT, InfluxDB, and system"
                  href="/settings"
                  milestone="M7"
                  disabled
                />
              </nav>
            </div>

            {/* System Info */}
            <div className="mt-8 p-4 bg-muted rounded-md">
              <h4 className="font-semibold text-sm mb-2">System Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div><span className="font-medium">Database:</span> PostgreSQL (port 5434)</div>
                <div><span className="font-medium">MQTT Broker:</span> 10.0.60.50:1883</div>
                <div><span className="font-medium">InfluxDB:</span> 10.0.60.5:8086</div>
                <div><span className="font-medium">Timezone:</span> Asia/Kuala_Lumpur</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

interface NavCardProps {
  title: string;
  description: string;
  href: string;
  milestone: string;
  disabled?: boolean;
}

function NavCard({ title, description, href, milestone, disabled }: NavCardProps) {
  const content = (
    <div className={`card bg-card p-4 rounded-md border-2 ${
      disabled
        ? 'opacity-50 cursor-not-allowed'
        : 'hover:border-primary hover:shadow-lg transition-all cursor-pointer'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold">{title}</h4>
        <span className="text-xs bg-muted px-2 py-1 rounded">{milestone}</span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );

  if (disabled) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}
