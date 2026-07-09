const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');
const matchService = require('./services/matchService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// الوسيطة الأساسية
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// حماية السيرفر من الطلبات الكثيرة
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { نجاح: false, رسالة: 'عدد الطلبات كبير جداً، يرجى المحاولة مرة أخرى لاحقاً.' }
});
app.use('/api/', limiter);

// تشغيل الملفات الثابتة
app.use(express.static(path.join(__dirname)));

// الاتصال بقاعدة البيانات
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/football_ai';
require('./db').connect(MONGODB_URI)
    .then(() => console.log('✅ تم الاتصال بـ MongoDB'))
    .catch(err => console.error('❌ خطأ في MongoDB:', err.message));

// المسارات الأساسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'matches.html'));
});

app.get('/matches', (req, res) => {
    res.sendFile(path.join(__dirname, 'matches.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// مسار للتأكد من أن السيرفر يعمل
app.get('/api/health', (req, res) => {
    res.json({
        نجاح: true,
        حالة: 'نعم',
        الطابع_الزمني: new Date().toISOString(),
        إصدار: '1.0.0'
    });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api/admin', require('./routes/admin'));

// 404
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ نجاح: false, رسالة: 'نقطة النهاية غير موجودة' });
    } else {
        res.status(404).sendFile(path.join(__dirname, '404.html'));
    }
});

// معالج الأخطاء
app.use((err, req, res, next) => {
    console.error('خطأ:', err);
    if (req.path.startsWith('/api/')) {
        res.status(500).json({ نجاح: false, رسالة: 'خطأ في الخادم الداخلي' });
    } else {
        res.status(500).send('حدث خطأ ما');
    }
});

// Cron job - جلب المباريات يومياً الساعة 5 صباحاً
cron.schedule('0 5 * * *', async () => {
    try {
        console.log('🔄 جاري جلب المباريات اليومية...');
        await matchService.fetchAndSaveMatches();
        console.log('✅ تم جلب وحفظ المباريات بنجاح');
    } catch (error) {
        console.error('❌ خطأ في جلب المباريات:', error.message);
    }
});

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`🚀 خادم الذكاء الاصطناعي لكرة القدم يعمل على المنفذ ${PORT}`);
    console.log(`📍 البيئة: ${process.env.NODE_ENV || 'تطوير'}`);
});
    
