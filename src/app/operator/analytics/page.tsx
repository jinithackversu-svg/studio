
'use client';

import { AnalyticsDashboard } from "@/components/operator/analytics-dashboard";

export default function AnalyticsPage() {
    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                <p className="text-muted-foreground">View real-time analytics for today's orders and earnings.</p>
            </div>
            <AnalyticsDashboard />
        </div>
    )
}
