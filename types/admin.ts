/**
 * Types pour le dashboard d'administration
 */

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalMerchants: number;
  pendingMerchants: number;
  verifiedMerchants: number;
  totalOffers: number;
  activeOffers: number;
  totalRevenue: number;
  totalOrders: number;
  todayUsers: number;
  todayOrders: number;
  todayRevenue: number;
  merchantsWithSvgLogos: number;
  merchantsWithSvgBanners: number;
  totalReferrals: number;
  activeReferralCodes: number;
  totalReferralRewards: number;
  todayReferrals: number;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'user' | 'merchant' | 'admin';
  createdAt: string;
  lastActive?: string;
  isBanned: boolean;
  totalOrders: number;
  totalSpent: number;
}

export interface AdminMerchant {
  id: string;
  name: string;
  email: string;
  category: string;
  address: string;
  city: string;
  phone?: string;
  isVerified: boolean;
  status: 'pending' | 'active' | 'suspended';
  totalOffers: number;
  totalOrders: number;
  rating: number;
  createdAt: string;
  logoUrl?: string;
  bannerUrl?: string;
  hasSvgLogo: boolean;
  hasSvgBanner: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high';
  targetAudience: 'all' | 'users' | 'merchants';
  imageUrl?: string;
  actionLabel?: string;
  actionUrl?: string;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  createdAt: string;
  createdBy: string;
  readBy: string[];
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedContentType: 'message' | 'user' | 'merchant' | 'offer';
  reportedContentId: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  moderatorNotes?: string;
}

export interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'failed_login' | 'suspicious_activity' | 'data_access' | 'permission_change';
  userId?: string;
  userEmail?: string;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface CacheMetrics {
  totalKeys: number;
  memoryUsage: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  averageAccessTime: number;
  topKeys: Array<{
    key: string;
    hits: number;
    size: number;
  }>;
}

export interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'critical';
  message: string;
  stack?: string;
  userId?: string;
  path: string;
  method: string;
  statusCode?: number;
  metadata?: Record<string, any>;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  message: string;
  category: 'technical' | 'account' | 'payment' | 'merchant' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  responses: Array<{
    id: string;
    message: string;
    isAdmin: boolean;
    createdAt: string;
    createdBy: string;
  }>;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  views: number;
}

export interface MessagingMetrics {
  totalMessages: number;
  todayMessages: number;
  activeConversations: number;
  averageResponseTime: number;
  messagesPerUser: number;
  messagesPerMerchant: number;
  topActiveUsers: Array<{
    userId: string;
    userName: string;
    messageCount: number;
  }>;
  topActiveMerchants: Array<{
    merchantId: string;
    merchantName: string;
    messageCount: number;
  }>;
}

export interface ThemeCustomization {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  fontFamily: string;
}

export interface ChatBackground {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  category: 'gradient' | 'pattern' | 'image' | 'custom';
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface AdminSession {
  id: string;
  adminId: string;
  adminEmail: string;
  startTime: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export interface AdminAccessLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  resource: string;
  timestamp: string;
  ipAddress: string;
  success: boolean;
  details?: Record<string, any>;
}

export interface ReferralSettings {
  enabled: boolean;
  referrerReward: number;
  refereeReward: number;
  maxReferrals: number;
  expirationDays: number;
  minimumOrderValue: number;
}

