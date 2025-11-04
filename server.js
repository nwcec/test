// server.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(require('cors')());

// خدمة الملفات الثابتة (للواجهة)
app.use(express.static('public'));

// صفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API الأساسي - معدّل للعمل على Railway
app.get('/api/base-address', async (req, res) => {
    const libraryName = req.query.lib || 'libUE4.so';
    
    console.log(`🔍 البحث عن المكتبة: ${libraryName}`);
    
    try {
        // على Railway، سنستخدم طريقة بديلة لمحاكاة السلوك
        const result = await simulateBaseAddress(libraryName);
        
        res.json({
            success: true,
            library: libraryName,
            baseAddress: result.baseAddress,
            baseAddressDecimal: result.baseAddressDecimal,
            environment: process.env.NODE_ENV || 'development',
            platform: process.platform,
            simulated: result.simulated,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ خطأ:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            environment: process.env.NODE_ENV
        });
    }
});

// محاكاة الحصول على العنوان الأساسي
async function simulateBaseAddress(libraryName) {
    // على Railway، لا يمكننا الوصول إلى /proc/self/maps
    // لذلك سنعيد بيانات محاكاة أو نستخدم متغيرات البيئة
    
    if (process.env.SIMULATED_BASE_ADDRESS) {
        // استخدام عنوان محدد من متغيرات البيئة
        const baseAddress = parseInt(process.env.SIMULATED_BASE_ADDRESS, 16);
        return {
            baseAddress: `0x${baseAddress.toString(16)}`,
            baseAddressDecimal: baseAddress,
            simulated: true
        };
    }
    
    // محاكاة عشوائية (للتطوير)
    const randomBase = 0x7f0000000000 + Math.floor(Math.random() * 0xFFFFFF);
    return {
        baseAddress: `0x${randomBase.toString(16)}`,
        baseAddressDecimal: randomBase,
        simulated: true
    };
}

// نقطة نهاية للصحة
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        platform: process.platform,
        memory: process.memoryUsage()
    });
});

// معلومات النظام
app.get('/api/system-info', (req, res) => {
    res.json({
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV,
        uptime: process.uptime(),
        pid: process.pid
    });
});

// معالجة الأخطاء
app.use((err, req, res, next) => {
    console.error('❌ خطأ غير متوقع:', err);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
    });
});

// بدء الخادم
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 الخادم يعمل على PORT: ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📚 API متاح على: /api/base-address`);
    console.log(`❤️  Health check: /api/health`);
});
