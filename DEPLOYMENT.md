# دليل النشر على السيرفر

## المتطلبات الأساسية

- Docker و Docker Compose مثبتان على السيرفر
- Git مثبت على السيرفر
- مفتاح Google API صالح

## خطوات النشر

### 1. تجهيز السيرفر

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# تثبيت Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# إضافة المستخدم الحالي إلى مجموعة docker
sudo usermod -aG docker $USER
```

### 2. استنساخ المشروع

```bash
# استنساخ المشروع
git clone <repository-url>
cd namaaQuastions2

# إنشاء ملف .env
cp env.example .env
nano .env
```

### 3. تعديل ملف .env

```bash
# تعديل القيم في ملف .env
GOOGLE_API_KEY=your_actual_google_api_key
PORT=5000
DATA_DIR=/app/data
```

### 4. تعديل ملف config.js للواجهة الأمامية

```bash
# تعديل frontend/config.js
nano frontend/config.js

# تغيير الرابط من:
window.API_BASE = "http://localhost:5000";

# إلى:
window.API_BASE = "https://your-backend-domain.com";
# أو
window.API_BASE = "http://your-server-ip:5000";
```

### 5. بناء وتشغيل المشروع

```bash
# بناء الصور
docker-compose build

# تشغيل المشروع
docker-compose up -d

# مراقبة السجلات
docker-compose logs -f
```

### 6. التحقق من التشغيل

```bash
# فحص حالة الخدمات
docker-compose ps

# اختبار Backend
curl http://localhost:5000/test

# اختبار Frontend
curl http://localhost:80
```

## إعداد Nginx كـ Reverse Proxy (اختياري)

### 1. تثبيت Nginx

```bash
sudo apt install nginx -y
```

### 2. إنشاء ملف التكوين

```bash
sudo nano /etc/nginx/sites-available/namaa
```

### 3. إضافة التكوين

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. تفعيل الموقع

```bash
sudo ln -s /etc/nginx/sites-available/namaa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## إعداد SSL (HTTPS)

### 1. تثبيت Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. الحصول على شهادة SSL

```bash
sudo certbot --nginx -d your-domain.com
```

## مراقبة المشروع

### 1. فحص السجلات

```bash
# سجلات Backend
docker-compose logs backend

# سجلات Frontend
docker-compose logs frontend
```

### 2. فحص الموارد

```bash
# استخدام الذاكرة والمعالج
docker stats

# فحص المساحة المتاحة
df -h
```

### 3. إعادة تشغيل الخدمات

```bash
# إعادة تشغيل خدمة معينة
docker-compose restart backend

# إعادة تشغيل جميع الخدمات
docker-compose restart
```

## النسخ الاحتياطي

### 1. نسخ احتياطي للبيانات

```bash
# نسخ احتياطي لمجلد البيانات
docker run --rm -v namaaQuastions2_backend_data:/data -v $(pwd):/backup alpine tar czf /backup/backup-$(date +%Y%m%d).tar.gz -C /data .

# نسخ احتياطي للملفات
tar czf namaa-files-$(date +%Y%m%d).tar.gz backend/ frontend/
```

### 2. استعادة النسخة الاحتياطية

```bash
# استعادة البيانات
docker run --rm -v namaaQuastions2_backend_data:/data -v $(pwd):/backup alpine tar xzf /backup/backup-20231201.tar.gz -C /data

# استعادة الملفات
tar xzf namaa-files-20231201.tar.gz
```

## استكشاف الأخطاء

### 1. مشاكل شائعة

- **خطأ في الاتصال**: تأكد من فتح المنافذ 80 و 5000
- **خطأ في Google API**: تأكد من صحة مفتاح API
- **مشاكل في الذاكرة**: تأكد من توفر ذاكرة كافية (2GB على الأقل)

### 2. فحص الاتصال

```bash
# فحص منفذ Backend
netstat -tlnp | grep :5000

# فحص منفذ Frontend
netstat -tlnp | grep :80

# فحص حالة Docker
sudo systemctl status docker
```

## التحديثات

### 1. تحديث المشروع

```bash
# سحب التحديثات
git pull origin main

# إعادة بناء وتشغيل
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 2. تحديث Docker

```bash
# تحديث Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# إعادة تشغيل Docker
sudo systemctl restart docker
```

## الدعم

في حالة مواجهة أي مشاكل:

1. راجع السجلات: `docker-compose logs`
2. تأكد من صحة التكوين
3. تحقق من توفر الموارد
4. راجع إعدادات الشبكة والجدار الناري
