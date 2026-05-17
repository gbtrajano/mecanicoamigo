// This must be at the very top - force dynamic rendering
export const dynamic = 'force-dynamic';

import DashboardClient from './dashboard-client';

export default function DashboardPage() {
  return <DashboardClient />;
}