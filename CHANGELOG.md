# سجل التحديثات - منصة إنشاء الأسئلة التعليمية

## الإصدار 2.0.0 - جاهز للنشر على السيرفر 🚀

### التحديثات الرئيسية:

#### ✅ تعديل مسارات الملفات للتخزين الدائم

- **ملف:** `backend/app.py`
- **التغيير:** استبدال `BASE_DIR` بـ `DATA_DIR` من متغير البيئة
- **الفوائد:**
  - تخزين دائم للبيانات (`trainers.json`, `saved_forms.json`)
  - مرونة في تحديد موقع البيانات
  - توافق مع Docker volumes

#### ✅ إعداد Docker للنشر

- **ملفات جديدة:**
  - `Dockerfile.backend` - لـ Flask API
  - `Dockerfile.frontend` - لـ Nginx
  - `docker-compose.yml` - لتنسيق الخدمات
  - `nginx.conf` - تكوين Nginx مخصص

#### ✅ متغيرات البيئة

- **ملفات جديدة:**
  - `env.example` - قالب المتغيرات البيئية
  - `frontend/config.js` - تكوين API للواجهة الأمامية

#### ✅ تحديث الواجهة الأمامية

- **ملفات معدلة:**
  - `frontend/index.html` - إضافة `config.js`
  - `frontend/login.html` - إضافة `config.js`
  - `frontend/script.js` - استخدام `window.API_BASE`
  - `frontend/login.js` - استخدام `window.API_BASE`

#### ✅ ملفات النشر والمساعدة

- **ملفات جديدة:**
  - `README_DEPLOYMENT.md` - دليل النشر الشامل
  - `Makefile` - أوامر Docker مفيدة
  - `.dockerignore` - استبعاد ملفات Docker
  - `.gitignore` - تحديث Git ignores

### المتغيرات البيئية المطلوبة:

```bash
# مفتاح Google Gemini API
GOOGLE_API_KEY=your_api_key_here

# منفذ Backend
PORT=5000

# مجلد البيانات للتخزين الدائم
DATA_DIR=/app/data
```

### كيفية النشر:

1. **نسخ المشروع:**

   ```bash
   git clone <repository-url>
   cd namaaQuastions2
   ```

2. **إعداد المتغيرات البيئية:**

   ```bash
   cp env.example .env
   # تعديل .env بالقيم الصحيحة
   ```

3. **بناء وتشغيل Docker:**

   ```bash
   make build
   make up
   ```

4. **أو استخدام Docker Compose مباشرة:**
   ```bash
   docker-compose up -d
   ```

### الملفات المهمة للنشر:

- `backend/app.py` - Flask API مع مسارات مرنة
- `docker-compose.yml` - تكوين الخدمات
- `env.example` - قالب المتغيرات البيئية
- `README_DEPLOYMENT.md` - دليل النشر الشامل

### الحالة الحالية:

✅ **جاهز للنشر على Coolify بنسبة 100%**

- Backend: Flask API مع تخزين دائم للبيانات
- Frontend: Nginx static site مع تكوين مرن
- Docker: تكوين كامل للنشر
- التوثيق: دليل شامل للنشر والصيانة

---

## الإصدار 1.0.0 - الإصدار الأساسي

### الميزات الأساسية:

- إنشاء أسئلة تعليمية
- إدارة المدربين
- تصدير النماذج بصيغة Word
- اقتراح أسئلة باستخدام Google Gemini API
- واجهة مستخدم عربية سهلة الاستخدام
