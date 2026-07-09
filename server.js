const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware الأساسي للأمان والأداء
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// حماية السيرفر من الطلبات الكثيرة
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

// تشغيل الملفات الثابتة (الصور، التنسيقات، وغيرها)
app.use(express.static(path.join(__dirname, 'public')));

// الاتصال بقاعدة البيانات
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/football_ai';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err.message));

// المسارات الأساسية لعرض الواجهات
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'matches.html'));
});

app.get('/matches', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'matches.html'));
});

// مسار للتأكد من أن السيرفر يعمل (Health Check)
app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'OK' });
});

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
