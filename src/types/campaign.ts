export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  platform: 'Google' | 'Meta' | 'LinkedIn' | 'Twitter';
  impressions: number;
  clicks: number;
  conversions: number;
  lastUpdated: string;
}

export interface DashboardStats {
  totalBudget: number;
  totalSpent: number;
  activeCampaigns: number;
  totalConversions: number;
  averageCPA: number;
  roi: number;
}
