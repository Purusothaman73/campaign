export type Platform = 'Meta' | 'Google' | 'YouTube' | 'LinkedIn' | 'WhatsApp';
export type CampaignStatus = 'Active' | 'Paused' | 'Completed' | 'Recharge Needed';
export type Priority = 'High' | 'Medium' | 'Low';
export type UserRole = 'Admin' | 'Team Member';

export interface User {
  id: string;
  name: string;
  email?: string;
  mobile: string;
  password?: string;
  location?: string; // Office Location
  color?: string; // Hex code for color-coding team members
  role: UserRole;
  avatar?: string;
}

export interface SpendEntry {
  id: string;
  campaignId: string;
  date: string;
  amount: number; // This is "Spend" (Mandatory for all)
  enteredBy: string;
  revisions?: {
    updatedBy: string;
    updatedAt: string;
    note?: string;
  }[];
  note?: string; // This is "Additional Notes"
  metrics?: {
    // Platform Metrics
    views?: number;
    clicks?: number;
    impressions?: number;
    leads?: number;
    messages?: number;
    purchases?: number;
    conversions?: number;
    reach?: number;
    revenue?: number;
    
    // Efficiency Metrics
    cpa?: number;
    cpl?: number;
    cpc?: number;
    cpm?: number;
    ctr?: number;
    frequency?: number;
    viewRate?: number;
    watchTime?: number;
    cpv?: number;
    avgCpc?: number;
    costPerConversion?: number;
    
    // Text Metrics
    topKeywords?: string;
    jobTitles?: string;
    industries?: string;
    subscribers?: number;
    conversationsStarted?: number;
    replies?: number;
    qualifiedLeads?: number;

    // Flexible Custom Metrics
    customMetrics?: {
      label: string;
      value: string | number;
    }[];
  };
}


export interface Campaign {
  id: string;
  clientName: string;
  brandName: string;
  platform: Platform;
  campaignName: string;
  objective: string;
  createdBy: string;
  assignedTo: string; // User ID
  startDate: string;
  endDate: string;
  isEvergreen: boolean; // For perpetual campaigns like Google Ads
  gstType: 'Inclusive' | 'Exclusive';
  paymentStatus: 'Paid' | 'Pending';
  adminAcknowledged: boolean;
  paymentMode?: string;
  paymentDate?: string;
  totalBudget: number;
  dailyBudgetLimit: number;
  status: CampaignStatus;
  priority: Priority;
  notes: string;
  lastUpdatedBy: string;
  lastUpdatedDate: string;
  topupRequired: boolean;
  revisions?: {
    updatedBy: string;
    updatedAt: string;
    changes: string;
  }[];
}

export interface CampaignWithCalculations extends Campaign {
  netBudget: number;
  totalSpent: number;
  remainingBalance: number;
  remainingDays: number;
  pacing: number; 
  runwayDays: number; 
  budgetHorizon: number; 
  burnRate: number; 
  totalRevenue: number;
  roas: number;
  isPendingUpdate: boolean;
}
