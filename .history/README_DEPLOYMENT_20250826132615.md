# منصة إنشاء الأسئلة - جاهزة للنشر على السيرفر 🚀

## نظرة عامة

هذا المشروع عبارة عن منصة لإنشاء الأسئلة التعليمية باستخدام الذكاء الاصطناعي (Google Gemini API). يتكون من:

- **Backend**: Flask API على Python
- **Frontend**: واجهة ويب تفاعلية (HTML/CSS/JavaScript)
- **قاعدة البيانات**: ملفات JSON محلية
- **الذكاء الاصطناعي**: Google Gemini API لاقتراح الأسئلة

## الميزات

✅ **إنشاء أسئلة متنوعة**: صح/خطأ، متعدد الخيارات، كتابية  
✅ **رفع ملفات**: دعم PDF, DOCX, TXT, RTF, الصور  
✅ **إدارة المدربين**: نظام تسجيل دخول مع صلاحيات مختلفة  
✅ **حفظ النماذج**: حفظ واسترجاع النماذج المحفوظة  
✅ **تصدير DOCX**: تصدير الأسئلة إلى ملف Word  
✅ **معاينة HTML**: معاينة النماذج قبل التصدير  
✅ **واجهة عربية**: تصميم متجاوب باللغة العربية  

## المتطلبات

- **Python 3.11+**
- **Docker & Docker Compose**
- **مفتاح Google Gemini API**
- **2GB ذاكرة على الأقل**

## التثبيت السريع

### 1. استنساخ المشروع
```bash
git clone <repository-url>
cd namaaQuastions2
```

### 2. إعداد المتغيرات البيئية
```bash
cp env.example .env
# تعديل .env وإضافة مفتاح Google API
```

### 3. تشغيل المشروع
```bash
# باستخدام Makefile (مفضل)
make deploy

# أو باستخدام Docker Compose مباشرة
docker-compose up -d
```

### 4. الوصول للتطبيق
- **Frontend**: http://localhost:80
- **Backend**: http://localhost:5000

## الأوامر المتاحة

```bash
make help          # عرض جميع الأوامر
make build         # بناء صور Docker
make run           # تشغيل المشروع
make stop          # إيقاف المشروع
make restart       # إعادة تشغيل المشروع
make logs          # عرض السجلات
make test          # اختبار الاتصال
make deploy        # نشر المشروع (بناء + تشغيل)
make backup        # نسخ احتياطي
make clean         # تنظيف المشروع
```

## هيكل المشروع

```
namaaQuastions2/
├── backend/                 # خادم Flask
│   ├── app.py              # التطبيق الرئيسي
│   ├── trainers.json       # بيانات المدربين
│   └── saved_forms.json    # النماذج المحفوظة
├── frontend/               # الواجهة الأمامية
│   ├── index.html          # الصفحة الرئيسية
│   ├── login.html          # صفحة تسجيل الدخول
│   ├── config.js           # إعدادات API
│   ├── script.js           # المنطق الرئيسي
│   └── style.css           # التصميم
├── Dockerfile.backend      # صورة Backend
├── Dockerfile.frontend     # صورة Frontend
├── docker-compose.yml      # تكوين Docker
├── nginx.conf              # تكوين Nginx
├── Makefile                # أوامر سريعة
├── requirements.txt        # مكتبات Python
└── README_DEPLOYMENT.md    # هذا الملف
```

## إعدادات النشر

### 1. تعديل ملف config.js
```javascript
// للاستخدام المحلي
window.API_BASE = "http://localhost:5000";

// للنشر على السيرفر
window.API_BASE = "https://your-domain.com";
// أو
window.API_BASE = "http://your-server-ip:5000";
```

### 2. متغيرات البيئة
```bash
# ملف .env
GOOGLE_API_KEY=your_google_api_key
PORT=5000
DATA_DIR=/app/data
```

### 3. منافذ الشبكة
- **80**: Frontend (HTTP)
- **5000**: Backend (API)

## إعدادات متقدمة

### 1. Nginx كـ Reverse Proxy
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:80;
    }
    
    location /api/ {
        proxy_pass http://localhost:5000/;
    }
}
```

### 2. SSL/HTTPS
```bash
# تثبيت Certbot
sudo apt install certbot python3-certbot-nginx

# الحصول على شهادة SSL
sudo certbot --nginx -d your-domain.com
```

### 3. مراقبة الأداء
```bash
# فحص الموارد
make resources

# فحص المساحة
make space

# فحص الأخطاء
make debug
```

## استكشاف الأخطاء

### مشاكل شائعة

1. **خطأ في الاتصال**
   ```bash
   make test          # اختبار الاتصال
   make logs          # عرض السجلات
   ```

2. **مشاكل في الذاكرة**
   ```bash
   make resources     # فحص استخدام الموارد
   make clean         # تنظيف الموارد
   ```

3. **مشاكل في Google API**
   - تأكد من صحة مفتاح API
   - تحقق من حدود الاستخدام
   - راجع سجلات Backend

### أوامر التشخيص
```bash
make status          # حالة الخدمات
make logs-backend    # سجلات Backend
make logs-frontend   # سجلات Frontend
make debug           # تشخيص شامل
```

## النسخ الاحتياطي

### إنشاء نسخة احتياطية
```bash
make backup
```

### استعادة نسخة احتياطية
```bash
make restore-file FILE=backup/backup-20231201-143022.tar.gz
```

## التحديثات

### تحديث المشروع
```bash
make update
```

### إعادة بناء كامل
```bash
make rebuild
```

## الأمان

- ✅ **CORS**: مفعل للواجهة الأمامية
- ✅ **التحقق من الصلاحيات**: نظام أدوار للمدربين
- ✅ **حماية الملفات**: منع الوصول للملفات الحساسة
- ✅ **رؤوس الأمان**: إعدادات Nginx للأمان

## الدعم

في حالة مواجهة أي مشاكل:

1. **راجع السجلات**: `make logs`
2. **اختبر الاتصال**: `make test`
3. **فحص الحالة**: `make status`
4. **تشخيص شامل**: `make debug`

## المساهمة

للمساهمة في تطوير المشروع:

1. Fork المشروع
2. إنشاء فرع للميزة الجديدة
3. تطوير الميزة
4. إنشاء Pull Request

## الترخيص

هذا المشروع مرخص تحت رخصة MIT.

---

**ملاحظة**: تأكد من تحديث ملف `frontend/config.js` عند النشر على السيرفر لتغيير رابط API من `localhost` إلى عنوان السيرفر الفعلي.
