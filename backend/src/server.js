const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const redis = require('redis');
const winston = require('winston');
const promClient = require('prom-client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Prometheus metrics
const register = new promClient.Registry();
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});
const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestCounter);

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'url-shortener-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging and metrics middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    };
    
    httpRequestDuration.observe(labels, duration);
    httpRequestCounter.inc(labels);
    
    logger.info('Request processed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}s`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongo:27017/urlshortener', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => logger.info('Connected to MongoDB'))
.catch(err => logger.error('MongoDB connection error:', err));

// Redis connection
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379'
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.connect();

// URL Schema
const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortCode: { type: String, required: true, unique: true },
  clicks: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, default: 'anonymous' },
  lastAccessed: { type: Date },
  isActive: { type: Boolean, default: true }
});

const Url = mongoose.model('Url', urlSchema);

// Routes
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redisClient.isOpen ? 'connected' : 'disconnected'
    }
  });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Create short URL
app.post('/api/shorten', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // URL validation
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(url)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Check cache first
    const cached = await redisClient.get(`url:${url}`);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Check if URL already exists
    let existingUrl = await Url.findOne({ originalUrl: url });
    if (existingUrl) {
      const result = {
        originalUrl: existingUrl.originalUrl,
        shortUrl: `${req.protocol}://${req.get('host')}/api/redirect/${existingUrl.shortCode}`,
        shortCode: existingUrl.shortCode,
        clicks: existingUrl.clicks
      };
      
      // Cache for 1 hour
      await redisClient.setEx(`url:${url}`, 3600, JSON.stringify(result));
      return res.json(result);
    }

    // Generate short code
    const shortCode = require('shortid').generate();
    
    // Create new URL
    const newUrl = new Url({
      originalUrl: url,
      shortCode: shortCode,
      createdBy: req.ip
    });

    await newUrl.save();

    const result = {
      originalUrl: newUrl.originalUrl,
      shortUrl: `${req.protocol}://${req.get('host')}/api/redirect/${newUrl.shortCode}`,
      shortCode: newUrl.shortCode,
      clicks: newUrl.clicks
    };

    // Cache for 1 hour
    await redisClient.setEx(`url:${url}`, 3600, JSON.stringify(result));

    logger.info('URL shortened', { originalUrl: url, shortCode: shortCode });
    res.status(201).json(result);

  } catch (error) {
    logger.error('Error shortening URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Redirect to original URL
app.get('/api/redirect/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;

    // Check cache first
    const cached = await redisClient.get(`redirect:${shortCode}`);
    if (cached) {
      const url = await Url.findOneAndUpdate(
        { shortCode: shortCode },
        { 
          $inc: { clicks: 1 },
          lastAccessed: new Date()
        }
      );
      
      logger.info('URL redirected (cached)', { shortCode: shortCode, originalUrl: cached });
      return res.redirect(cached);
    }

    const url = await Url.findOneAndUpdate(
      { shortCode: shortCode, isActive: true },
      { 
        $inc: { clicks: 1 },
        lastAccessed: new Date()
      },
      { new: true }
    );

    if (!url) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    // Cache original URL for 1 hour
    await redisClient.setEx(`redirect:${shortCode}`, 3600, url.originalUrl);

    logger.info('URL redirected', { shortCode: shortCode, originalUrl: url.originalUrl });
    res.redirect(url.originalUrl);

  } catch (error) {
    logger.error('Error redirecting URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get URL statistics
app.get('/api/stats/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    const url = await Url.findOne({ shortCode: shortCode });
    
    if (!url) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    res.json({
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      clicks: url.clicks,
      createdAt: url.createdAt,
      lastAccessed: url.lastAccessed,
      isActive: url.isActive
    });

  } catch (error) {
    logger.error('Error getting URL stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all URLs with pagination
app.get('/api/urls', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const urls = await Url.find({ isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Url.countDocuments({ isActive: true });

    res.json({
      urls: urls,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUrls: total
    });

  } catch (error) {
    logger.error('Error getting URLs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  mongoose.connection.close();
  redisClient.quit();
  process.exit(0);
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
