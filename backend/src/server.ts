import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { initRealtime } from './socket/realtime.js';
import competitorRoutes from './routes/competitorRoutes.js';
import articleRoutes from './routes/articleRoutes.js';
import monitoringRoutes from './routes/monitoringRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import scaleTestRoutes from './routes/scaleTestRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import demoBlogRoutes from './routes/demoBlogRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import { monitoringEngine } from './services/monitoringEngine.js';
import { seedDatabaseIfEmpty } from './database/seed.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize WebSockets
initRealtime(server);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Internal Demo Blog (Accessible directly in browser)
app.use('/demo-blog', demoBlogRoutes);

// REST API Endpoints
app.use('/api/competitors', competitorRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/scale-test', scaleTestRoutes);
app.use('/api/system-health', healthRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/demo', demoBlogRoutes);
app.use('/api/searches', searchRoutes);

// Root greeting / API health check
app.get('/api', (req, res) => {
  res.json({
    name: 'Competitor Blog Spy Engine API',
    status: 'ONLINE',
    version: '1.0.0',
    demoBlog: '/demo-blog',
    endpoints: {
      competitors: '/api/competitors',
      articles: '/api/articles',
      monitoring: '/api/monitoring/status',
      analytics: '/api/analytics',
      scaleTest: '/api/scale-test/status',
      systemHealth: '/api/system-health',
      notifications: '/api/notifications'
    }
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, async () => {
  console.log(`================================================================`);
  console.log(`🚀 Competitor Blog Spy Engine running on http://localhost:${PORT}`);
  console.log(`📰 Internal Demo Blog running on http://localhost:${PORT}/demo-blog`);
  console.log(`⚡ WebSocket Stream ready for real-time dashboard events`);
  console.log(`================================================================`);

  // Seed default data if database is fresh
  try {
    await seedDatabaseIfEmpty(`http://localhost:${PORT}`);
  } catch (err) {
    console.error('Seed verification error:', err);
  }

  // Start continuous monitoring engine (default 60s cycle)
  monitoringEngine.startContinuousMonitoring(60000);
});

export default app;
