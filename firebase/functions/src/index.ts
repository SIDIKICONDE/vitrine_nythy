import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import helmet from 'helmet';

// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Import routes
import { paymentRoutes } from './routes/payment.routes';
import { webhookRoutes } from './routes/webhook.routes';

// Initialize Firebase Admin (only if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

// Create Express app
const app = express();

// Security middleware
app.disable('x-powered-by');
app.use(helmet());

// CORS restreint par origine
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
// Monter d'abord le webhook (utilise express.raw et doit passer avant le json parser)
app.use('/api/v1/webhooks', webhookRoutes);

// Parser JSON pour les autres routes
app.use(express.json({ limit: '100kb' }));

// Rate limiting pour les paiements
const paymentsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use('/api/v1/payments', paymentsLimiter, paymentRoutes);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Export as Firebase Function
export const api = onRequest(
  {
    region: 'europe-west1' // Région France
  },
  app
);

// ===================================
// GAMIFICATION CLOUD FUNCTIONS
// ===================================

// Battles - Callable Functions
export { acceptBattle } from "./gamification/battles/acceptBattle";
export { cancelBattle } from "./gamification/battles/cancelBattle";
export { completeBattle } from "./gamification/battles/completeBattle";
export { createBattle } from "./gamification/battles/createBattle";
export { declineBattle } from "./gamification/battles/declineBattle";
export { updateBattleScore } from "./gamification/battles/updateScore";

// Battles - Triggers & Scheduled
export { checkExpiredBattles } from "./gamification/battles/checkExpiredBattles";
export { onBattleComplete } from "./gamification/battles/onBattleComplete";

// Tournaments - Callable Functions
export { createTournament } from "./gamification/tournaments/createTournament";

// Rewards - Callable Functions
export { claimReward } from "./gamification/rewards/claimReward";

// Tournaments - Triggers & Scheduled
export { advanceTournamentPhase, checkRegistrationDeadlines } from "./gamification/tournaments/advanceTournamentPhase";
export { distributePrizes } from "./gamification/tournaments/distributePrizes";

// Analytics - Triggers & Scheduled
export { trackLeagueEngagement } from "./gamification/analytics/trackLeagueEngagement";
export { trackTournamentPopularity } from "./gamification/analytics/trackTournamentPopularity";
export { trackTournamentRegistration } from "./gamification/analytics/trackTournamentRegistration";
export { cleanupActiveBoosts } from "./gamification/maintenance/cleanupActiveBoosts";

// Leaderboard - Scheduled Functions (Distribution automatique des récompenses)
export {
  distributeLeaderboardRewards, distributeMonthlyLeaderboardRewards, distributeWeeklyLeaderboardRewards
} from "./gamification/leaderboard/distributeLeaderboardRewards";

// ===================================
// COMMUNITY FUNCTIONS (JavaScript)
// ===================================
// Import all exports from community.js
const communityModule = require('../community.js');
export const createPost = communityModule.createPost;
export const updatePost = communityModule.updatePost;
export const deletePost = communityModule.deletePost;
export const pinPost = communityModule.pinPost;
export const repostPost = communityModule.repostPost;
export const incrementPostViews = communityModule.incrementPostViews;
export const incrementPostShares = communityModule.incrementPostShares;
export const createComment = communityModule.createComment;
export const deleteComment = communityModule.deleteComment;
export const addReaction = communityModule.addReaction;
export const removeReaction = communityModule.removeReaction;
export const enqueueNotification = communityModule.enqueueNotification;
export const markNotificationRead = communityModule.markNotificationRead;
export const markAllNotificationsRead = communityModule.markAllNotificationsRead;
export const deleteNotification = communityModule.deleteNotification;
export const processNotificationRequests = communityModule.processNotificationRequests;
export const onReactionWrite = communityModule.onReactionWrite;
export const onCommentWrite = communityModule.onCommentWrite;
export const onPostDelete = communityModule.onPostDelete;
export const onFollowWrite = communityModule.onFollowWrite;

// ===================================
// MESSAGING FUNCTIONS
// ===================================
export { syncMessageCount } from './messaging/syncMessageCount';
export { onConversationDeleted, onConversationRead, onMessageCreated } from './messaging/updateUnreadCounters';

// ===================================
// REPORTS & MODERATION FUNCTIONS
// ===================================
export { onReportCreated } from './reports/onReportCreated';

