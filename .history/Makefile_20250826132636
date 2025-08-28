# Makefile لتبسيط عمليات المشروع

.PHONY: help build run stop clean logs test deploy

# المتغيرات
COMPOSE_FILE = docker-compose.yml
PROJECT_NAME = namaa

# المساعدة
help:
	@echo "أوامر متاحة:"
	@echo "  build     - بناء صور Docker"
	@echo "  run       - تشغيل المشروع"
	@echo "  stop      - إيقاف المشروع"
	@echo "  restart   - إعادة تشغيل المشروع"
	@echo "  clean     - تنظيف المشروع"
	@echo "  logs      - عرض السجلات"
	@echo "  test      - اختبار الاتصال"
	@echo "  deploy    - نشر المشروع"
	@echo "  backup    - نسخ احتياطي"
	@echo "  restore   - استعادة النسخة الاحتياطية"

# بناء الصور
build:
	@echo "🔨 بناء صور Docker..."
	docker-compose -f $(COMPOSE_FILE) build --no-cache

# تشغيل المشروع
run:
	@echo "🚀 تشغيل المشروع..."
	docker-compose -f $(COMPOSE_FILE) up -d

# إيقاف المشروع
stop:
	@echo "⏹️  إيقاف المشروع..."
	docker-compose -f $(COMPOSE_FILE) down

# إعادة تشغيل المشروع
restart:
	@echo "🔄 إعادة تشغيل المشروع..."
	docker-compose -f $(COMPOSE_FILE) restart

# تنظيف المشروع
clean:
	@echo "🧹 تنظيف المشروع..."
	docker-compose -f $(COMPOSE_FILE) down -v --remove-orphans
	docker system prune -f
	docker volume prune -f

# عرض السجلات
logs:
	@echo "📋 عرض السجلات..."
	docker-compose -f $(COMPOSE_FILE) logs -f

# سجلات Backend
logs-backend:
	@echo "📋 سجلات Backend..."
	docker-compose -f $(COMPOSE_FILE) logs -f backend

# سجلات Frontend
logs-frontend:
	@echo "📋 سجلات Frontend..."
	docker-compose -f $(COMPOSE_FILE) logs -f frontend

# اختبار الاتصال
test:
	@echo "🧪 اختبار الاتصال..."
	@echo "اختبار Backend..."
	@curl -s http://localhost:5000/test || echo "❌ Backend غير متاح"
	@echo "اختبار Frontend..."
	@curl -s http://localhost:80 | head -1 || echo "❌ Frontend غير متاح"

# حالة الخدمات
status:
	@echo "📊 حالة الخدمات..."
	docker-compose -f $(COMPOSE_FILE) ps

# نشر المشروع
deploy: build run
	@echo "✅ تم نشر المشروع بنجاح!"
	@echo "🌐 Frontend: http://localhost:80"
	@echo "🔧 Backend: http://localhost:5000"

# نسخ احتياطي
backup:
	@echo "💾 إنشاء نسخة احتياطية..."
	@mkdir -p backup
	@tar czf backup/backup-$(shell date +%Y%m%d-%H%M%S).tar.gz \
		--exclude=backup \
		--exclude=.git \
		--exclude=node_modules \
		--exclude=__pycache__ \
		.
	@echo "✅ تم إنشاء النسخة الاحتياطية"

# استعادة النسخة الاحتياطية
restore:
	@echo "📥 استعادة النسخة الاحتياطية..."
	@ls -la backup/ || echo "❌ لا توجد نسخ احتياطية"
	@echo "استخدم: make restore-file FILE=backup/backup-YYYYMMDD-HHMMSS.tar.gz"

# استعادة ملف محدد
restore-file:
	@if [ -z "$(FILE)" ]; then \
		echo "❌ يرجى تحديد الملف: make restore-file FILE=backup/backup-YYYYMMDD-HHMMSS.tar.gz"; \
		exit 1; \
	fi
	@echo "📥 استعادة من $(FILE)..."
	@tar xzf $(FILE)
	@echo "✅ تمت الاستعادة بنجاح"

# تحديث المشروع
update:
	@echo "🔄 تحديث المشروع..."
	git pull origin main
	make deploy

# فحص الموارد
resources:
	@echo "📊 استخدام الموارد..."
	docker stats --no-stream

# فحص المساحة
space:
	@echo "💾 المساحة المتاحة..."
	df -h
	docker system df

# إعادة بناء وتشغيل
rebuild: stop clean build run
	@echo "✅ تم إعادة البناء والتشغيل بنجاح!"

# فحص الأخطاء
debug:
	@echo "🐛 فحص الأخطاء..."
	@echo "=== حالة الخدمات ==="
	make status
	@echo "=== اختبار الاتصال ==="
	make test
	@echo "=== السجلات الأخيرة ==="
	docker-compose -f $(COMPOSE_FILE) logs --tail=50
