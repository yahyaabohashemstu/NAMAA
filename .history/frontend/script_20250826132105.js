let questionCount = 0;
let currentTrainer = null;
let savedForms = [];
let currentFormId = null;
let editQuestionCount = 0;
let editingFormId = null;
let editingFormData = null;
let undoResetData = null;
let undoResetTimeout = null;

// متغيرات إعدادات الأسئلة
let trueFalseCount = 2;
let multipleChoiceCount = 2;
let classicCount = 1;

// تخزين مؤقت للصور
let tempImageStorage = new Map();

// دالة حفظ الصورة في التخزين المؤقت
function storeImageTemporarily(questionId, imageIndex, file, imageBase64) {
  const imageKey = `${questionId}-${imageIndex}`;
  tempImageStorage.set(imageKey, {
    file: file,
    base64: imageBase64,
    fileName: file.name,
    type: file.type,
    timestamp: Date.now(),
  });
  return imageKey;
}

// دالة استرجاع الصورة من التخزين المؤقت
function getStoredImage(imageKey) {
  return tempImageStorage.get(imageKey);
}

// دالة تنظيف التخزين المؤقت (يتم استدعاؤها عند الحفظ النهائي)
function clearTempImageStorage() {
  tempImageStorage.clear();
}

// دالة عرض معلومات التخزين المؤقت (للاختبار)
function showTempStorageInfo() {
  console.log("التخزين المؤقت للصور:", tempImageStorage);
  console.log("عدد الصور المحفوظة مؤقتاً:", tempImageStorage.size);
  tempImageStorage.forEach((value, key) => {
    console.log(
      `المفتاح: ${key}, الملف: ${value.fileName}, الحجم: ${
        value.file?.size || "غير معروف"
      } بايت`
    );
  });
}

// دالة للتحقق من وجود الصور في النموذج
function debugImagesInForm() {
  console.log("=== تحليل الصور في النموذج ===");
  const blocks = document.querySelectorAll(".question-block");
  blocks.forEach((block, index) => {
    const questionId = block.id.split("-")[1];
    console.log(`\nالسؤال ${questionId}:`);

    const imagePreview = block.querySelector(".image-preview");
    if (imagePreview) {
      const images = imagePreview.querySelectorAll("img");
      console.log(`  - عدد الصور في المعاينة: ${images.length}`);
      images.forEach((img, imgIndex) => {
        const tempKey = img.getAttribute("data-temp-key");
        console.log(`  - الصورة ${imgIndex + 1}:`);
        console.log(`    - المصدر: ${img.src.substring(0, 50)}...`);
        console.log(`    - مفتاح مؤقت: ${tempKey || "لا يوجد"}`);
        console.log(
          `    - في التخزين المؤقت: ${
            tempKey && tempImageStorage.has(tempKey) ? "نعم" : "لا"
          }`
        );
      });
    } else {
      console.log("  - لا توجد منطقة معاينة صور");
    }
  });
}

// التحقق من تسجيل الدخول عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", function () {
  checkAuth();
  initializeQuestionSettings();
  updateTotalQuestionsCountAndWarning();
});

// دالة تهيئة إعدادات الأسئلة
function initializeQuestionSettings() {
  // تعيين القيم الأولية في الحقول
  document.getElementById("trueFalseCount").value = trueFalseCount;
  document.getElementById("multipleChoiceCount").value = multipleChoiceCount;
  document.getElementById("classicCount").value = classicCount;

  // تحديث المتغيرات العامة بالقيم الأولية
  window.trueFalseCount = trueFalseCount;
  window.multipleChoiceCount = multipleChoiceCount;
  window.classicCount = classicCount;

  // تحديث المتغيرات المحلية أيضاً
  trueFalseCount = window.trueFalseCount;
  multipleChoiceCount = window.multipleChoiceCount;
  classicCount = window.classicCount;

  console.log("🚀 تهيئة إعدادات الأسئلة:", {
    trueFalse: trueFalseCount,
    multipleChoice: multipleChoiceCount,
    classic: classicCount,
  });

  // إعداد مستمعي الأحداث والتأثيرات البصرية
  setupQuestionCountListeners();
}

// دالة حساب مجموع الأسئلة وتحديث العرض
function updateTotalQuestionsCount() {
  // تحديث المتغيرات العامة
  window.trueFalseCount =
    parseInt(document.getElementById("trueFalseCount").value) || 0;
  window.multipleChoiceCount =
    parseInt(document.getElementById("multipleChoiceCount").value) || 0;
  window.classicCount =
    parseInt(document.getElementById("classicCount").value) || 0;

  // تحديث المتغيرات المحلية أيضاً
  trueFalseCount = window.trueFalseCount;
  multipleChoiceCount = window.multipleChoiceCount;
  classicCount = window.classicCount;

  // تحقق من أن كل عداد بين 0 و 100
  if (
    trueFalseCount < 0 ||
    trueFalseCount > 100 ||
    multipleChoiceCount < 0 ||
    multipleChoiceCount > 100 ||
    classicCount < 0 ||
    classicCount > 100
  ) {
    showError(
      "يجب أن يكون عدد كل نوع من الأسئلة بين 0 و 100 فقط. الرجاء تعديل القيم المدخلة بحيث تكون ضمن النطاق المسموح به.",
      "تنبيه بخصوص العدادات"
    );
    return;
  }

  const total =
    window.trueFalseCount + window.multipleChoiceCount + window.classicCount;
  document.getElementById("totalQuestionsCount").textContent = total;

  // التحقق من أن المجموع لا يتجاوز 100
  if (total > 100) {
    document.getElementById("totalQuestionsCount").style.color = "#dc3545";
    document.getElementById("suggestQuestionsBtn").disabled = true;
    document.getElementById("suggestQuestionsBtn").title =
      "المجموع يتجاوز 100 سؤال";
  } else {
    document.getElementById("totalQuestionsCount").style.color = "#000000";
    document.getElementById("suggestQuestionsBtn").disabled = false;
    document.getElementById("suggestQuestionsBtn").title = "";
  }

  console.log("🔄 تحديث عدد الأسئلة:", {
    trueFalse: trueFalseCount,
    multipleChoice: multipleChoiceCount,
    classic: classicCount,
    total: total,
  });

  return total;
}

// دالة إعداد مستمعي الأحداث لعدادات الأسئلة
function setupQuestionCountListeners() {
  const countInputs = ["trueFalseCount", "multipleChoiceCount", "classicCount"];

  countInputs.forEach((inputId) => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener("input", updateTotalQuestionsCount);
      input.addEventListener("change", updateTotalQuestionsCount);

      // إضافة تأثير بصري عند التغيير
      input.addEventListener("focus", function () {
        this.style.borderColor = "#4f46e5";
        this.style.boxShadow = "0 0 0 3px rgba(79, 70, 229, 0.1)";
      });

      input.addEventListener("blur", function () {
        this.style.borderColor = "#d1d5db";
        this.style.boxShadow = "none";
      });
    }
  });

  // تحديث العدد الإجمالي عند التحميل
  updateTotalQuestionsCount();

  // إضافة تأثيرات بصرية للعدادات
  addVisualEffects();
}

// دالة إضافة التأثيرات البصرية للعدادات
function addVisualEffects() {
  const countInputs = ["trueFalseCount", "multipleChoiceCount", "classicCount"];

  countInputs.forEach((inputId) => {
    const input = document.getElementById(inputId);
    if (input) {
      // إضافة تأثيرات بصرية بناءً على القيمة
      input.addEventListener("input", function () {
        const value = parseInt(this.value) || 0;

        // إزالة جميع الأنماط السابقة
        this.classList.remove("warning", "danger", "info");

        // تطبيق الأنماط بناءً على القيمة
        if (value >= 500) {
          this.classList.add("danger");
        } else if (value >= 200) {
          this.classList.add("warning");
        } else if (value >= 50) {
          this.classList.add("info");
        }
      });
    }
  });
}

// دالة إظهار/إخفاء أزرار الإجراءات حسب التبويب النشط
function updateFloatingActions() {
  const createActions = document.getElementById("createActions");
  const editActions = document.getElementById("editActions");
  const createTab = document.getElementById("createTab");
  const editTab = document.getElementById("editTab");

  if (createTab && createTab.classList.contains("active")) {
    // تبويب إنشاء أسئلة جديدة نشط
    if (createActions) createActions.style.display = "flex";
    if (editActions) editActions.style.display = "none";
  } else if (editTab && editTab.classList.contains("active")) {
    // تبويب تعديل الملف نشط
    if (createActions) createActions.style.display = "none";
    if (editActions) editActions.style.display = "flex";
  } else {
    // تبويب آخر نشط (مثل السجلات المحفوظة)
    if (createActions) createActions.style.display = "none";
    if (editActions) editActions.style.display = "none";
  }
}

// دالة التحقق من تسجيل الدخول
function checkAuth() {
  const trainerData = localStorage.getItem("trainer");

  if (!trainerData) {
    // إذا لم يكن هناك جلسة، انتقل إلى صفحة تسجيل الدخول
    window.location.href = "login.html";
    return;
  }

  try {
    currentTrainer = JSON.parse(trainerData);
    displayUserInfo();
    hideLoadingScreen();
    loadSavedForms(); // تحميل السجلات المحفوظة

    // تحديث أزرار الإجراءات العائمة
    setTimeout(() => {
      updateFloatingActions();
    }, 500);
  } catch (error) {
    console.error("Error parsing trainer data:", error);
    localStorage.removeItem("trainer");
    window.location.href = "login.html";
  }
}

// دالة عرض معلومات المستخدم
function displayUserInfo() {
  const userName = document.getElementById("userName");
  if (currentTrainer && userName) {
    const role = currentTrainer.role || "trainer";
    const roleBadge = role === "admin" ? " (مشرف عام)" : "";
    userName.textContent = currentTrainer.name + roleBadge;
  }

  // إظهار تبويب إضافة مدرب للمشرف فقط
  const addTrainerTabBtn = document.getElementById("addTrainerTabBtn");
  if (addTrainerTabBtn) {
    addTrainerTabBtn.style.display =
      currentTrainer && currentTrainer.role === "admin"
        ? "inline-flex"
        : "none";
  }
}

// دالة إخفاء شاشة التحميل
function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loadingScreen");
  const mainContent = document.getElementById("mainContent");

  if (loadingScreen) {
    loadingScreen.style.display = "none";
  }

  if (mainContent) {
    mainContent.style.display = "block";
  }
}

// دالة تسجيل الخروج
function logout() {
  localStorage.removeItem("trainer");
  window.location.href = "login.html";
}

// دالة تبديل التبويبات
function showTab(tabName) {
  // إزالة أي زر تراجع عائم عند تبديل التبويبات
  const floatingButton = document.getElementById("floatingUndoBtn");
  if (floatingButton) {
    floatingButton.remove();
  }

  // إيقاف أي عد تنازلي نشط
  if (undoResetTimeout) {
    clearInterval(undoResetTimeout);
    undoResetTimeout = null;
    undoResetData = null;
  }

  // إخفاء جميع التبويبات مع انتقال سلس
  const tabContents = document.querySelectorAll(".tab-content");
  tabContents.forEach((tab) => {
    if (tab.classList.contains("active")) {
      tab.style.opacity = "0";
      tab.style.transform = "translateY(-20px)";
      setTimeout(() => {
        tab.classList.remove("active");
      }, 150);
    }
  });

  // إزالة النشاط من جميع أزرار التبويب
  const navTabs = document.querySelectorAll(".nav-tab");
  navTabs.forEach((tab) => tab.classList.remove("active"));

  // تفعيل زر التبويب المطلوب مع تأثير
  const targetNavTab = document.querySelector(
    `[onclick="showTab('${tabName}')"]`
  );
  if (targetNavTab) {
    targetNavTab.classList.add("active");
    // إضافة تأثير نبضة للأيقونة
    const icon = targetNavTab.querySelector("i");
    if (icon) {
      icon.style.animation = "none";
      setTimeout(() => {
        icon.style.animation = "bounce 0.6s ease-in-out";
      }, 10);
    }
  }

  // إظهار التبويب المطلوب مع انتقال سلس
  setTimeout(() => {
    const targetTab = document.getElementById(tabName + "Tab");
    if (targetTab) {
      targetTab.classList.add("active");
      targetTab.style.opacity = "0";
      targetTab.style.transform = "translateY(20px)";

      // انتقال سلس للظهور
      setTimeout(() => {
        targetTab.style.transition = "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
        targetTab.style.opacity = "1";
        targetTab.style.transform = "translateY(0)";
      }, 50);
    }
  }, 200);

  // تحميل السجلات إذا كان التبويب المطلوب هو السجلات
  if (tabName === "saved") {
    setTimeout(() => {
      loadSavedForms();
    }, 300);
  }

  // تركيز أول حقل داخل تبويب إضافة مدرب
  if (tabName === "addTrainer") {
    setTimeout(() => {
      const input = document.getElementById("newTrainerName");
      if (input) input.focus();
      // تحديث حالة مطابقة كلمة المرور إن وُجدت الحقول
      initPasswordMatchWatcher();
    }, 350);
  }

  // إخفاء زر التعديل إذا لم نكن في وضع التعديل
  if (tabName !== "edit") {
    const editTabBtn = document.getElementById("editTabBtn");
    if (editTabBtn) {
      editTabBtn.classList.remove("show");
    }
  }

  // تحديث أزرار الإجراءات العائمة فوراً
  updateFloatingActions();

  // تحديث إضافي بعد اكتمال الانتقالات
  setTimeout(() => {
    updateFloatingActions();
  }, 400);
}

// تبديل إظهار/إخفاء كلمة المرور
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";
  if (btn) {
    const icon = btn.querySelector("i");
    if (icon) icon.className = isPassword ? "fas fa-eye-slash" : "fas fa-eye";
  }
}

// مراقبة تطابق كلمة المرور والتأكيد
function initPasswordMatchWatcher() {
  const pass = document.getElementById("newTrainerPassword");
  const pass2 = document.getElementById("newTrainerPasswordConfirm");
  const statusEl = document.getElementById("passwordMatchStatus");
  if (!pass || !pass2 || !statusEl) return;

  const update = () => {
    const v1 = pass.value;
    const v2 = pass2.value;
    if (!v1 && !v2) {
      statusEl.textContent = "";
      statusEl.style.color = "";
      return;
    }
    if (v1 === v2) {
      statusEl.textContent = "كلمة متطابقة";
      statusEl.style.color = "#16a34a"; // أخضر
    } else {
      statusEl.textContent = "غير متطابقة";
      statusEl.style.color = "#dc2626"; // أحمر
    }
  };

  pass.removeEventListener &&
    pass.removeEventListener("input", pass.__matchHandler || (() => {}));
  pass2.removeEventListener &&
    pass2.removeEventListener("input", pass2.__matchHandler || (() => {}));
  pass.__matchHandler = update;
  pass2.__matchHandler = update;

  pass.addEventListener("input", update);
  pass2.addEventListener("input", update);

  update();
}

// دالة تحميل السجلات المحفوظة
async function loadSavedForms() {
  if (!currentTrainer) return;

  try {
    // تمرير دور المستخدم لتمكين حصول المشرف على جميع السجلات
    const roleParam = currentTrainer.role === "admin" ? "?role=admin" : "";
    const response = await fetch(
              `${window.API_BASE}/get-forms/${currentTrainer.id}${roleParam}`
    );
    const data = await response.json();

    if (data.success) {
      savedForms = data.forms;
      displaySavedForms();
    } else {
      console.error("Error loading forms:", data.message);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// إضافة مدرب جديد من حساب المشرف
async function addTrainerFromAdmin(event) {
  event.preventDefault();
  if (!currentTrainer || currentTrainer.role !== "admin") {
    showError("غير مصرح لك بإضافة مدربين");
    return false;
  }

  const nameEl = document.getElementById("newTrainerName");
  const usernameEl = document.getElementById("newTrainerUsername");
  const passwordEl = document.getElementById("newTrainerPassword");
  const passwordConfirmEl = document.getElementById(
    "newTrainerPasswordConfirm"
  );

  const name = nameEl?.value.trim();
  const username = usernameEl?.value.trim();
  const password = passwordEl?.value.trim();
  const passwordConfirm = passwordConfirmEl?.value.trim();

  // إذا الحقول معبأة (يدوياً أو تلقائياً) فلا داعي للفرض مرتين
  if (!name) {
    showError("اسم المدرب مطلوب", "تحذير");
    return false;
  }
  if (!username) {
    showError("اسم المستخدم مطلوب", "تحذير");
    return false;
  }
  if (!password) {
    showError("كلمة المرور مطلوبة", "تحذير");
    return false;
  }

  if (password !== passwordConfirm) {
    showError("كلمة المرور وتأكيدها غير متطابقتين", "تحذير");
    passwordConfirmEl?.focus();
    return false;
  }

  // عرض نافذة التأكيد
  showTrainerConfirmModal(name, username, password);
  return false;
}

// دالة عرض السجلات المحفوظة
function displaySavedForms() {
  const formsList = document.getElementById("savedFormsList");
  const isAdmin = currentTrainer && currentTrainer.role === "admin";

  // إظهار أزرار أقسام السجلات للمشرف فقط
  const adminTabs = document.getElementById("adminSavedTabs");
  if (adminTabs) adminTabs.style.display = isAdmin ? "flex" : "none";

  // تهيئة اختيار متعدد وشريط الإجراءات
  if (!window.__selectedFormIds) window.__selectedFormIds = new Set();
  const bulkBar = document.getElementById("bulkActionsBar");
  const bulkDeleteBtn = document.getElementById("bulkDeleteBtn");
  const bulkExportBtn = document.getElementById("bulkExportBtn");
  const selectedCountEl = document.getElementById("selectedCount");
  const updateBulkBar = () => {
    const count = window.__selectedFormIds.size;
    if (bulkBar) bulkBar.style.display = count > 0 ? "flex" : "none";
    if (selectedCountEl)
      selectedCountEl.textContent =
        count > 0 ? `${count} ملف(ات) محددة` : "لم يتم تحديد ملفات";
    if (bulkExportBtn) bulkExportBtn.disabled = count === 0;
    if (bulkDeleteBtn) {
      const subTab = window.__savedSubTab || "trainers";
      const canDelete = !isAdmin || (isAdmin && subTab === "admin");
      bulkDeleteBtn.disabled = !canDelete || count === 0;
      bulkDeleteBtn.title = canDelete ? "" : "الحذف متاح فقط داخل قسم المشرف";
    }
  };
  updateBulkBar();

  if (savedForms.length === 0) {
    formsList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-save"></i>
        <h3>لا توجد سجلات محفوظة</h3>
        <p>قم بإنشاء أسئلة جديدة وحفظها لتظهر هنا</p>
      </div>
    `;
    return;
  }

  // ترتيب السجلات حسب آخر تحديث (الأحدث أولاً)
  const sortedForms = [...savedForms].sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt);
    const dateB = new Date(b.updatedAt || b.createdAt);
    return dateB - dateA; // ترتيب تنازلي (الأحدث أولاً)
  });

  if (isAdmin) {
    const subTab = window.__savedSubTab || "trainers";
    const btnTrainers = document.getElementById("btnSubTrainers");
    const btnAdmin = document.getElementById("btnSubAdmin");
    if (btnTrainers && btnAdmin) {
      btnTrainers.classList.toggle("active", subTab === "trainers");
      btnAdmin.classList.toggle("active", subTab === "admin");
    }
    const renderCard = (form, index) => {
      const isRecent = index < 3;
      const lastUpdateDate = new Date(form.updatedAt || form.createdAt);
      const createdDate = new Date(form.createdAt);
      const now = new Date();
      const timeDiffHours = (now - lastUpdateDate) / (1000 * 60 * 60);
      const isNew = timeDiffHours < 24;
      return `
        <div class="form-card ${isNew ? "recent-update" : ""}" ${
        isRecent ? 'style="border-right: 4px solid #10b981;"' : ""
      }>
          ${
            isNew
              ? '<div class="new-badge"><i class="fas fa-star"></i> محدث مؤخراً</div>'
              : ""
          }
           <div class="form-header">
             <label class=\"select-checkbox\">
               <input type=\"checkbox\" onchange=\"toggleSavedSelect('${
                 form.id
               }', this.checked)\">
               <span></span>
             </label>
            <h3 class="form-title">${form.lessonName}${
        form.examName ? ` - ${form.examName}` : ""
      }</h3>
            <span class="form-date"><i class="fas fa-calendar-alt"></i> تم الإنشاء: ${createdDate.toLocaleDateString(
              "ar-SA"
            )} - ${createdDate.toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit",
      })}</span>
          </div>
          <div class="form-info">
            <span><strong>المدرب:</strong> ${form.trainerName} ${
        form.modifiedByAdmin ? '<span class="admin-badge">نسخة مشرف</span>' : ""
      }</span>
            <span><strong>عدد الأسئلة:</strong> ${form.questions.length}</span>
            <span><strong>آخر تحديث:</strong> <i class="fas fa-clock" style="color:#10b981;"></i> <span style="color:#10b981; font-weight:600;">${lastUpdateDate.toLocaleDateString(
              "ar-SA"
            )} - ${lastUpdateDate.toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit",
      })}</span> ${
        timeDiffHours < 1
          ? '<span style="color:#ef4444; font-size:0.8rem; margin-right:0.5rem;">● جديد</span>'
          : ""
      }</span>
          </div>
          <div class="form-actions">
            <button class="form-action-btn preview-btn" onclick="previewSavedForm('${
              form.id
            }')"><i class="fas fa-eye"></i> معاينة</button>
            <button class="form-action-btn export-btn" onclick="exportSavedForm('${
              form.id
            }')"><i class="fas fa-file-word"></i> تصدير</button>
            <button class="form-action-btn edit-btn" onclick="editForm('${
              form.id
            }')"><i class="fas fa-edit"></i> تعديل</button>
          </div>
        </div>`;
    };

    const trainerFormsMap = {};
    const adminForms = [];
    for (const form of sortedForms) {
      const isAdminOwner =
        form.trainerUsername &&
        currentTrainer &&
        form.trainerUsername === currentTrainer.username;
      const modifiedByAdmin =
        form.lastModifiedByRole === "admin" &&
        form.lastModifiedById === currentTrainer.id;
      if (isAdminOwner || modifiedByAdmin) {
        adminForms.push(form);
      } else {
        const key = form.trainerUsername || form.trainerId || "غير معروف";
        if (!trainerFormsMap[key]) trainerFormsMap[key] = [];
        trainerFormsMap[key].push(form);
      }
    }

    // بطاقة خاصة بقسم المشرف تتضمن زر الحذف
    const renderAdminCard = (form, index) => {
      const isRecent = index < 3;
      const lastUpdateDate = new Date(form.updatedAt || form.createdAt);
      const createdDate = new Date(form.createdAt);
      const now = new Date();
      const timeDiffHours = (now - lastUpdateDate) / (1000 * 60 * 60);
      const isNew = timeDiffHours < 24;
      return `
        <div class="form-card ${isNew ? "recent-update" : ""}" ${
        isRecent ? 'style="border-right: 4px solid #10b981;"' : ""
      }>
          ${
            isNew
              ? '<div class="new-badge"><i class="fas fa-star"></i> محدث مؤخراً</div>'
              : ""
          }
           <div class="form-header">
             <label class=\"select-checkbox\">
               <input type=\"checkbox\" onchange=\"toggleSavedSelect('${
                 form.id
               }', this.checked)\">
               <span></span>
             </label>
            <h3 class="form-title">${form.lessonName}$${
        form.examName ? ` - ${form.examName}` : ""
      }</h3>
            <span class="form-date">
              <i class="fas fa-calendar-alt"></i>
              تم الإنشاء: ${createdDate.toLocaleDateString(
                "ar-SA"
              )} - ${createdDate.toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit",
      })}
            </span>
          </div>
          <div class="form-info">
            <span><strong>المدرب:</strong> ${form.trainerName}</span>
            <span><strong>عدد الأسئلة:</strong> ${form.questions.length}</span>
            <span><strong>آخر تحديث:</strong>
              <i class="fas fa-clock" style="color:#10b981;"></i>
              <span style="color:#10b981; font-weight:600;">${lastUpdateDate.toLocaleDateString(
                "ar-SA"
              )} - ${lastUpdateDate.toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit",
      })}</span>
              ${
                timeDiffHours < 1
                  ? '<span style="color:#ef4444; font-size: 0.8rem; margin-right: 0.5rem;">● جديد</span>'
                  : ""
              }
            </span>
          </div>
          <div class="form-actions">
            <button class="form-action-btn preview-btn" onclick="previewSavedForm('${
              form.id
            }')">
              <i class="fas fa-eye"></i> معاينة
            </button>
            <button class="form-action-btn export-btn" onclick="exportSavedForm('${
              form.id
            }')">
              <i class="fas fa-file-word"></i> تصدير
            </button>
            <button class="form-action-btn edit-btn" onclick="editForm('${
              form.id
            }')">
              <i class="fas fa-edit"></i> تعديل
            </button>
            <button class="form-action-btn delete-btn" onclick="deleteForm('${
              form.id
            }')">
              <i class="fas fa-trash"></i> حذف
            </button>
          </div>
        </div>
      `;
    };

    const trainersSection = (() => {
      const groups = Object.keys(trainerFormsMap)
        .sort((a, b) => a.localeCompare(b, "ar"))
        .map((trainerKey) => {
          const forms = trainerFormsMap[trainerKey];
          const header = `
            <div class="collapsible-group">
              <div class="collapsible-header" onclick="toggleGroup(this)">
                <div class="collapsible-title">
                  <i class="fas fa-user-circle"></i>
                  حساب المدرب: <span>${trainerKey}</span>
                  <span class="count">(${forms.length} ملف)</span>
                </div>
                <i class="fas fa-chevron-down chevron"></i>
              </div>
              <div class="collapsible-content">`;
          const cards = forms.map((f, i) => renderCard(f, i)).join("");
          const footer = `</div></div>`;
          return header + cards + footer;
        })
        .join("");
      return (
        `<h3 style="margin:16px 0; color:#374151;">ملفات المدربين</h3>` +
        (groups || '<div class="empty-state">لا توجد ملفات</div>')
      );
    })();

    const adminSection = (() => {
      const cards = adminForms.map((f, i) => renderAdminCard(f, i)).join("");
      return (
        `<h3 style=\"margin:24px 0 12px; color:#374151;\">ملفات المشرف نورا</h3>` +
        (cards || '<div class="empty-state">لا توجد ملفات</div>')
      );
    })();

    formsList.innerHTML =
      subTab === "trainers" ? trainersSection : adminSection;
    return;
  }

  formsList.innerHTML = sortedForms
    .map((form, index) => {
      const isRecent = index < 3; // أول 3 نماذج تعتبر حديثة
      const lastUpdateDate = new Date(form.updatedAt || form.createdAt);
      const createdDate = new Date(form.createdAt);
      const now = new Date();
      const timeDiffHours = (now - lastUpdateDate) / (1000 * 60 * 60);
      const isNew = timeDiffHours < 24; // جديد إذا تم تحديثه خلال 24 ساعة

      return `
    <div class="form-card ${isNew ? "recent-update" : ""}" ${
        isRecent ? 'style="border-right: 4px solid #10b981;"' : ""
      }>
      ${
        isNew
          ? '<div class="new-badge"><i class="fas fa-star"></i> محدث مؤخراً</div>'
          : ""
      }
      <div class="form-header">
        <h3 class="form-title">${form.lessonName}${
        form.examName ? ` - ${form.examName}` : ""
      }</h3>
        <span class="form-date">
          <i class="fas fa-calendar-alt"></i>
          تم الإنشاء: ${createdDate.toLocaleDateString(
            "ar-SA"
          )} - ${createdDate.toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit",
      })}
        </span>
      </div>
      <div class="form-info">
        <span><strong>المدرب:</strong> ${form.trainerName}</span>
        <span><strong>عدد الأسئلة:</strong> ${form.questions.length}</span>
        <span><strong>آخر تحديث:</strong> 
          <i class="fas fa-clock" style="color: #10b981;"></i>
          <span style="color: #10b981; font-weight: 600;">
            ${lastUpdateDate.toLocaleDateString(
              "ar-SA"
            )} - ${lastUpdateDate.toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit",
      })}
          </span>
          ${
            timeDiffHours < 1
              ? '<span style="color: #ef4444; font-size: 0.8rem; margin-right: 0.5rem;">● جديد</span>'
              : ""
          }
        </span>
      </div>
      <div class="form-actions">
        <button class="form-action-btn preview-btn" onclick="previewSavedForm('${
          form.id
        }')">
          <i class="fas fa-eye"></i> معاينة
        </button>
        <button class="form-action-btn export-btn" onclick="exportSavedForm('${
          form.id
        }')">
          <i class="fas fa-file-word"></i> تصدير
        </button>
        ${
          isAdmin
            ? ""
            : `<button class="form-action-btn edit-btn" onclick="editForm('${form.id}')">
          <i class=\"fas fa-edit\"></i> تعديل
        </button>
        <button class=\"form-action-btn delete-btn\" onclick=\"deleteForm('${form.id}')\"> 
          <i class=\"fas fa-trash\"></i> حذف
        </button>`
        }
      </div>
    </div>
  `;
    })
    .join("");
}

// تبديل فتح/إغلاق المجموعة المنسدلة للمشرف
function toggleGroup(headerEl) {
  const group = headerEl.closest(".collapsible-group");
  if (!group) return;
  group.classList.toggle("open");
}

// دعم اختيار متعدد وشريط إجراءات جماعية
function toggleSavedSelect(formId, checked) {
  if (!window.__selectedFormIds) window.__selectedFormIds = new Set();
  if (checked) window.__selectedFormIds.add(formId);
  else window.__selectedFormIds.delete(formId);

  const bulkBar = document.getElementById("bulkActionsBar");
  const bulkDeleteBtn = document.getElementById("bulkDeleteBtn");
  const bulkExportBtn = document.getElementById("bulkExportBtn");
  const selectedCountEl = document.getElementById("selectedCount");
  const isAdmin = currentTrainer && currentTrainer.role === "admin";
  const subTab = window.__savedSubTab || "trainers";
  const count = window.__selectedFormIds.size;
  if (bulkBar) bulkBar.style.display = count > 0 ? "flex" : "none";
  if (selectedCountEl)
    selectedCountEl.textContent =
      count > 0 ? `${count} ملف(ات) محددة` : "لم يتم تحديد ملفات";
  if (bulkExportBtn) bulkExportBtn.disabled = count === 0;
  if (bulkDeleteBtn) {
    const canDelete = !isAdmin || (isAdmin && subTab === "admin");
    bulkDeleteBtn.disabled = !canDelete || count === 0;
    bulkDeleteBtn.title = canDelete ? "" : "الحذف متاح فقط داخل قسم المشرف";
  }
}

async function bulkDeleteSelected() {
  if (!window.__selectedFormIds || window.__selectedFormIds.size === 0) return;
  const isAdmin = currentTrainer && currentTrainer.role === "admin";
  const subTab = window.__savedSubTab || "trainers";
  if (isAdmin && subTab !== "admin") {
    showWarning("الحذف متاح فقط داخل قسم المشرف");
    return;
  }
  const ids = Array.from(window.__selectedFormIds);
  showConfirmModal(
    "تأكيد الحذف",
    `سيتم حذف ${ids.length} ملف(ات). متابعة؟`,
    async () => {
      try {
        for (const id of ids) {
          await fetch(`${window.API_BASE}/delete-form/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trainerId: currentTrainer.id }),
          });
        }
        window.__selectedFormIds.clear();
        loadSavedForms();
        showCustomModal("success", "تم الحذف", "تم حذف الملفات المحددة بنجاح", [
          "حسناً",
        ]);
      } catch (e) {
        showError("حدث خطأ أثناء حذف الملفات المحددة");
      }
    }
  );
}

async function bulkExportSelected() {
  if (!window.__selectedFormIds || window.__selectedFormIds.size === 0) return;
  const ids = Array.from(window.__selectedFormIds);
  try {
    for (const id of ids) {
      await exportSavedForm(id);
    }
  } catch (e) {
    console.error(e);
    showError("حدث خطأ أثناء تصدير الملفات المحددة");
  }
}

// للمشرف: إنشاء نسخة من ملف مدرب والتبديل إلى وضع التعديل
async function adminCloneForEdit(formId) {
  if (!currentTrainer || currentTrainer.role !== "admin") {
    showWarning("صلاحية غير كافية");
    return;
  }
  try {
    // 1) جلب الملف الأصلي
          const res = await fetch(`${window.API_BASE}/get-form/${formId}`);
    const data = await res.json();
    if (!data.success) {
      showError("تعذر تحميل الملف الأصلي");
      return;
    }
    const original = data.form;

    // 2) إنشاء نسخة محفوظة باسم وصلاحية المشرف مع توثيق المرجع
    const clonePayload = {
      trainerId: currentTrainer.id,
      lessonName: original.lessonName,
      trainerName: currentTrainer.name + " (مشرف)",
      examName: original.examName || "",
      questions: original.questions,
      originalFormId: original.id,
      originalTrainerId: original.trainerId,
      modifiedByAdmin: true,
    };

            const saveRes = await fetch(`${window.API_BASE}/save-form`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clonePayload),
    });
    const saveData = await saveRes.json();
    if (!saveData.success) {
      showError(saveData.message || "تعذر إنشاء النسخة");
      return;
    }

    // 3) فتح النسخة في وضع التعديل باستخدام الدالة المعتمدة
    const newFormId = saveData.formId;
    // ضمان إظهار زر تبويب التعديل وإزالة النمط الداخلي المعطل
    const editTabBtnEl = document.getElementById("editTabBtn");
    if (editTabBtnEl) {
      editTabBtnEl.style.display = "inline-block";
      editTabBtnEl.classList.add("show");
    }
    // التبديل إلى تبويب التعديل أولاً لضمان الرؤية
    showTab("edit");
    // ثم استدعاء تهيئة التعديل
    await editForm(newFormId);
    // إعادة التأكيد على تبويب التعديل بعد الملء
    showTab("edit");
  } catch (e) {
    console.error(e);
    showError("حدث خطأ أثناء إنشاء نسخة المشرف للتعديل");
  }
}

// دالة تعديل نموذج محفوظ
async function editForm(formId) {
  try {
    const response = await fetch(`${window.API_BASE}/get-form/${formId}`);
    const data = await response.json();
    console.log("استجابة get-form:", data); // طباعة الاستجابة للتشخيص

    if (data.success) {
      const form = data.form;
      editingFormId = formId;
      editingFormData = form;

      // تحديث عنوان التعديل
      const editTitle = document.getElementById("editTitle");
      const title =
        form.lessonName + (form.examName ? ` - ${form.examName}` : "");
      editTitle.textContent = `تعديل الملف: ${title}`;

      // ملء النموذج بالبيانات
      document.getElementById("editLessonName").value = form.lessonName;
      document.getElementById("editTrainerName").value = form.trainerName;
      document.getElementById("editExamName").value = form.examName || "";

      // مسح الأسئلة الحالية في قسم التعديل
      document.getElementById("editQuestions").innerHTML = "";
      editQuestionCount = 0;

      // إضافة الأسئلة المحفوظة
      for (let i = 0; i < form.questions.length; i++) {
        const q = form.questions[i];
        const previousCount = editQuestionCount;
        addEditQuestion();
        const lastBlock = document.querySelector(
          `#edit-question-${previousCount + 1}`
        );

        // ملء بيانات السؤال
        lastBlock.querySelector('textarea[name="text"]').value = q.text;

        // تحديد نوع السؤال
        const typeButtons = lastBlock.querySelectorAll(".type-btn");
        typeButtons.forEach((btn) => btn.classList.remove("active"));

        if (q.type === "true_false") {
          typeButtons[0].classList.add("active");
        } else if (q.type === "multiple_choice") {
          typeButtons[1].classList.add("active");
        } else if (q.type === "classic") {
          typeButtons[2].classList.add("active");
        }

        // إعادة إنشاء الخيارات
        selectEditQuestionType(previousCount + 1, q.type);

        // ملء الإجابة
        if (q.type === "true_false") {
          const radio = lastBlock.querySelector(`input[value="${q.answer}"]`);
          if (radio) radio.checked = true;
        } else if (q.type === "multiple_choice") {
          // ملء الخيارات
          const optionInputs = lastBlock.querySelectorAll(
            '.option-item input[type="text"]'
          );
          q.options.forEach((option, index) => {
            if (optionInputs[index]) {
              optionInputs[index].value = option;
            }
          });

          // تحديد الإجابة الصحيحة
          const correctIndex = q.options.indexOf(q.answer);
          const radio = lastBlock.querySelector(
            `input[value="${correctIndex}"]`
          );
          if (radio) radio.checked = true;
        } else if (q.type === "classic") {
          const answerTextarea = lastBlock.querySelector(
            `textarea[name="answer-${previousCount + 1}"]`
          );
          if (answerTextarea) answerTextarea.value = q.answer;
        }

        // إضافة الصور إذا وجدت
        if (q.images && q.images.length > 0) {
          const preview = lastBlock.querySelector(".image-preview");
          if (preview) {
            q.images.forEach((imageSrc, index) => {
              const img = document.createElement("img");
              img.src = imageSrc;
              img.style.maxWidth = "180px";
              img.style.maxHeight = "120px";
              img.style.borderRadius = "8px";
              img.style.boxShadow = "0 1px 4px rgba(0,0,0,0.12)";
              img.style.margin = "5px";

              // إضافة زر حذف الصورة
              const deleteBtn = document.createElement("button");
              deleteBtn.type = "button";
              deleteBtn.className = "delete-image-btn";
              deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
              deleteBtn.onclick = function () {
                deleteEditImage(
                  img,
                  lastBlock.querySelector('input[type="file"][name="image"]')
                );
              };

              // إنشاء حاوية للصورة والزر
              const imageContainer = document.createElement("div");
              imageContainer.className = "image-container";
              imageContainer.style.position = "relative";
              imageContainer.style.display = "inline-block";
              imageContainer.style.margin = "5px";

              imageContainer.appendChild(img);
              imageContainer.appendChild(deleteBtn);
              preview.appendChild(imageContainer);
            });
          }
        }
      }

      // إظهار زر التعديل والانتقال إليه
      const editTabBtn = document.getElementById("editTabBtn");
      if (editTabBtn) {
        editTabBtn.classList.add("show");
      }

      // الانتقال إلى تبويب التعديل
      showTab("edit");

      // تحديث فوري لأزرار الإجراءات العائمة
      setTimeout(() => {
        updateFloatingActions();
      }, 100);
    } else {
      showError("حدث خطأ في تحميل النموذج");
    }
  } catch (error) {
    console.error("Error:", error);
    showError("حدث خطأ في تحميل النموذج");
  }
}

// دالة حذف نموذج
async function deleteForm(formId) {
  showConfirmModal(
    "تأكيد الحذف",
    "هل أنت متأكد من حذف هذا النموذج؟ لا يمكن التراجع عن هذا الإجراء.",
    async () => {
      try {
        const response = await fetch(
          `${window.API_BASE}/delete-form/${formId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ trainerId: currentTrainer.id }),
          }
        );

        const data = await response.json();

        if (data.success) {
          showCustomModal("success", "تم الحذف", "تم حذف النموذج بنجاح", [
            "حسناً",
          ]);
          loadSavedForms(); // إعادة تحميل القائمة
        } else {
          showCustomModal(
            "danger",
            "خطأ",
            data.message || "حدث خطأ في حذف النموذج",
            ["حسناً"]
          );
        }
      } catch (error) {
        console.error("Error:", error);
        showCustomModal("danger", "خطأ", "حدث خطأ في حذف النموذج", ["حسناً"]);
      }
    }
  );
}

// دالة تصدير نموذج محفوظ
async function exportSavedForm(formId) {
  try {
    const response = await fetch(`${window.API_BASE}/get-form/${formId}`);
    const data = await response.json();

    if (data.success) {
      const form = data.form;

      const exportResponse = await fetch(`${window.API_BASE}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainerId: currentTrainer.id,
          lessonName: form.lessonName,
          trainerName: form.trainerName,
          examName: form.examName || "",
          questions: form.questions,
        }),
      });

      if (exportResponse.ok) {
        const blob = await exportResponse.blob();
        let filename = "questions.docx";
        const disposition = exportResponse.headers.get("Content-Disposition");
        if (disposition && disposition.includes("filename=")) {
          filename = decodeURIComponent(
            disposition.split("filename=")[1].trim().replace(/['"]/g, "")
          );
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        showError("حدث خطأ أثناء التصدير");
      }
    } else {
      showError("حدث خطأ في تحميل النموذج");
    }
  } catch (error) {
    console.error("Error:", error);
    showError("حدث خطأ في التصدير");
  }
}

// دالة معاينة النموذج
async function previewForm() {
  const lessonName = document.getElementById("lessonName").value.trim();
  const trainerName = document.getElementById("trainerName").value.trim();
  const examName = document.getElementById("examName").value.trim();
  const questions = await collectQuestions();

  if (!lessonName || !trainerName) {
    showWarning("يرجى إدخال اسم الدرس واسم المدرب", "بيانات ناقصة");
    return;
  }

  if (questions.length === 0) {
    showWarning("يرجى إضافة أسئلة على الأقل", "لا توجد أسئلة");
    return;
  }

  // تحليل الصور قبل الإرسال (للتطوير)
  console.log("=== تحليل الصور قبل المعاينة ===");
  questions.forEach((question, index) => {
    console.log(`السؤال ${index + 1}: ${question.images?.length || 0} صورة`);
    if (question.images && question.images.length > 0) {
      question.images.forEach((img, imgIndex) => {
        console.log(`  - الصورة ${imgIndex + 1}: ${img.substring(0, 50)}...`);
      });
    }
  });

  try {
    const response = await fetch(`${window.API_BASE}/preview-form`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonName: lessonName,
        trainerName: trainerName,
        examName: examName,
        questions: questions,
      }),
    });

    const data = await response.json();

    if (data.success) {
      showPreview(data.html);
    } else {
      showError(data.message || "حدث خطأ في إنشاء المعاينة", "خطأ في المعاينة");
    }
  } catch (error) {
    console.error("Error:", error);
    showError("حدث خطأ في إنشاء المعاينة", "خطأ في المعاينة");
  }
}

// دالة عرض المعاينة
function showPreview(html) {
  const modal = document.getElementById("previewModal");
  const content = document.getElementById("previewContent");

  content.innerHTML = html;
  modal.style.display = "block";
}

// دالة إغلاق المعاينة
function closePreview() {
  const modal = document.getElementById("previewModal");
  modal.style.display = "none";
}

// دالة جمع الأسئلة
async function collectQuestions() {
  const blocks = document.querySelectorAll(".question-block");
  const questions = [];

  for (const block of blocks) {
    const questionId = block.id.split("-")[1];
    const text = block.querySelector('textarea[name="text"]').value;
    const type = block
      .querySelector(".type-btn.active")
      .textContent.includes("صح")
      ? "true_false"
      : block.querySelector(".type-btn.active").textContent.includes("متعدد")
      ? "multiple_choice"
      : "classic";

    let answer = "";
    let options = [];
    let images = []; // تغيير من image إلى images array

    if (type === "true_false") {
      const selected = block.querySelector(
        `input[name="answer-${questionId}"]:checked`
      );
      answer = selected ? selected.value : "";
    } else if (type === "multiple_choice") {
      const optionInputs = block.querySelectorAll(
        '.option-item input[type="text"]'
      );
      const selectedRadio = block.querySelector(
        `input[name="answer-${questionId}"]:checked`
      );

      optionInputs.forEach((input) => {
        if (input.value.trim()) {
          options.push(input.value.trim());
        }
      });

      answer = selectedRadio ? options[parseInt(selectedRadio.value)] : "";
    } else if (type === "classic") {
      answer = block.querySelector(
        `textarea[name="answer-${questionId}"]`
      ).value;
    }

    // معالجة الصور: نفضّل المعاينة، ونستخدم مدخلات الملفات فقط عند عدم وجود صور في المعاينة
    const imagePreview = block.querySelector(".image-preview");
    let previewImagesCount = 0;
    if (imagePreview) {
      const previewImages = imagePreview.querySelectorAll("img");
      previewImagesCount = previewImages.length;
      previewImages.forEach((img) => {
        const tempKey = img.getAttribute("data-temp-key");
        if (tempKey && tempImageStorage.has(tempKey)) {
          const storedImage = tempImageStorage.get(tempKey);
          images.push(storedImage.base64);
        } else if (img.src) {
          images.push(img.src);
        }
      });
    }

    if (previewImagesCount === 0) {
      // احتياطي: إذا لم توجد صور في المعاينة، اقرأ من مدخلات الملفات
      const imageInputs = block.querySelectorAll(
        'input[type="file"][name="image"]'
      );
      for (const imageInput of imageInputs) {
        if (imageInput.files.length > 0) {
          for (let i = 0; i < imageInput.files.length; i++) {
            const file = imageInput.files[i];
            const imageBase64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = function (e) {
                resolve(e.target.result);
              };
              reader.readAsDataURL(file);
            });
            images.push(imageBase64);
          }
        }
      }
    }

    questions.push({ text, type, answer, options, images }); // تغيير من image إلى images
  }

  return questions;
}

// دالة معاينة نموذج محفوظ من السجلات
async function previewSavedForm(formId) {
  try {
          const response = await fetch(`${window.API_BASE}/get-form/${formId}`);
    const data = await response.json();
    if (data.success) {
      const form = data.form;
      // إرسال البيانات إلى API المعاينة
              const previewRes = await fetch(`${window.API_BASE}/preview-form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonName: form.lessonName,
          trainerName: form.trainerName,
          examName: form.examName || "",
          questions: form.questions,
        }),
      });
      const previewData = await previewRes.json();
      if (previewData.success) {
        showPreview(previewData.html);
      } else {
        showError(
          previewData.message || "حدث خطأ في إنشاء المعاينة",
          "خطأ في المعاينة"
        );
      }
    } else {
      showError("حدث خطأ في تحميل النموذج");
    }
  } catch (error) {
    console.error("Error:", error);
    showError("حدث خطأ في المعاينة", "خطأ في المعاينة");
  }
}

// دالة حذف سؤال
function removeQuestion(button) {
  const questionBlock = button.closest(".question-block");
  if (questionBlock) {
    questionBlock.remove();
  }
}

function addQuestion() {
  questionCount++;
  const questionsDiv = document.getElementById("questions");
  const block = document.createElement("div");
  block.className = "question-block";
  block.id = `question-${questionCount}`;

  block.innerHTML = `
        <div class="question-header">
            <div class="question-title">
                <span class="question-number">${questionCount}</span>
                <h5>السؤال ${questionCount}</h5>
            </div>
            <button type="button" class="delete-btn" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-trash"></i> حذف
            </button>
        </div>

        <div class="mb-3">
            <label>نص السؤال:</label>
            <textarea name="text" required></textarea>
        </div>

        <div class="mb-3">
            <label>نوع السؤال:</label>
            <div class="question-type-selector">
                <button type="button" class="type-btn active" onclick="selectQuestionType(${questionCount}, 'true_false')">
                    <i class="fas fa-check-circle"></i> صح / خطأ
                </button>
                <button type="button" class="type-btn" onclick="selectQuestionType(${questionCount}, 'multiple_choice')">
                    <i class="fas fa-list-ul"></i> متعدد الخيارات
                </button>
                <button type="button" class="type-btn" onclick="selectQuestionType(${questionCount}, 'classic')">
                    <i class="fas fa-pen"></i> سؤال كتابي
                </button>
            </div>
        </div>

        <div id="options-${questionCount}"></div>

        <div class="mb-3">
            <label>صور السؤال (اختياري):</label>
            <div class="image-upload-section">
                <input type="file" accept="image/*" name="image" onchange="previewImage(this)" multiple />
                <button type="button" class="add-image-btn" onclick="addImageInput(${questionCount})">
                    <i class="fas fa-plus"></i> إضافة صورة أخرى
                </button>
            </div>
            <div class="image-preview" style="margin-top:10px;"></div>
        </div>
    `;

  questionsDiv.appendChild(block);
  selectQuestionType(questionCount, "true_false");
}

function selectQuestionType(questionId, type, event) {
  const block = document.getElementById(`question-${questionId}`);
  const optionsDiv = document.getElementById(`options-${questionId}`);
  const typeButtons = block.querySelectorAll(".type-btn");

  // Update active button
  typeButtons.forEach((btn) => btn.classList.remove("active"));
  if (event && event.target) {
    event.target.closest(".type-btn").classList.add("active");
  } else {
    // التفعيل اليدوي عند الاستدعاء البرمجي
    if (type === "true_false") typeButtons[0].classList.add("active");
    else if (type === "multiple_choice") typeButtons[1].classList.add("active");
    else if (type === "classic") typeButtons[2].classList.add("active");
  }

  // Clear options
  optionsDiv.innerHTML = "";

  // Add options based on type
  switch (type) {
    case "true_false":
      optionsDiv.innerHTML = `
                <div class="answer-section">
                    <label>الإجابة الصحيحة</label>
                    <div class="true-false-options">
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="answer-${questionId}" id="true-${questionId}" value="صح">
                            <label class="form-check-label" for="true-${questionId}">
                                صح
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="answer-${questionId}" id="false-${questionId}" value="خطأ">
                            <label class="form-check-label" for="false-${questionId}">
                                خطأ
                            </label>
                        </div>
                    </div>
                </div>
            `;
      break;

    case "multiple_choice":
      optionsDiv.innerHTML = `
                <div class="answer-section">
                    <label>الخيارات</label>
                    <div class="options-container" id="options-container-${questionId}">
                        <div class="option-item">
                            <input type="radio" name="answer-${questionId}" value="0">
                            <input type="text" placeholder="الخيار الأول">
                            <button type="button" onclick="removeOption(this)">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="option-item">
                            <input type="radio" name="answer-${questionId}" value="1">
                            <input type="text" placeholder="الخيار الثاني">
                            <button type="button" onclick="removeOption(this)">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <button type="button" class="add-option-btn" onclick="addOption(${questionId})">
                        <i class="fas fa-plus"></i> إضافة خيار جديد
                    </button>
                </div>
            `;
      break;

    case "classic":
      optionsDiv.innerHTML = `
                <div class="answer-section">
                    <label>الإجابة النموذجية (اختياري)</label>
                    <textarea name="answer-${questionId}"></textarea>
                </div>
            `;
      break;
  }
}

function addOption(questionId) {
  const optionsContainer = document.getElementById(
    `options-container-${questionId}`
  );
  const optionCount = optionsContainer.children.length;

  const optionItem = document.createElement("div");
  optionItem.className = "option-item";
  optionItem.innerHTML = `
        <input type="radio" name="answer-${questionId}" value="${optionCount}">
        <input type="text" placeholder="الخيار ${optionCount + 1}">
        <button type="button" onclick="removeOption(this)">
            <i class="fas fa-times"></i>
        </button>
    `;

  optionsContainer.appendChild(optionItem);
}

function removeOption(button) {
  const optionsContainer = button.parentElement.parentElement;
  if (optionsContainer.children.length > 2) {
    button.parentElement.remove();

    // Update radio values
    const options = optionsContainer.querySelectorAll(".option-item");
    options.forEach((option, index) => {
      option.querySelector('input[type="radio"]').value = index;
    });
  }
}

function previewImage(input) {
  const preview =
    input.parentElement.parentElement.querySelector(".image-preview");
  if (!preview) return;

  // الحصول على معرف السؤال
  const questionBlock = input.closest(".question-block");
  const questionId = questionBlock ? questionBlock.id.split("-")[1] : "unknown";

  // إضافة الصور الجديدة إلى المعاينة الموجودة
  if (input.files && input.files.length > 0) {
    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i];
      const reader = new FileReader();
      reader.onload = function (e) {
        // حفظ الصورة في التخزين المؤقت
        const imageKey = storeImageTemporarily(
          questionId,
          Date.now() + i,
          file,
          e.target.result
        );

        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.maxWidth = "180px";
        img.style.maxHeight = "120px";
        img.style.borderRadius = "8px";
        img.style.boxShadow = "0 1px 4px rgba(0,0,0,0.12)";
        img.style.margin = "5px";

        // إضافة معرف التخزين المؤقت كـ data attribute
        img.setAttribute("data-temp-key", imageKey);

        // إضافة زر حذف الصورة
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "delete-image-btn";
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.onclick = function () {
          deleteImage(img, input, imageKey);
        };

        // إنشاء حاوية للصورة والزر
        const imageContainer = document.createElement("div");
        imageContainer.className = "image-container";
        imageContainer.style.position = "relative";
        imageContainer.style.display = "inline-block";
        imageContainer.style.margin = "5px";

        imageContainer.appendChild(img);
        imageContainer.appendChild(deleteBtn);
        preview.appendChild(imageContainer);
      };
      reader.readAsDataURL(file);
    }
  }
}

// دالة حذف صورة محددة
function deleteImage(imgElement, input, imageKey = null) {
  // حذف الصورة من التخزين المؤقت إذا كان لها مفتاح
  if (imageKey) {
    tempImageStorage.delete(imageKey);
  } else {
    // البحث عن المفتاح في data attribute
    const tempKey = imgElement.getAttribute("data-temp-key");
    if (tempKey) {
      tempImageStorage.delete(tempKey);
    }
  }

  imgElement.parentElement.remove();
  // لا نمسح input لأن هناك صور أخرى قد تكون موجودة
}

// دالة إضافة حقل إدخال صورة إضافي
function addImageInput(questionId) {
  const questionBlock = document.getElementById(`question-${questionId}`);
  const imageUploadSection = questionBlock.querySelector(
    ".image-upload-section"
  );

  const imageInputDiv = document.createElement("div");
  imageInputDiv.className = "image-input-group";
  imageInputDiv.style.marginTop = "10px";
  imageInputDiv.style.display = "flex";
  imageInputDiv.style.alignItems = "center";
  imageInputDiv.style.gap = "10px";

  imageInputDiv.innerHTML = `
    <input type="file" accept="image/*" name="image" onchange="previewImage(this)" multiple />
    <button type="button" class="remove-image-input-btn" onclick="removeImageInput(this)">
      <i class="fas fa-times"></i>
    </button>
  `;

  imageUploadSection.appendChild(imageInputDiv);
}

// دالة حذف حقل إدخال صورة
function removeImageInput(button) {
  button.parentElement.remove();
}

// دالة حفظ النموذج
async function saveForm() {
  if (!currentTrainer) {
    showCustomModal("warning", "تحذير", "يرجى تسجيل الدخول أولاً", ["حسناً"]);
    return;
  }

  const lessonName = document.getElementById("lessonName").value.trim();
  const trainerName = document.getElementById("trainerName").value.trim();
  const examName = document.getElementById("examName").value.trim();
  const questions = await collectQuestions();

  if (!lessonName || !trainerName) {
    showCustomModal("warning", "تحذير", "يرجى إدخال اسم الدرس واسم المدرب", [
      "حسناً",
    ]);
    return;
  }

  if (questions.length === 0) {
    showCustomModal("warning", "تحذير", "يرجى إضافة أسئلة على الأقل", [
      "حسناً",
    ]);
    return;
  }

  // عرض رسالة تأكيد الحفظ
  showConfirmModal(
    "تأكيد الحفظ",
    "هل أنت متأكد من حفظ هذا النموذج؟",
    async () => {
      try {
        const url = currentFormId
          ? `${window.API_BASE}/update-form/${currentFormId}`
          : `${window.API_BASE}/save-form`;

        const method = currentFormId ? "PUT" : "POST";

        const response = await fetch(url, {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trainerId: currentTrainer.id,
            lessonName: lessonName,
            trainerName: trainerName,
            examName: examName,
            questions: questions,
          }),
        });

        const data = await response.json();

        if (data.success) {
          showCustomModal("success", "نجح الحفظ", data.message, ["حسناً"]);
          if (!currentFormId) {
            currentFormId = data.formId;
          }
          // إعادة تحميل السجلات في الخلفية فقط
          loadSavedForms();

          // تنظيف التخزين المؤقت للصور بعد الحفظ الناجح
          clearTempImageStorage();

          // إبقاء النموذج كما هو - لا نمسحه
        } else {
          showCustomModal(
            "danger",
            "خطأ",
            data.message || "حدث خطأ في حفظ النموذج",
            ["حسناً"]
          );
        }
      } catch (error) {
        console.error("Error:", error);
        showCustomModal("danger", "خطأ", "حدث خطأ في حفظ النموذج", ["حسناً"]);
      }
    }
  );
}

// معالج النموذج الأصلي
document.getElementById("questionForm").onsubmit = async function (e) {
  e.preventDefault();

  // التحقق من تسجيل الدخول
  if (!currentTrainer) {
    showWarning("يرجى تسجيل الدخول أولاً", "غير مسجل الدخول");
    window.location.href = "login.html";
    return;
  }

  const lessonName = document.getElementById("lessonName").value.trim();
  const trainerName = document.getElementById("trainerName").value.trim();
  const examName = document.getElementById("examName").value.trim();
  const questions = await collectQuestions();

  // التحقق من وجود سؤال واحد على الأقل
  if (questions.length === 0) {
    showWarning("يرجى إضافة سؤال واحد على الأقل قبل التصدير", "لا توجد أسئلة");
    return;
  }

  // التحقق من البيانات الأساسية
  if (!lessonName || !trainerName) {
    showWarning("يرجى إدخال اسم الدرس واسم المدرب", "بيانات ناقصة");
    return;
  }

  // تحليل الصور قبل التصدير (للتطوير)
  console.log("=== تحليل الصور قبل التصدير ===");
  questions.forEach((question, index) => {
    console.log(`السؤال ${index + 1}: ${question.images?.length || 0} صورة`);
    if (question.images && question.images.length > 0) {
      question.images.forEach((img, imgIndex) => {
        console.log(`  - الصورة ${imgIndex + 1}: ${img.substring(0, 50)}...`);
      });
    }
  });

  const res = await fetch(`${window.API_BASE}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trainerId: currentTrainer.id,
      lessonName,
      trainerName,
      examName,
      questions,
    }),
  });

  if (res.ok) {
    const blob = await res.blob();
    // استخراج اسم الملف من الهيدر
    let filename = "questions.docx";
    const disposition = res.headers.get("Content-Disposition");
    if (disposition && disposition.includes("filename=")) {
      filename = decodeURIComponent(
        disposition.split("filename=")[1].trim().replace(/['"]/g, "")
      );
    }
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    const errorData = await res.json();
    showError(errorData.message || "حدث خطأ أثناء التصدير", "خطأ في التصدير");
  }
};

// إغلاق النافذة المنبثقة عند النقر خارجها
window.onclick = function (event) {
  const previewModal = document.getElementById("previewModal");
  const customModal = document.getElementById("customModal");

  if (event.target === previewModal) {
    closePreview();
  }

  if (event.target === customModal) {
    closeModal();
  }
};

// تبديل القسم الظاهر في تبويب السجلات للمشرف
function setSavedSubTab(tab) {
  window.__savedSubTab = tab === "admin" ? "admin" : "trainers";
  displaySavedForms();
}

// إضافة دعم للوحة المفاتيح (ESC للإغلاق)
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    const customModal = document.getElementById("customModal");
    const previewModal = document.getElementById("previewModal");

    if (customModal.style.display === "block") {
      closeModal();
    }
    if (previewModal && previewModal.style.display === "block") {
      closePreview();
    }
  }
});

// دالة العودة للسجلات
function backToSaved() {
  // إعادة تعيين متغيرات التعديل
  editingFormId = null;
  editingFormData = null;
  editQuestionCount = 0;

  // إخفاء زر التعديل
  const editTabBtn = document.getElementById("editTabBtn");
  if (editTabBtn) {
    editTabBtn.classList.remove("show");
  }

  // العودة إلى تبويب السجلات
  showTab("saved");
}

// دالة إضافة سؤال في قسم التعديل
function addEditQuestion() {
  editQuestionCount++;
  const questionsDiv = document.getElementById("editQuestions");
  const block = document.createElement("div");
  block.className = "question-block";
  block.id = `edit-question-${editQuestionCount}`;

  block.innerHTML = `
        <div class="question-header">
            <div class="question-title">
                <span class="question-number">${editQuestionCount}</span>
                <h5>السؤال ${editQuestionCount}</h5>
            </div>
            <button type="button" class="delete-btn" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-trash"></i> حذف
            </button>
        </div>

        <div class="mb-3">
            <label>نص السؤال:</label>
            <textarea name="text" required></textarea>
        </div>

        <div class="mb-3">
            <label>نوع السؤال:</label>
            <div class="question-type-selector">
                <button type="button" class="type-btn active" onclick="selectEditQuestionType(${editQuestionCount}, 'true_false')">
                    <i class="fas fa-check-circle"></i> صح / خطأ
                </button>
                <button type="button" class="type-btn" onclick="selectEditQuestionType(${editQuestionCount}, 'multiple_choice')">
                    <i class="fas fa-list-ul"></i> متعدد الخيارات
                </button>
                <button type="button" class="type-btn" onclick="selectEditQuestionType(${editQuestionCount}, 'classic')">
                    <i class="fas fa-pen"></i> سؤال كتابي
                </button>
            </div>
        </div>

        <div id="edit-options-${editQuestionCount}"></div>

        <div class="mb-3">
            <label>صور السؤال (اختياري):</label>
            <div class="image-upload-section">
                <input type="file" accept="image/*" name="image" onchange="previewEditImage(this)" multiple />
                <button type="button" class="add-image-btn" onclick="addEditImageInput(${editQuestionCount})">
                    <i class="fas fa-plus"></i> إضافة صورة أخرى
                </button>
            </div>
            <div class="image-preview" style="margin-top:10px;"></div>
        </div>
    `;

  questionsDiv.appendChild(block);
  selectEditQuestionType(editQuestionCount, "true_false");
}

// دالة تحديد نوع السؤال في قسم التعديل
function selectEditQuestionType(questionId, type, event) {
  const block = document.getElementById(`edit-question-${questionId}`);
  const optionsDiv = document.getElementById(`edit-options-${questionId}`);
  const typeButtons = block.querySelectorAll(".type-btn");

  // Update active button
  typeButtons.forEach((btn) => btn.classList.remove("active"));
  if (event && event.target) {
    event.target.closest(".type-btn").classList.add("active");
  } else {
    // التفعيل اليدوي عند الاستدعاء البرمجي
    if (type === "true_false") typeButtons[0].classList.add("active");
    else if (type === "multiple_choice") typeButtons[1].classList.add("active");
    else if (type === "classic") typeButtons[2].classList.add("active");
  }

  // Clear options
  optionsDiv.innerHTML = "";

  // Add options based on type
  switch (type) {
    case "true_false":
      optionsDiv.innerHTML = `
                <div class="answer-section">
                    <label>الإجابة الصحيحة</label>
                    <div class="true-false-options">
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="answer-${questionId}" id="edit-true-${questionId}" value="صح">
                            <label class="form-check-label" for="edit-true-${questionId}">
                                صح
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="answer-${questionId}" id="edit-false-${questionId}" value="خطأ">
                            <label class="form-check-label" for="edit-false-${questionId}">
                                خطأ
                            </label>
                        </div>
                    </div>
                </div>
            `;
      break;

    case "multiple_choice":
      optionsDiv.innerHTML = `
                <div class="answer-section">
                    <label>الخيارات</label>
                    <div class="options-container" id="edit-options-container-${questionId}">
                        <div class="option-item">
                            <input type="radio" name="answer-${questionId}" value="0">
                            <input type="text" placeholder="الخيار الأول">
                            <button type="button" onclick="removeEditOption(this)">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="option-item">
                            <input type="radio" name="answer-${questionId}" value="1">
                            <input type="text" placeholder="الخيار الثاني">
                            <button type="button" onclick="removeEditOption(this)">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <button type="button" class="add-option-btn" onclick="addEditOption(${questionId})">
                        <i class="fas fa-plus"></i> إضافة خيار جديد
                    </button>
                </div>
            `;
      break;

    case "classic":
      optionsDiv.innerHTML = `
                <div class="answer-section">
                    <label>الإجابة النموذجية (اختياري)</label>
                    <textarea name="answer-${questionId}"></textarea>
                </div>
            `;
      break;
  }
}

// دالة إضافة خيار في قسم التعديل
function addEditOption(questionId) {
  const optionsContainer = document.getElementById(
    `edit-options-container-${questionId}`
  );
  const optionCount = optionsContainer.children.length;

  const optionItem = document.createElement("div");
  optionItem.className = "option-item";
  optionItem.innerHTML = `
        <input type="radio" name="answer-${questionId}" value="${optionCount}">
        <input type="text" placeholder="الخيار ${optionCount + 1}">
        <button type="button" onclick="removeEditOption(this)">
            <i class="fas fa-times"></i>
        </button>
    `;

  optionsContainer.appendChild(optionItem);
}

// دالة حذف خيار في قسم التعديل
function removeEditOption(button) {
  const optionsContainer = button.parentElement.parentElement;
  if (optionsContainer.children.length > 2) {
    button.parentElement.remove();

    // Update radio values
    const options = optionsContainer.querySelectorAll(".option-item");
    options.forEach((option, index) => {
      option.querySelector('input[type="radio"]').value = index;
    });
  }
}

// دالة معاينة الصورة في قسم التعديل
function previewEditImage(input) {
  const preview =
    input.parentElement.parentElement.querySelector(".image-preview");
  if (!preview) return;

  // الحصول على معرف السؤال
  const questionBlock = input.closest(".question-block");
  const questionId = questionBlock
    ? questionBlock.id.split("-")[2]
    : "edit-unknown";

  // إضافة الصور الجديدة إلى المعاينة الموجودة
  if (input.files && input.files.length > 0) {
    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i];
      const reader = new FileReader();
      reader.onload = function (e) {
        // حفظ الصورة في التخزين المؤقت
        const imageKey = storeImageTemporarily(
          questionId,
          Date.now() + i,
          file,
          e.target.result
        );

        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.maxWidth = "180px";
        img.style.maxHeight = "120px";
        img.style.borderRadius = "8px";
        img.style.boxShadow = "0 1px 4px rgba(0,0,0,0.12)";
        img.style.margin = "5px";

        // إضافة معرف التخزين المؤقت كـ data attribute
        img.setAttribute("data-temp-key", imageKey);

        // إضافة زر حذف الصورة
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "delete-image-btn";
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.onclick = function () {
          deleteEditImage(img, input, imageKey);
        };

        // إنشاء حاوية للصورة والزر
        const imageContainer = document.createElement("div");
        imageContainer.className = "image-container";
        imageContainer.style.position = "relative";
        imageContainer.style.display = "inline-block";
        imageContainer.style.margin = "5px";

        imageContainer.appendChild(img);
        imageContainer.appendChild(deleteBtn);
        preview.appendChild(imageContainer);
      };
      reader.readAsDataURL(file);
    }
  }
}

// دالة حذف صورة محددة في قسم التعديل
function deleteEditImage(imgElement, input, imageKey = null) {
  // حذف الصورة من التخزين المؤقت إذا كان لها مفتاح
  if (imageKey) {
    tempImageStorage.delete(imageKey);
  } else {
    // البحث عن المفتاح في data attribute
    const tempKey = imgElement.getAttribute("data-temp-key");
    if (tempKey) {
      tempImageStorage.delete(tempKey);
    }
  }

  imgElement.parentElement.remove();
  // لا نمسح input لأن هناك صور أخرى قد تكون موجودة
}

// دالة إضافة حقل إدخال صورة إضافي في قسم التعديل
function addEditImageInput(questionId) {
  const questionBlock = document.getElementById(`edit-question-${questionId}`);
  const imageUploadSection = questionBlock.querySelector(
    ".image-upload-section"
  );

  const imageInputDiv = document.createElement("div");
  imageInputDiv.className = "image-input-group";
  imageInputDiv.style.marginTop = "10px";
  imageInputDiv.style.display = "flex";
  imageInputDiv.style.alignItems = "center";
  imageInputDiv.style.gap = "10px";

  imageInputDiv.innerHTML = `
    <input type="file" accept="image/*" name="image" onchange="previewEditImage(this)" multiple />
    <button type="button" class="remove-image-input-btn" onclick="removeEditImageInput(this)">
      <i class="fas fa-times"></i>
    </button>
  `;

  imageUploadSection.appendChild(imageInputDiv);
}

// دالة حذف حقل إدخال صورة في قسم التعديل
function removeEditImageInput(button) {
  button.parentElement.remove();
}

// دالة جمع الأسئلة من قسم التعديل
async function collectEditQuestions() {
  const blocks = document.querySelectorAll("#editQuestions .question-block");
  const questions = [];

  for (const block of blocks) {
    const questionId = block.id.split("-")[2];
    const text = block.querySelector('textarea[name="text"]').value;
    const type = block
      .querySelector(".type-btn.active")
      .textContent.includes("صح")
      ? "true_false"
      : block.querySelector(".type-btn.active").textContent.includes("متعدد")
      ? "multiple_choice"
      : "classic";

    let answer = "";
    let options = [];
    let images = []; // تغيير من image إلى images array

    if (type === "true_false") {
      const selected = block.querySelector(
        `input[name="answer-${questionId}"]:checked`
      );
      answer = selected ? selected.value : "";
    } else if (type === "multiple_choice") {
      const optionInputs = block.querySelectorAll(
        '.option-item input[type="text"]'
      );
      const selectedRadio = block.querySelector(
        `input[name="answer-${questionId}"]:checked`
      );

      optionInputs.forEach((input) => {
        if (input.value.trim()) {
          options.push(input.value.trim());
        }
      });

      answer = selectedRadio ? options[parseInt(selectedRadio.value)] : "";
    } else if (type === "classic") {
      answer = block.querySelector(
        `textarea[name="answer-${questionId}"]`
      ).value;
    }

    // معالجة الصور: نفضّل المعاينة، ونستخدم مدخلات الملفات فقط عند عدم وجود صور في المعاينة
    const imagePreview = block.querySelector(".image-preview");
    let previewImagesCount = 0;
    if (imagePreview) {
      const previewImages = imagePreview.querySelectorAll("img");
      previewImagesCount = previewImages.length;
      previewImages.forEach((img) => {
        const tempKey = img.getAttribute("data-temp-key");
        if (tempKey && tempImageStorage.has(tempKey)) {
          const storedImage = tempImageStorage.get(tempKey);
          images.push(storedImage.base64);
        } else if (img.src) {
          images.push(img.src);
        }
      });
    }

    if (previewImagesCount === 0) {
      // احتياطي: إذا لم توجد صور في المعاينة، اقرأ من مدخلات الملفات
      const imageInputs = block.querySelectorAll(
        'input[type="file"][name="image"]'
      );
      for (const imageInput of imageInputs) {
        if (imageInput.files.length > 0) {
          for (let i = 0; i < imageInput.files.length; i++) {
            const file = imageInput.files[i];
            const imageBase64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = function (e) {
                resolve(e.target.result);
              };
              reader.readAsDataURL(file);
            });
            images.push(imageBase64);
          }
        }
      }
    }

    questions.push({ text, type, answer, options, images }); // تغيير من image إلى images
  }

  return questions;
}

// دالة حفظ التعديلات
async function saveEditForm() {
  if (!currentTrainer || !editingFormId) {
    showCustomModal("warning", "تحذير", "يرجى تسجيل الدخول أولاً", ["حسناً"]);
    return;
  }

  const lessonName = document.getElementById("editLessonName").value.trim();
  const trainerName = document.getElementById("editTrainerName").value.trim();
  const examName = document.getElementById("editExamName").value.trim();
  const questions = await collectEditQuestions();

  if (!lessonName || !trainerName) {
    showCustomModal("warning", "تحذير", "يرجى إدخال اسم الدرس واسم المدرب", [
      "حسناً",
    ]);
    return;
  }

  if (questions.length === 0) {
    showCustomModal("warning", "تحذير", "يرجى إضافة أسئلة على الأقل", [
      "حسناً",
    ]);
    return;
  }

  // عرض رسالة تأكيد الحفظ
  showConfirmModal(
    "تأكيد الحفظ",
    "هل أنت متأكد من حفظ التعديلات؟",
    async () => {
      try {
        const response = await fetch(
          `${window.API_BASE}/update-form/${editingFormId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              trainerId: currentTrainer.id,
              lessonName: lessonName,
              trainerName: trainerName,
              examName: examName,
              questions: questions,
            }),
          }
        );

        const data = await response.json();

        if (data.success) {
          showCustomModal("success", "نجح الحفظ", "تم حفظ التعديلات بنجاح", [
            "حسناً",
          ]);
          // تحديث السجلات في الخلفية
          loadSavedForms();

          // تنظيف التخزين المؤقت للصور بعد الحفظ الناجح
          clearTempImageStorage();
        } else {
          showCustomModal(
            "danger",
            "خطأ",
            data.message || "حدث خطأ في حفظ التعديلات",
            ["حسناً"]
          );
        }
      } catch (error) {
        console.error("Error:", error);
        showCustomModal("danger", "خطأ", "حدث خطأ في حفظ التعديلات", ["حسناً"]);
      }
    }
  );
}

// دالة معاينة النموذج في قسم التعديل
async function previewEditForm() {
  const lessonName = document.getElementById("editLessonName").value.trim();
  const trainerName = document.getElementById("editTrainerName").value.trim();
  const examName = document.getElementById("editExamName").value.trim();
  const questions = await collectEditQuestions();

  if (!lessonName || !trainerName) {
    showWarning("يرجى إدخال اسم الدرس واسم المدرب", "بيانات ناقصة");
    return;
  }

  if (questions.length === 0) {
    showWarning("يرجى إضافة أسئلة على الأقل", "لا توجد أسئلة");
    return;
  }

  try {
    const response = await fetch(`${window.API_BASE}/preview-form`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonName: lessonName,
        trainerName: trainerName,
        examName: examName,
        questions: questions,
      }),
    });

    const data = await response.json();

    if (data.success) {
      showPreview(data.html);
    } else {
      showError(data.message || "حدث خطأ في إنشاء المعاينة", "خطأ في المعاينة");
    }
  } catch (error) {
    console.error("Error:", error);
    showError("حدث خطأ في إنشاء المعاينة", "خطأ في المعاينة");
  }
}

// دالة تصدير النموذج من قسم التعديل
async function exportEditForm() {
  if (!currentTrainer || !editingFormId) {
    showCustomModal("warning", "تحذير", "يرجى تسجيل الدخول أولاً", ["حسناً"]);
    return;
  }

  const lessonName = document.getElementById("editLessonName").value;
  const trainerName = document.getElementById("editTrainerName").value;
  const examName = document.getElementById("editExamName").value;
  const questions = await collectEditQuestions();

  const res = await fetch(`${window.API_BASE}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trainerId: currentTrainer.id,
      lessonName,
      trainerName,
      examName,
      questions,
    }),
  });

  if (res.ok) {
    const blob = await res.blob();
    // استخراج اسم الملف من الهيدر
    let filename = "questions.docx";
    const disposition = res.headers.get("Content-Disposition");
    if (disposition && disposition.includes("filename=")) {
      filename = decodeURIComponent(
        disposition.split("filename=")[1].trim().replace(/['"]/g, "")
      );
    }
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    const errorData = await res.json();
    showCustomModal(
      "danger",
      "خطأ",
      errorData.message || "حدث خطأ أثناء التصدير",
      ["حسناً"]
    );
  }
}

// دالة عرض الرسائل الجميلة المطورة
function showCustomModal(
  type,
  title,
  message,
  buttons = ["حسناً"],
  options = {}
) {
  const modal = document.getElementById("customModal");
  const header = document.getElementById("customModalHeader");
  const icon = document.getElementById("customModalIcon");
  const modalTitle = document.getElementById("customModalTitle");
  const modalBody = document.getElementById("customModalBody");
  const modalFooter = document.getElementById("customModalFooter");

  // إزالة الأنماط السابقة
  header.className = "custom-modal-header";
  header.classList.add(type);

  // تعيين الأيقونة حسب النوع مع أيقونات محسّنة
  const icons = {
    success: "fas fa-check-circle",
    warning: "fas fa-exclamation-triangle",
    danger: "fas fa-times-circle",
    info: "fas fa-info-circle",
    loading: "fas fa-spinner fa-spin",
    question: "fas fa-question-circle",
  };
  icon.className = icons[type] || "fas fa-info-circle";

  // تعيين المحتوى
  modalTitle.textContent = title;
  modalBody.innerHTML = message; // استخدام innerHTML للسماح بـ HTML

  // إنشاء الأزرار المطورة
  modalFooter.innerHTML = "";
  buttons.forEach((buttonText, index) => {
    const button = document.createElement("button");
    button.className = "custom-modal-btn";

    // تحديد نوع الزر بناءً على الموقع والنوع
    if (buttons.length === 1) {
      button.classList.add(
        type === "danger"
          ? "danger"
          : type === "success"
          ? "success"
          : "primary"
      );
    } else if (index === buttons.length - 1) {
      // الزر الأخير هو الزر الأساسي
      button.classList.add(
        type === "danger"
          ? "danger"
          : type === "warning"
          ? "warning"
          : "primary"
      );
    } else {
      button.classList.add("secondary");
    }

    button.textContent = buttonText;
    button.onclick = () => {
      closeModal();
    };

    modalFooter.appendChild(button);
  });

  // إظهار النافذة بتأثير
  modal.style.display = "block";

  // إضافة تأثير الصوت (اختياري)
  if (options.playSound && window.AudioContext) {
    playNotificationSound(type);
  }

  // إغلاق تلقائي (اختياري)
  if (options.autoClose && typeof options.autoClose === "number") {
    setTimeout(() => {
      closeModal();
    }, options.autoClose);
  }
}

// دالة إغلاق النافذة مع تأثير
function closeModal() {
  const modal = document.getElementById("customModal");
  const content = modal.querySelector(".custom-modal-content");

  content.style.animation = "modalSlideOut 0.3s ease-in forwards";
  setTimeout(() => {
    modal.style.display = "none";
    content.style.animation = "";
  }, 300);
}

// دالة تشغيل أصوات التنبيه (اختياري)
function playNotificationSound(type) {
  try {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const frequencies = {
      success: 523.25, // C5
      warning: 440.0, // A4
      danger: 349.23, // F4
      info: 261.63, // C4
    };

    oscillator.frequency.setValueAtTime(
      frequencies[type] || frequencies.info,
      audioContext.currentTime
    );
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.2
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (e) {
    // تجاهل الأخطاء إذا لم يكن الصوت مدعوماً
  }
}

// دالة تأكيد مع رسالة جميلة محسّنة
function showConfirmModal(
  title,
  message,
  onConfirm,
  onCancel = null,
  options = {}
) {
  const type = options.type || "question";
  const confirmText = options.confirmText || "تأكيد";
  const cancelText = options.cancelText || "إلغاء";

  showCustomModal(type, title, message, [cancelText, confirmText], options);

  // تعديل الأزرار للعمل مع التأكيد
  const modalFooter = document.getElementById("customModalFooter");
  const confirmBtn = modalFooter.querySelector(".custom-modal-btn:last-child");
  const cancelBtn = modalFooter.querySelector(".custom-modal-btn:first-child");

  confirmBtn.onclick = () => {
    closeModal();
    if (onConfirm) onConfirm();
  };

  cancelBtn.onclick = () => {
    closeModal();
    if (onCancel) onCancel();
  };
}

// دوال مخصصة للتنبيهات السريعة
function showSuccess(message, title = "نجح العمل!", options = {}) {
  showCustomModal("success", title, message, ["حسناً"], options);
}

function showError(message, title = "حدث خطأ!", options = {}) {
  showCustomModal("danger", title, message, ["حسناً"], options);
}

function showWarning(message, title = "تحذير!", options = {}) {
  showCustomModal("warning", title, message, ["حسناً"], options);
}

function showInfo(message, title = "معلومات", options = {}) {
  showCustomModal("info", title, message, ["حسناً"], options);
}

function showLoading(message, title = "جار العمل...") {
  showCustomModal("loading", title, message, [], { autoClose: false });
}

// دالة إغلاق النافذة من الخارج
function hideLoading() {
  closeModal();
}

// دالة حفظ حالة النموذج الحالية
async function saveCurrentFormState() {
  // التحقق من وجود أسئلة قبل الحفظ
  const questionsContainer = document.getElementById("questions");
  if (!questionsContainer || questionCount === 0) {
    return null; // لا توجد بيانات للحفظ
  }

  // حفظ بيانات النموذج الأساسية
  const basicFormData = {
    lessonName: document.getElementById("lessonName").value,
    trainerName: document.getElementById("trainerName").value,
    examName: document.getElementById("examName").value,
    questionCount: questionCount,
    currentFormId: currentFormId,
  };

  // حفظ تفاصيل كل سؤال
  const detailedQuestions = [];
  const blocks = document.querySelectorAll(".question-block");

  for (const block of blocks) {
    const questionId = block.id.split("-")[1];

    // حفظ نص السؤال
    const textArea = block.querySelector('textarea[name="text"]');
    const questionText = textArea ? textArea.value : "";

    // حفظ نوع السؤال
    const activeTypeBtn = block.querySelector(".type-btn.active");
    const questionType = activeTypeBtn ? activeTypeBtn.textContent : "";

    // حفظ الخيارات والإجابات حسب النوع
    let options = [];
    let selectedAnswer = "";
    let answerText = "";

    if (activeTypeBtn && activeTypeBtn.textContent.includes("صح")) {
      // صح/خطأ
      const selected = block.querySelector(
        `input[name="answer-${questionId}"]:checked`
      );
      selectedAnswer = selected ? selected.value : "";
    } else if (activeTypeBtn && activeTypeBtn.textContent.includes("متعدد")) {
      // متعدد الخيارات
      const optionInputs = block.querySelectorAll(
        '.option-item input[type="text"]'
      );
      optionInputs.forEach((input, index) => {
        options.push(input.value);
      });
      const selectedRadio = block.querySelector(
        `input[name="answer-${questionId}"]:checked`
      );
      selectedAnswer = selectedRadio ? selectedRadio.value : "";
    } else {
      // سؤال كتابي
      const answerTextArea = block.querySelector(
        `textarea[name="answer-${questionId}"]`
      );
      answerText = answerTextArea ? answerTextArea.value : "";
    }

    // حفظ الصور
    const savedImages = [];

    // الصور من المعاينة (تشمل الموجودة مسبقاً والجديدة المحفوظة مؤقتاً)
    const imagePreview = block.querySelector(".image-preview");
    if (imagePreview) {
      const previewImages = imagePreview.querySelectorAll("img");
      previewImages.forEach((img) => {
        const tempKey = img.getAttribute("data-temp-key");
        if (tempKey && tempImageStorage.has(tempKey)) {
          // صورة محفوظة مؤقتاً
          const storedImage = tempImageStorage.get(tempKey);
          savedImages.push({
            type: "temp",
            src: storedImage.base64,
            fileName: storedImage.fileName,
            tempKey: tempKey,
            file: storedImage.file,
          });
        } else {
          // صورة موجودة مسبقاً
          savedImages.push({
            type: "existing",
            src: img.src,
            alt: img.alt || "",
          });
        }
      });
    }

    detailedQuestions.push({
      questionId,
      questionText,
      questionType,
      options,
      selectedAnswer,
      answerText,
      savedImages,
      blockHTML: block.outerHTML, // نسخة احتياطية من HTML
    });
  }

  return {
    ...basicFormData,
    detailedQuestions,
  };
}

// دالة استعادة حالة النموذج
function restoreFormState(formData) {
  // استعادة البيانات الأساسية
  document.getElementById("lessonName").value = formData.lessonName;
  document.getElementById("trainerName").value = formData.trainerName;
  document.getElementById("examName").value = formData.examName;
  questionCount = formData.questionCount;
  currentFormId = formData.currentFormId;

  // مسح الأسئلة الحالية
  const questionsContainer = document.getElementById("questions");
  questionsContainer.innerHTML = "";

  // استعادة كل سؤال بالتفصيل
  if (formData.detailedQuestions && formData.detailedQuestions.length > 0) {
    // إعادة تعيين عداد الأسئلة
    let maxQuestionId = 0;
    formData.detailedQuestions.forEach((q) => {
      const qId = parseInt(q.questionId);
      if (qId > maxQuestionId) maxQuestionId = qId;
    });
    questionCount = maxQuestionId;

    formData.detailedQuestions.forEach((questionData, index) => {
      // إنشاء السؤال من جديد
      const block = document.createElement("div");
      block.className = "question-block";
      block.id = `question-${questionData.questionId}`;

      // إضافة HTML الأساسي للسؤال
      block.innerHTML = `
        <div class="question-header">
            <div class="question-title">
                <span class="question-number">${questionData.questionId}</span>
                <h5>السؤال ${questionData.questionId}</h5>
            </div>
            <button type="button" class="delete-btn" onclick="removeQuestion(this)">
                <i class="fas fa-trash"></i> حذف
            </button>
        </div>

        <div class="mb-3">
            <label>نص السؤال:</label>
            <textarea name="text" required>${
              questionData.questionText
            }</textarea>
        </div>

        <div class="mb-3">
            <label>نوع السؤال:</label>
            <div class="question-type-selector">
                <button type="button" class="type-btn ${
                  questionData.questionType.includes("صح") ? "active" : ""
                }" onclick="selectQuestionType(${
        questionData.questionId
      }, 'true_false')">
                    <i class="fas fa-check-circle"></i> صح / خطأ
                </button>
                <button type="button" class="type-btn ${
                  questionData.questionType.includes("متعدد") ? "active" : ""
                }" onclick="selectQuestionType(${
        questionData.questionId
      }, 'multiple_choice')">
                    <i class="fas fa-list-ul"></i> متعدد الخيارات
                </button>
                <button type="button" class="type-btn ${
                  questionData.questionType.includes("كتابي") ||
                  (!questionData.questionType.includes("صح") &&
                    !questionData.questionType.includes("متعدد"))
                    ? "active"
                    : ""
                }" onclick="selectQuestionType(${
        questionData.questionId
      }, 'classic')">
                    <i class="fas fa-pen"></i> سؤال كتابي
                </button>
            </div>
        </div>

        <div id="options-${questionData.questionId}"></div>

        <div class="mb-3">
            <label>صور السؤال (اختياري):</label>
            <div class="image-upload-section">
                <input type="file" accept="image/*" name="image" onchange="previewImage(this)" multiple />
                <button type="button" class="add-image-btn" onclick="addImageInput(this)">
                    <i class="fas fa-plus"></i> إضافة صورة أخرى
                </button>
                <div class="image-preview"></div>
            </div>
        </div>
      `;

      questionsContainer.appendChild(block);

      // استعادة نوع السؤال والخيارات
      if (questionData.questionType.includes("صح")) {
        // صح/خطأ
        selectQuestionType(questionData.questionId, "true_false");
        if (questionData.selectedAnswer) {
          setTimeout(() => {
            const radioToSelect = block.querySelector(
              `input[name="answer-${questionData.questionId}"][value="${questionData.selectedAnswer}"]`
            );
            if (radioToSelect) radioToSelect.checked = true;
          }, 100);
        }
      } else if (questionData.questionType.includes("متعدد")) {
        // متعدد الخيارات
        selectQuestionType(questionData.questionId, "multiple_choice");
        setTimeout(() => {
          const optionsContainer = document.getElementById(
            `options-${questionData.questionId}`
          );
          if (optionsContainer && questionData.options) {
            // مسح الخيارات الموجودة وإضافة المحفوظة
            optionsContainer.innerHTML = "";
            questionData.options.forEach((optionText, optionIndex) => {
              const optionDiv = document.createElement("div");
              optionDiv.className = "option-item";
              optionDiv.innerHTML = `
                <input type="radio" name="answer-${
                  questionData.questionId
                }" value="${optionIndex}" ${
                questionData.selectedAnswer == optionIndex ? "checked" : ""
              }>
                <input type="text" placeholder="الخيار ${
                  optionIndex + 1
                }" value="${optionText}">
                <button type="button" onclick="this.parentElement.remove()">
                  <i class="fas fa-trash"></i>
                </button>
              `;
              optionsContainer.appendChild(optionDiv);
            });

            // إضافة زر إضافة خيار جديد
            const addOptionBtn = document.createElement("button");
            addOptionBtn.type = "button";
            addOptionBtn.className = "add-option-btn";
            addOptionBtn.innerHTML = '<i class="fas fa-plus"></i> إضافة خيار';
            addOptionBtn.onclick = () => addOption(questionData.questionId);
            optionsContainer.appendChild(addOptionBtn);
          }
        }, 100);
      } else {
        // سؤال كتابي
        selectQuestionType(questionData.questionId, "classic");
        if (questionData.answerText) {
          setTimeout(() => {
            const answerTextArea = block.querySelector(
              `textarea[name="answer-${questionData.questionId}"]`
            );
            if (answerTextArea) answerTextArea.value = questionData.answerText;
          }, 100);
        }
      }

      // استعادة الصور
      if (questionData.savedImages && questionData.savedImages.length > 0) {
        setTimeout(() => {
          const imagePreview = block.querySelector(".image-preview");
          if (imagePreview) {
            questionData.savedImages.forEach((imageData) => {
              const imgDiv = document.createElement("div");
              imgDiv.className = "image-container";
              imgDiv.style.position = "relative";
              imgDiv.style.display = "inline-block";
              imgDiv.style.margin = "5px";

              const img = document.createElement("img");
              img.src = imageData.src;
              img.alt = imageData.alt || imageData.fileName || "صورة السؤال";
              img.style.maxWidth = "180px";
              img.style.maxHeight = "120px";
              img.style.borderRadius = "8px";
              img.style.objectFit = "cover";
              img.style.boxShadow = "0 1px 4px rgba(0,0,0,0.12)";
              img.style.margin = "5px";

              // إعادة تعيين مفتاح التخزين المؤقت إذا كانت صورة مؤقتة
              if (imageData.type === "temp" && imageData.tempKey) {
                // إعادة حفظ الصورة في التخزين المؤقت بنفس المفتاح
                tempImageStorage.set(imageData.tempKey, {
                  file: imageData.file,
                  base64: imageData.src,
                  fileName: imageData.fileName,
                  type: imageData.file ? imageData.file.type : "image/*",
                  timestamp: Date.now(),
                });
                img.setAttribute("data-temp-key", imageData.tempKey);
              }

              const removeBtn = document.createElement("button");
              removeBtn.type = "button";
              removeBtn.className = "delete-image-btn";
              removeBtn.innerHTML = '<i class="fas fa-times"></i>';

              // إعداد زر الحذف بناءً على نوع الصورة
              if (imageData.type === "temp" && imageData.tempKey) {
                removeBtn.onclick = () => {
                  tempImageStorage.delete(imageData.tempKey);
                  imgDiv.remove();
                };
              } else {
                removeBtn.onclick = () => imgDiv.remove();
              }

              imgDiv.appendChild(img);
              imgDiv.appendChild(removeBtn);
              imagePreview.appendChild(imgDiv);
            });
          }
        }, 150);
      }
    });
  }
}

// دالة تصفير النموذج
function resetForm() {
  // إزالة أي زر تراجع موجود مسبقاً
  const existingButton = document.getElementById("floatingUndoBtn");
  if (existingButton) {
    existingButton.remove();
  }

  // التحقق من وجود بيانات للتصفير
  const hasData =
    document.getElementById("lessonName").value ||
    document.getElementById("trainerName").value ||
    document.getElementById("examName").value ||
    questionCount > 0;

  if (!hasData) {
    showInfo("لا توجد بيانات لتصفيرها", "النموذج فارغ بالفعل");
    return;
  }

  showConfirmModal(
    "تأكيد التصفير",
    "⚠️ هذا الإجراء سيحذف جميع الأسئلة والبيانات الحالية. هل أنت متأكد؟",
    async () => {
      // حفظ الحالة الحالية للتراجع
      undoResetData = await saveCurrentFormState();

      // تصفير جميع الحقول
      document.getElementById("lessonName").value = "";
      document.getElementById("trainerName").value = "";
      document.getElementById("examName").value = "";

      // تصفير الأسئلة
      document.getElementById("questions").innerHTML = "";
      questionCount = 0;
      currentFormId = null;

      // عرض رسالة نجاح بسيطة
      showSuccess("تم تصفير جميع الحقول والأسئلة بنجاح!", "تم التصفير!", {
        autoClose: 3000,
      });

      // إنشاء وعرض الزر العائم
      showFloatingUndoButton();

      // بدء العد التنازلي
      startUndoCountdown();
    }
  );
}

// دالة إنشاء وعرض الزر العائم
function showFloatingUndoButton() {
  // إزالة أي زر عائم موجود مسبقاً
  const existingButton = document.getElementById("floatingUndoBtn");
  if (existingButton) {
    existingButton.remove();
  }

  // إنشاء الزر العائم
  const floatingButton = document.createElement("div");
  floatingButton.id = "floatingUndoBtn";
  floatingButton.innerHTML = `
    <div class="floating-undo-content">
      <div class="floating-undo-text">
        <i class="fas fa-undo"></i>
        يمكنك التراجع عن التصفير في غضون <span id="floatingCountdown">10</span> ثوانٍ
      </div>
      <button onclick="undoReset()" class="floating-undo-button">
        <i class="fas fa-undo"></i> تراجع
      </button>
    </div>
  `;

  // إضافة الزر إلى الصفحة
  document.body.appendChild(floatingButton);

  // تأثير الظهور
  setTimeout(() => {
    floatingButton.classList.add("show");
  }, 500); // تأخير أكبر للتأكد من رؤية الزر
}

// دالة بدء العد التنازلي للتراجع
function startUndoCountdown() {
  let timeLeft = 10;
  const countdownElement = document.getElementById("floatingCountdown");
  const undoButton = document.getElementById("floatingUndoBtn");

  const countdown = setInterval(() => {
    timeLeft--;
    if (countdownElement) {
      countdownElement.textContent = timeLeft;
    }

    if (timeLeft <= 0) {
      clearInterval(countdown);
      // إزالة إمكانية التراجع
      undoResetData = null;

      // إخفاء الزر العائم
      if (undoButton) {
        undoButton.classList.add("hide");
        setTimeout(() => {
          undoButton.remove();
        }, 500);
      }
    }
  }, 1000);

  // حفظ مرجع المؤقت لإمكانية إلغاؤه
  undoResetTimeout = countdown;
}

// دالة التراجع عن التصفير
function undoReset() {
  if (!undoResetData) {
    showWarning("لا يمكن التراجع، انتهت المهلة المحددة");
    return;
  }

  // إيقاف العد التنازلي
  if (undoResetTimeout) {
    clearInterval(undoResetTimeout);
    undoResetTimeout = null;
  }

  // إخفاء الزر العائم
  const floatingButton = document.getElementById("floatingUndoBtn");
  if (floatingButton) {
    floatingButton.classList.add("hide");
    setTimeout(() => {
      floatingButton.remove();
    }, 300);
  }

  // استعادة الحالة السابقة
  restoreFormState(undoResetData);
  undoResetData = null;

  // عرض رسالة تأكيد
  showSuccess("تم استعادة جميع البيانات والأسئلة بنجاح!", "تم التراجع!", {
    autoClose: 3000,
  });
}

// دالة حفظ وتصدير النموذج
async function saveAndExportForm() {
  if (!currentTrainer) {
    showWarning("يرجى تسجيل الدخول أولاً", "غير مسجل الدخول");
    return;
  }

  const lessonName = document.getElementById("lessonName").value.trim();
  const trainerName = document.getElementById("trainerName").value.trim();
  const examName = document.getElementById("examName").value.trim();
  const questions = await collectQuestions();

  if (!lessonName || !trainerName) {
    showWarning("يرجى إدخال اسم الدرس واسم المدرب", "بيانات ناقصة");
    return;
  }

  if (questions.length === 0) {
    showWarning("يرجى إضافة سؤال واحد على الأقل", "لا توجد أسئلة");
    return;
  }

  // عرض رسالة تأكيد
  showConfirmModal(
    "حفظ وتصدير النموذج",
    "سيتم تصدير النموذج أولاً ثم حفظه في النظام. هل تريد المتابعة؟",
    async () => {
      try {
        // بدء العملية
        showLoading("جار تصدير النموذج...", "عملية التصدير والحفظ");

        // الخطوة 1: تصدير النموذج
        const exportResponse = await fetch(`${window.API_BASE}/export`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trainerId: currentTrainer.id,
            lessonName,
            trainerName,
            examName,
            questions,
          }),
        });

        if (!exportResponse.ok) {
          const errorData = await exportResponse.json();
          throw new Error(errorData.message || "حدث خطأ أثناء التصدير");
        }

        // تحميل الملف المصدر وتنزيله فوراً
        const blob = await exportResponse.blob();
        let filename = "questions.docx";
        const disposition = exportResponse.headers.get("Content-Disposition");
        if (disposition && disposition.includes("filename=")) {
          filename = decodeURIComponent(
            disposition.split("filename=")[1].trim().replace(/['"]/g, "")
          );
        }
        const url_download = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url_download;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url_download);

        // تحديث رسالة التحميل بعد تنزيل الملف
        const modalBody = document.getElementById("customModalBody");
        modalBody.innerHTML = "تم تنزيل الملف! جار حفظ النموذج في النظام...";

        // الخطوة 2: حفظ النموذج
        const url = currentFormId
          ? `${window.API_BASE}/update-form/${currentFormId}`
          : `${window.API_BASE}/save-form`;
        const method = currentFormId ? "PUT" : "POST";

        const saveResponse = await fetch(url, {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trainerId: currentTrainer.id,
            lessonName: lessonName,
            trainerName: trainerName,
            examName: examName,
            questions: questions,
          }),
        });

        const saveData = await saveResponse.json();

        if (!saveData.success) {
          throw new Error(saveData.message || "حدث خطأ في حفظ النموذج");
        }

        // حفظ ID النموذج إذا كان جديداً
        if (!currentFormId) {
          currentFormId = saveData.formId;
        }

        // إخفاء رسالة التحميل
        hideLoading();

        // إعادة تحميل السجلات
        loadSavedForms();

        // عرض رسالة النجاح مع رابط للمراجعة
        const successMessage = `
          <div style="text-align: center;">
            <p>تم تصدير النموذج وحفظه بنجاح!</p>
            <p style="margin: 1rem 0;">📄 <strong>${filename}</strong> تم تحميله</p>
            <p style="margin: 1rem 0;">💾 تم حفظ النموذج في النظام</p>
            <button 
              onclick="viewSavedForm('${currentFormId || saveData.formId}')" 
              style="
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 12px;
                cursor: pointer;
                font-weight: 600;
                margin-top: 1rem;
                transition: all 0.3s ease;
              "
              onmouseover="this.style.background='linear-gradient(135deg, #059669, #047857)'"
              onmouseout="this.style.background='linear-gradient(135deg, #10b981, #059669)'"
            >
              <i class="fas fa-eye"></i> مراجعة النموذج المحفوظ
            </button>
          </div>
        `;

        showSuccess(successMessage, "تمت العملية بنجاح!", { autoClose: false });
      } catch (error) {
        hideLoading();
        console.error("Error:", error);
        showError(error.message || "حدث خطأ أثناء العملية", "خطأ في العملية");
      }
    }
  );
}

// دالة مساعدة للانتقال إلى النموذج المحفوظ
function viewSavedForm(formId) {
  closeModal();
  showTab("saved");

  // تمرير معرف النموذج للتمييز بصرياً (اختياري)
  setTimeout(() => {
    const formCards = document.querySelectorAll(".form-card");
    formCards.forEach((card) => {
      const editBtn = card.querySelector(`[onclick*="${formId}"]`);
      if (editBtn) {
        card.style.border = "3px solid #10b981";
        card.style.boxShadow = "0 4px 20px rgba(16, 185, 129, 0.3)";
        card.scrollIntoView({ behavior: "smooth", block: "center" });

        // إزالة التمييز بعد 3 ثوانٍ
        setTimeout(() => {
          card.style.border = "";
          card.style.boxShadow = "";
        }, 3000);
      }
    });
  }, 500);
}

// دالة حفظ وتصدير النموذج في قسم التعديل
async function saveAndExportEditForm() {
  if (!currentTrainer || !editingFormId) {
    showWarning("يرجى تسجيل الدخول أولاً", "غير مسجل الدخول");
    return;
  }

  const lessonName = document.getElementById("editLessonName").value.trim();
  const trainerName = document.getElementById("editTrainerName").value.trim();
  const examName = document.getElementById("editExamName").value.trim();
  const questions = await collectEditQuestions();

  if (!lessonName || !trainerName) {
    showWarning("يرجى إدخال اسم الدرس واسم المدرب", "بيانات ناقصة");
    return;
  }

  if (questions.length === 0) {
    showWarning("يرجى إضافة سؤال واحد على الأقل", "لا توجد أسئلة");
    return;
  }

  // عرض رسالة تأكيد
  showConfirmModal(
    "حفظ وتصدير النموذج المُعدل",
    "سيتم تصدير النموذج المُعدل أولاً ثم حفظ التعديلات في النظام. هل تريد المتابعة؟",
    async () => {
      try {
        // بدء العملية
        showLoading("جار تصدير النموذج المُعدل...", "عملية التصدير والحفظ");

        // الخطوة 1: تصدير النموذج
        const exportResponse = await fetch(`${window.API_BASE}/export`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trainerId: currentTrainer.id,
            lessonName,
            trainerName,
            examName,
            questions,
          }),
        });

        if (!exportResponse.ok) {
          const errorData = await exportResponse.json();
          throw new Error(errorData.message || "حدث خطأ أثناء التصدير");
        }

        // تحميل الملف المصدر وتنزيله فوراً
        const blob = await exportResponse.blob();
        let filename = "questions.docx";
        const disposition = exportResponse.headers.get("Content-Disposition");
        if (disposition && disposition.includes("filename=")) {
          filename = decodeURIComponent(
            disposition.split("filename=")[1].trim().replace(/['"]/g, "")
          );
        }
        const url_download = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url_download;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url_download);

        // تحديث رسالة التحميل بعد تنزيل الملف
        const modalBody = document.getElementById("customModalBody");
        modalBody.innerHTML = "تم تنزيل الملف! جار حفظ التعديلات في النظام...";

        // الخطوة 2: حفظ التعديلات
        const saveResponse = await fetch(
          `${window.API_BASE}/update-form/${editingFormId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              trainerId: currentTrainer.id,
              lessonName: lessonName,
              trainerName: trainerName,
              examName: examName,
              questions: questions,
            }),
          }
        );

        const saveData = await saveResponse.json();

        if (!saveData.success) {
          throw new Error(saveData.message || "حدث خطأ في حفظ التعديلات");
        }

        // إخفاء رسالة التحميل
        hideLoading();

        // إعادة تحميل السجلات
        loadSavedForms();

        // عرض رسالة النجاح مع رابط للمراجعة
        const successMessage = `
          <div style="text-align: center;">
            <p>تم تصدير النموذج المُعدل وحفظ التعديلات بنجاح!</p>
            <p style="margin: 1rem 0;">📄 <strong>${filename}</strong> تم تحميله</p>
            <p style="margin: 1rem 0;">✏️ تم حفظ التعديلات في النظام</p>
            <button 
              onclick="viewSavedForm('${editingFormId}')" 
              style="
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 12px;
                cursor: pointer;
                font-weight: 600;
                margin-top: 1rem;
                transition: all 0.3s ease;
              "
              onmouseover="this.style.background='linear-gradient(135deg, #059669, #047857)'"
              onmouseout="this.style.background='linear-gradient(135deg, #10b981, #059669)'"
            >
              <i class="fas fa-eye"></i> مراجعة النموذج المُحدث
            </button>
          </div>
        `;

        showSuccess(successMessage, "تمت العملية بنجاح!", { autoClose: false });
      } catch (error) {
        hideLoading();
        console.error("Error:", error);
        showError(error.message || "حدث خطأ أثناء العملية", "خطأ في العملية");
      }
    }
  );
}

// دالة اختبار جميع أنواع التنبيهات (للتطوير فقط)
function testAllAlerts() {
  let step = 0;
  const tests = [
    () => showSuccess("تم الحفظ بنجاح!", "عملية ناجحة", { autoClose: 3000 }),
    () => showError("حدث خطأ في الاتصال بالخادم", "خطأ في الشبكة"),
    () => showWarning("يرجى ملء جميع الحقول المطلوبة", "بيانات ناقصة"),
    () => showInfo("سيتم حفظ البيانات تلقائياً كل دقيقة", "معلومات مفيدة"),
    () =>
      showConfirmModal(
        "حذف البيانات",
        "هل أنت متأكد من حذف جميع البيانات؟",
        () => showSuccess("تم الحذف بنجاح"),
        () => showInfo("تم إلغاء العملية")
      ),
    () => showLoading("جار تحميل البيانات..."),
  ];

  function runNextTest() {
    if (step < tests.length) {
      tests[step]();
      step++;
      setTimeout(runNextTest, step === tests.length ? 2000 : 4000);
    } else {
      hideLoading();
      showInfo("انتهى اختبار جميع التنبيهات", "اكتمل الاختبار");
    }
  }

  runNextTest();
}

// تفعيل اختبار التنبيهات بالضغط على Ctrl+Alt+T (للتطوير فقط)
document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "t") {
    testAllAlerts();
  }

  // اختبار التخزين المؤقت بالضغط على Ctrl+Alt+S
  if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "s") {
    showTempStorageInfo();
  }

  // تحليل الصور في النموذج بالضغط على Ctrl+Alt+I
  if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "i") {
    debugImagesInForm();
  }
});

// ===== دوال نافذة تأكيد إضافة المدرب =====

// متغيرات عامة لنافذة تأكيد المدرب
let pendingTrainerData = null;

// دالة عرض نافذة تأكيد إضافة المدرب
function showTrainerConfirmModal(name, username, password) {
  // حفظ بيانات المدرب المعلقة
  pendingTrainerData = { name, username, password };

  // تعيين المعلومات في النافذة
  document.getElementById("confirmTrainerName").textContent = name;
  document.getElementById("confirmTrainerUsername").textContent = username;
  document.getElementById("confirmTrainerPassword").textContent = "••••••••";
  document.getElementById("confirmTrainerPassword").className =
    "password-masked";

  // إظهار النافذة
  document.getElementById("trainerConfirmModal").style.display = "block";
}

// دالة إغلاق نافذة تأكيد المدرب
function closeTrainerConfirmModal() {
  document.getElementById("trainerConfirmModal").style.display = "none";
  pendingTrainerData = null;
}

// دالة تبديل عرض كلمة المرور
function togglePasswordDisplay() {
  const passwordSpan = document.getElementById("confirmTrainerPassword");
  const toggleBtn = document.querySelector(".password-display button");

  if (passwordSpan.classList.contains("password-masked")) {
    // إظهار كلمة المرور
    passwordSpan.textContent = pendingTrainerData.password;
    passwordSpan.className = "password-visible";
    toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> إخفاء';
  } else {
    // إخفاء كلمة المرور
    passwordSpan.textContent = "••••••••";
    passwordSpan.className = "password-masked";
    toggleBtn.innerHTML = '<i class="fas fa-eye"></i> كشف';
  }
}

// دالة تأكيد إضافة المدرب
async function confirmAddTrainer() {
  if (!pendingTrainerData) {
    showError("لا توجد بيانات مدرب للتأكيد");
    return;
  }

  // إغلاق النافذة
  closeTrainerConfirmModal();

  // زر التحميل البسيط
  const submitBtn = document.querySelector(
    '#addTrainerForm button[type="submit"]'
  );
  const originalBtnHtml = submitBtn ? submitBtn.innerHTML : null;
  if (submitBtn) {
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> جار الإضافة...';
  }

  try {
    const res = await fetch(`${window.API_BASE}/add-trainer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requesterId: currentTrainer.id,
        name: pendingTrainerData.name,
        username: pendingTrainerData.username,
        password: pendingTrainerData.password,
      }),
    });

    const data = await res.json();
    if (!data.success) {
      showError(data.message || "فشل إضافة المدرب");
      return;
    }

    showSuccess("تم إضافة المدرب بنجاح");

    // تفريغ الحقول
    const nameEl = document.getElementById("newTrainerName");
    const usernameEl = document.getElementById("newTrainerUsername");
    const passwordEl = document.getElementById("newTrainerPassword");
    const passwordConfirmEl = document.getElementById(
      "newTrainerPasswordConfirm"
    );

    if (nameEl) nameEl.value = "";
    if (usernameEl) usernameEl.value = "";
    if (passwordEl) passwordEl.value = "";
    if (passwordConfirmEl) passwordConfirmEl.value = "";

    // إعادة تعيين حالة كلمة المرور
    const passwordMatchStatus = document.getElementById("passwordMatchStatus");
    if (passwordMatchStatus) {
      passwordMatchStatus.textContent = "";
      passwordMatchStatus.className = "form-text";
    }
  } catch (e) {
    console.error(e);
    showError("حدث خطأ أثناء الاتصال بالخادم");
  } finally {
    if (submitBtn && originalBtnHtml) {
      submitBtn.innerHTML = originalBtnHtml;
    }
  }
}

// ===== دوال رفع الملفات =====

// دالة تبديل خيارات الإدخال
function switchInputOption(option) {
  // حفظ النص الحالي قبل التبديل
  const currentText = document.getElementById("lessonText").value;
  console.log("Current text before switching:", currentText);

  // تفعيل/تعطيل الأزرار
  document
    .querySelectorAll(".option-btn")
    .forEach((btn) => btn.classList.remove("active"));
  const activeBtn = document.querySelector(`[data-option="${option}"]`);
  if (activeBtn) activeBtn.classList.add("active");

  // الأقسام
  const textSection = document.getElementById("textInput");
  const fileSection = document.getElementById("fileInput");

  // إخفاء الكل
  [textSection, fileSection].forEach((sec) => {
    if (!sec) return;
    sec.classList.remove("active");
    sec.style.display = "none";
  });

  // إظهار المطلوب بشكل صريح أيضًا (لتجاوز أي ستايل مضمّن)
  if (option === "text" && textSection) {
    textSection.classList.add("active");
    textSection.style.display = "block";
    // استعادة النص المحفوظ
    document.getElementById("lessonText").value = currentText;
    console.log(
      "Switched to text option, lessonText value restored:",
      document.getElementById("lessonText").value
    );
  }
  if (option === "file" && fileSection) {
    fileSection.classList.add("active");
    fileSection.style.display = "block";
    // استعادة النص المحفوظ
    document.getElementById("lessonText").value = currentText;
    console.log(
      "Switched to file option, lessonText value restored:",
      document.getElementById("lessonText").value
    );
  }

  // التأكد من أن النص يبقى في textarea حتى لو كان في قسم مخفي
  if (currentText && currentText.trim().length > 0) {
    const lessonTextArea = document.getElementById("lessonText");
    lessonTextArea.value = currentText;
    console.log(
      "Text preserved in lessonText after switching:",
      lessonTextArea.value
    );
  }
}

// دالة معالجة رفع الملف
async function handleFileUpload(input) {
  const file = input.files[0];
  if (!file) return;

  // إظهار معلومات الملف
  document.getElementById("fileName").textContent = file.name;
  document.getElementById("uploadPlaceholder").style.display = "none";
  document.getElementById("fileInfo").style.display = "block";

  // إظهار حالة المعالجة
  document.getElementById("fileStatus").style.display = "block";
  document.getElementById("statusText").textContent = "جار رفع الملف...";

  try {
    // التحقق من نوع الملف
    const isImage = file.type.startsWith("image/");
    const isDocument =
      file.type.includes("pdf") ||
      file.type.includes("word") ||
      file.type.includes("text") ||
      file.type.includes("rtf");

    if (isImage) {
      // للملفات الصورية، لا نحتاج لاستخراج النص
      document.getElementById("statusText").textContent =
        "تم رفع الصورة بنجاح! سيتم تحليلها في Gemini";
      document.getElementById("statusText").style.color = "#10b981";

      // إظهار شريط التقدم
      document.getElementById("progressFill").style.width = "100%";

      // إخفاء حالة المعالجة بعد ثانيتين
      setTimeout(() => {
        document.getElementById("fileStatus").style.display = "none";
      }, 2000);

      // إظهار رسالة نجاح
      showSuccess(
        `تم رفع الصورة "${file.name}" بنجاح! سيتم تحليلها مباشرة في Gemini لإنشاء الأسئلة.`
      );

      console.log("Image uploaded successfully:", file.name, file.type);
    } else if (isDocument) {
      // للملفات النصية، استخراج النص كالمعتاد
      const formData = new FormData();
      formData.append("file", file);

      // رفع الملف
      const response = await fetch(`${window.API_BASE}/upload-lesson-file`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`خطأ في الخادم: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // لا نحتاج لتحديث textarea - الملف سيتم تحليله مباشرة في Gemini
        console.log(
          "Document uploaded successfully, will be analyzed directly in Gemini"
        );

        // إظهار رسالة نجاح
        document.getElementById(
          "statusText"
        ).textContent = `تم رفع الملف بنجاح! سيتم تحليله في Gemini`;
        document.getElementById("statusText").style.color = "#10b981";

        // إظهار شريط التقدم
        document.getElementById("progressFill").style.width = "100%";

        // إخفاء حالة المعالجة بعد ثانيتين
        setTimeout(() => {
          document.getElementById("fileStatus").style.display = "none";
        }, 2000);

        // إظهار رسالة نجاح
        showSuccess(
          `تم رفع الملف "${file.name}" بنجاح! سيتم تحليله مباشرة في Gemini لإنشاء الأسئلة.`
        );
      } else {
        throw new Error(data.message || "فشل في معالجة الملف");
      }
    } else {
      throw new Error("نوع الملف غير مدعوم");
    }
  } catch (error) {
    console.error("خطأ في رفع الملف:", error);
    document.getElementById("statusText").textContent = `خطأ: ${error.message}`;
    document.getElementById("statusText").style.color = "#ef4444";

    // إخفاء حالة المعالجة بعد 3 ثوان
    setTimeout(() => {
      document.getElementById("fileStatus").style.display = "none";
    }, 3000);

    showError(error.message, "خطأ في رفع الملف");
  }
}

// دالة إزالة الملف المرفوع
function removeUploadedFile() {
  // إعادة تعيين input الملف
  document.getElementById("lessonFile").value = "";

  // إظهار placeholder
  document.getElementById("uploadPlaceholder").style.display = "block";
  document.getElementById("fileInfo").style.display = "none";

  // إخفاء حالة المعالجة
  document.getElementById("fileStatus").style.display = "none";

  // مسح النص من textarea
  document.getElementById("lessonText").value = "";
}

// ===== دالة اقتراح الأسئلة باستخدام Gemini API =====

// دالة اقتراح الأسئلة
async function suggestQuestions() {
  // التحقق من وجود ملف مرفوع
  const fileInput = document.getElementById("lessonFile");
  const lessonText = document.getElementById("lessonText").value.trim();

  let hasFile = false;
  let file = null;

  if (fileInput && fileInput.files && fileInput.files.length > 0) {
    hasFile = true;
    file = fileInput.files[0];
    console.log(
      "📁 ملف مرفوع:",
      file.name,
      "حجم:",
      file.size,
      "نوع:",
      file.type
    );
  }

  // تحديث المتغيرات من الحقول قبل الاستخدام
  trueFalseCount =
    parseInt(document.getElementById("trueFalseCount").value) || 0;
  multipleChoiceCount =
    parseInt(document.getElementById("multipleChoiceCount").value) || 0;
  classicCount = parseInt(document.getElementById("classicCount").value) || 0;

  // التحقق من إجمالي عدد الأسئلة
  const totalQuestions = trueFalseCount + multipleChoiceCount + classicCount;

  console.log("suggestQuestions called");
  console.log("hasFile:", hasFile);
  if (hasFile) {
    console.log("file:", file.name, file.type, file.size);
  } else {
    console.log("lessonText length:", lessonText.length);
  }
  console.log("إعدادات الأسئلة:", {
    trueFalse: trueFalseCount,
    multipleChoice: multipleChoiceCount,
    classic: classicCount,
    total: totalQuestions,
  });

  // التحقق من وجود محتوى (ملف أو نص)
  if (!hasFile && !lessonText) {
    showError("يرجى رفع ملف أو إدخال نص الدرس أولاً", "تحذير");
    return;
  }

  if (totalQuestions === 0) {
    showError("يرجى تحديد عدد الأسئلة المطلوبة", "تحذير");
    return;
  }

  // إظهار حالة التحميل
  const suggestBtn = document.getElementById("suggestQuestionsBtn");
  const suggestLoading = document.getElementById("suggestLoading");
  const suggestError = document.getElementById("suggestError");

  suggestBtn.style.display = "none";
  suggestLoading.style.display = "block";
  suggestError.style.display = "none";

  try {
    console.log("إرسال طلب اقتراح الأسئلة...");

    let requestBody;
    let headers;

    if (hasFile) {
      // إرسال الملف مباشرة
      console.log("📁 إرسال الملف مباشرة:", file.name);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("questionCount", totalQuestions);
      formData.append(
        "questionTypes",
        JSON.stringify({
          true_false: trueFalseCount,
          multiple_choice: multipleChoiceCount,
          classic: classicCount,
        })
      );
      formData.append("detailedRequest", "true");

      requestBody = formData;
      headers = {}; // لا نحتاج Content-Type مع FormData

      console.log("📤 إرسال ملف مع البيانات:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        questionCount: totalQuestions,
        questionTypes: {
          true_false: trueFalseCount,
          multiple_choice: multipleChoiceCount,
          classic: classicCount,
        },
      });
    } else {
      // إرسال النص (للتوافق مع الإصدارات السابقة)
      console.log("📝 إرسال النص:", lessonText.substring(0, 100) + "...");
      console.log("عدد الأسئلة:", totalQuestions);

      requestBody = {
        lessonText: lessonText,
        questionCount: totalQuestions,
        questionTypes: {
          true_false: trueFalseCount,
          multiple_choice: multipleChoiceCount,
          classic: classicCount,
        },
        detailedRequest: true,
      };

      headers = {
        "Content-Type": "application/json",
      };

      console.log("📤 البيانات المرسلة إلى الخادم:", requestBody);
    }

          const response = await fetch(`${window.API_BASE}/suggest-questions`, {
      method: "POST",
      headers: headers,
      body: requestBody,
    });

    console.log("استلام استجابة من الخادم");
    console.log("حالة الاستجابة:", response.status);
    console.log("رؤوس الاستجابة:", response.headers);

    if (!response.ok) {
      throw new Error(
        `خطأ في الخادم: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("بيانات الاستجابة:", data);

    if (data.success) {
      // إضافة الأسئلة المقترحة إلى النموذج
      addSuggestedQuestions(data.questions);

      // رسالة نجاح مفصلة
      let successMessage = `تم اقتراح ${data.questions.length} سؤال بنجاح!`;
      if (hasFile) {
        successMessage += `\nتم تحليل الملف: ${file.name}`;
      }
      successMessage += `\nصح وخطأ: ${trueFalseCount} | متعدد الخيارات: ${multipleChoiceCount} | كتابي: ${classicCount}`;

      showSuccess(successMessage);

      console.log("✅ تم استلام الأسئلة بنجاح:", data.questions);
    } else {
      const errorMessage = data.message || "فشل في اقتراح الأسئلة";
      console.error("❌ خطأ من الخادم:", errorMessage);

      // عرض رسالة خطأ مفصلة
      if (errorMessage.includes("عدد الأسئلة المستلمة لا يتطابق")) {
        showError(errorMessage, "خطأ في عدد الأسئلة");
      } else {
        showError(errorMessage, "خطأ في اقتراح الأسئلة");
      }
    }
  } catch (error) {
    console.error("خطأ في اقتراح الأسئلة:", error);

    let errorMessage = "حدث خطأ أثناء الاتصال بالخادم";

    if (error.name === "TypeError" && error.message.includes("fetch")) {
      errorMessage = "لا يمكن الاتصال بالخادم. تأكد من تشغيل الخادم الخلفي.";
    } else if (error.message.includes("خطأ في الخادم")) {
      errorMessage = error.message;
    } else if (error.message.includes("JSON")) {
      errorMessage = "خطأ في معالجة البيانات المستلمة من الخادم";
    }

    showError(errorMessage, "خطأ في الاتصال");
  } finally {
    // إعادة إظهار الزر
    suggestBtn.style.display = "inline-block";
    suggestLoading.style.display = "none";
  }
}

// دالة إضافة الأسئلة المقترحة إلى النموذج
function addSuggestedQuestions(suggestedQuestions) {
  suggestedQuestions.forEach((questionData) => {
    // إنشاء سؤال جديد باستخدام دالة addQuestion الموجودة
    addQuestion();

    // حفظ رقم السؤال الحالي في متغير محلي
    const currentQuestionCount = questionCount;

    // الحصول على السؤال الذي تم إنشاؤه حديثاً
    const questionBlock = document.getElementById(
      `question-${currentQuestionCount}`
    );

    // تعيين نص السؤال
    const questionTextInput = questionBlock.querySelector(
      'textarea[name="text"]'
    );
    if (questionTextInput) {
      questionTextInput.value = questionData.text;
    }

    // تعيين نوع السؤال والإجابة
    if (questionData.type === "multiple_choice") {
      // تحديد نوع السؤال
      selectQuestionType(currentQuestionCount, "multiple_choice");

      // انتظار قليل لإنشاء الخيارات
      setTimeout(() => {
        // تعيين الخيارات
        const optionsContainer =
          questionBlock.querySelector(".options-container");
        if (optionsContainer) {
          // إزالة الخيارات الموجودة
          const existingOptions =
            optionsContainer.querySelectorAll(".option-item");
          existingOptions.forEach((option) => option.remove());

          // إضافة الخيارات الجديدة
          questionData.options.forEach((option, index) => {
            addOption(currentQuestionCount);
            const newOption = optionsContainer.lastElementChild;
            const optionTextInput =
              newOption.querySelector('input[type="text"]');
            const optionRadio = newOption.querySelector('input[type="radio"]');

            if (optionTextInput) optionTextInput.value = option;
            if (optionRadio) optionRadio.value = index;

            // تحديد الإجابة الصحيحة
            if (option === questionData.answer) {
              optionRadio.checked = true;
            }
          });
        }
      }, 200);
    } else if (questionData.type === "true_false") {
      // تحديد نوع السؤال
      selectQuestionType(currentQuestionCount, "true_false");

      // انتظار قليل لإنشاء الخيارات
      setTimeout(() => {
        // تعيين الإجابة الصحيحة
        const correctAnswer = questionData.answer === "صح" ? "true" : "false";
        const radioInput = questionBlock.querySelector(
          `#${correctAnswer}-${currentQuestionCount}`
        );
        if (radioInput) {
          radioInput.checked = true;
        }
      }, 200);
    } else if (questionData.type === "classic") {
      // تحديد نوع السؤال
      selectQuestionType(currentQuestionCount, "classic");

      // انتظار قليل لإنشاء الخيارات
      setTimeout(() => {
        // تعيين الإجابة النموذجية
        const answerInput = questionBlock.querySelector(
          `textarea[name="answer-${currentQuestionCount}"]`
        );
        if (answerInput) {
          answerInput.value = questionData.answer;
        }
      }, 200);
    }
  });
}

// تحذير عند تجاوز المجموع 100 سؤال
function updateTotalWarningMsg(total) {
  const warningDiv = document.getElementById("totalWarningMsg");
  if (!warningDiv) return;
  if (total > 100) {
    warningDiv.style.display = "block";
    warningDiv.innerHTML =
      '<i class="fas fa-exclamation-triangle" style="color:#e53935;margin-left:6px;"></i>مسموح أن يكون مجموع الأسئلة من 1 إلى 100 فقط. الرجاء تقليل العدد.';
  } else {
    warningDiv.style.display = "none";
    warningDiv.innerHTML = "";
  }
}

// تحديث التحذير عند تغيير العدادات
function updateTotalQuestionsCountAndWarning() {
  const tf = parseInt(document.getElementById("trueFalseCount").value) || 0;
  const mc =
    parseInt(document.getElementById("multipleChoiceCount").value) || 0;
  const cl = parseInt(document.getElementById("classicCount").value) || 0;
  const total = tf + mc + cl;
  document.getElementById("totalQuestionsCount").textContent = total;
  updateTotalWarningMsg(total);
}

["trueFalseCount", "multipleChoiceCount", "classicCount"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("input", updateTotalQuestionsCountAndWarning);
  }
});

// عند تحميل الصفحة، تحقق من المجموع أولاً
window.addEventListener(
  "DOMContentLoaded",
  updateTotalQuestionsCountAndWarning
);

async function suggestTrainerCredentials() {
  const nameEl = document.getElementById("newTrainerName");
  const usernameEl = document.getElementById("newTrainerUsername");
  const passwordEl = document.getElementById("newTrainerPassword");
  const passwordConfirmEl = document.getElementById(
    "newTrainerPasswordConfirm"
  );
  const btn = document.getElementById("suggestCredentialsBtn");
  if (btn) btn.disabled = true;

  try {
    const name = nameEl?.value.trim() || "";
    const response = await fetch(
      `${window.API_BASE}/suggest-trainer-credentials`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }
    );
    const data = await response.json();
    if (data.success) {
      usernameEl.value = data.username;
      passwordEl.value = data.password;
      passwordConfirmEl.value = data.password;
      // تحديث حالة تطابق كلمة المرور
      if (typeof initPasswordMatchWatcher === "function")
        initPasswordMatchWatcher();
    } else {
      showError(data.message || "تعذر اقتراح اسم المستخدم وكلمة المرور.");
    }
  } catch (err) {
    showError("حدث خطأ أثناء جلب الاقتراح. تأكد من اتصالك بالخادم.");
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function suggestTrainerUsername() {
  const nameEl = document.getElementById("newTrainerName");
  const usernameEl = document.getElementById("newTrainerUsername");
  const btn = document.getElementById("suggestUsernameBtn");
  if (btn) btn.disabled = true;
  try {
    const name = nameEl?.value.trim() || "";
    const response = await fetch(
      `${window.API_BASE}/suggest-trainer-credentials`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }
    );
    const data = await response.json();
    if (data.success) {
      usernameEl.value = data.username;
    } else {
      showError(data.message || "تعذر اقتراح اسم المستخدم.");
    }
  } catch (err) {
    showError("حدث خطأ أثناء جلب اسم المستخدم. تأكد من اتصالك بالخادم.");
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function suggestTrainerPassword() {
  const passwordEl = document.getElementById("newTrainerPassword");
  const passwordConfirmEl = document.getElementById(
    "newTrainerPasswordConfirm"
  );
  const btn = document.getElementById("suggestPasswordBtn");
  if (btn) btn.disabled = true;
  try {
    const response = await fetch(
      `${window.API_BASE}/suggest-trainer-credentials`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }
    );
    const data = await response.json();
    if (data.success) {
      passwordEl.value = data.password;
      passwordConfirmEl.value = data.password;
      if (typeof initPasswordMatchWatcher === "function")
        initPasswordMatchWatcher();
    } else {
      showError(data.message || "تعذر اقتراح كلمة السر.");
    }
  } catch (err) {
    showError("حدث خطأ أثناء جلب كلمة السر. تأكد من اتصالك بالخادم.");
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function fetchAndRenderTrainersList() {
  const tbody = document.getElementById("trainersListBody");
  const section = document.getElementById("currentTrainersSection");
  if (
    !currentTrainer ||
    currentTrainer.role !== "admin" ||
    (currentTrainer.name !== "نورا صباغ" && currentTrainer.username !== "noura")
  ) {
    if (section) section.style.display = "none";
    return;
  }
  if (section) section.style.display = "block";
  if (!tbody) return;
  tbody.innerHTML =
    '<tr><td colspan="5" style="text-align:center; color:#888;">جاري التحميل...</td></tr>';
  try {
          const response = await fetch(`${window.API_BASE}/all-trainers`);
    const data = await response.json();
    if (data.success && Array.isArray(data.trainers)) {
      // رتب المشرفين في الأعلى
      lastFetchedTrainers = [...data.trainers].sort((a, b) => {
        if ((a.role === "admin" ? 0 : 1) !== (b.role === "admin" ? 0 : 1)) {
          return a.role === "admin" ? -1 : 1;
        }
        return 0;
      });
      if (lastFetchedTrainers.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="5" style="text-align:center; color:#888;">لا يوجد مدربون حالياً</td></tr>';
        return;
      }
      tbody.innerHTML = lastFetchedTrainers
        .map(
          (t, idx) => `
          <tr class="${t.role && t.role.trim() === "admin" ? "admin-row" : ""}">
            <td><span class="role-badge ${
              t.role && t.role.trim() === "admin"
                ? "badge-admin"
                : "badge-trainer"
            }">${
            t.role && t.role.trim() === "admin" ? "مشرف" : "مدرب"
          }</span></td>
            <td>${t.name || ""}</td>
            <td>${t.username || ""}</td>
            <td>
              <span id="pw-mask-${idx}" class="password-masked">••••••••</span>
              <span id="pw-plain-${idx}" class="password-plain" style="display:none;">${
            t.password || ""
          }</span>
              <button type="button" class="btn btn-outline-secondary btn-sm" style="margin-right:8px;" onclick="toggleTrainerPassword(this, ${idx})">
                <i class="fas fa-eye"></i>
              </button>
            </td>
            <td>
              <button type="button" class="btn btn-warning btn-sm" onclick="editTrainer(${idx})">
                <i class="fas fa-edit"></i> تعديل
              </button>
            </td>
          </tr>
        `
        )
        .join("");
    } else {
      tbody.innerHTML =
        '<tr><td colspan="5" style="text-align:center; color:#c00;">تعذر تحميل قائمة المدربين</td></tr>';
    }
  } catch (err) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center; color:#c00;">خطأ في الاتصال بالخادم</td></tr>';
  }
}

function editTrainer(idx) {
  pendingEditTrainerIdx = idx;
  const trainer = lastFetchedTrainers[idx];
  if (!trainer) return;
  document.getElementById("editTrainerNameModal").value = trainer.name || "";
  document.getElementById("editTrainerUsername").value = trainer.username || "";
  document.getElementById("editTrainerPassword").value = trainer.password || "";
  document.getElementById("editTrainerPasswordConfirm").value =
    trainer.password || "";
  if (typeof initEditPasswordMatchWatcher === "function")
    initEditPasswordMatchWatcher();
  document.getElementById("editTrainerModal").style.display = "block";
}

function closeEditTrainerModal() {
  document.getElementById("editTrainerModal").style.display = "none";
  pendingEditTrainerIdx = null;
}

// استدعِ الدالة عند فتح تبويب إضافة المدرب
const addTrainerTabBtn = document.getElementById("addTrainerTabBtn");
if (addTrainerTabBtn) {
  addTrainerTabBtn.addEventListener("click", fetchAndRenderTrainersList);
}

async function saveTrainerEdit(event) {
  event.preventDefault();
  if (
    pendingEditTrainerIdx === null ||
    !lastFetchedTrainers[pendingEditTrainerIdx]
  )
    return false;
  const trainer = lastFetchedTrainers[pendingEditTrainerIdx];
  const name = document.getElementById("editTrainerNameModal").value.trim();
  const username = document.getElementById("editTrainerUsername").value.trim();
  const password = document.getElementById("editTrainerPassword").value.trim();
  const passwordConfirm = document
    .getElementById("editTrainerPasswordConfirm")
    .value.trim();
  if (!name || !username || !password) {
    showError("جميع الحقول مطلوبة لتعديل بيانات المدرب.");
    return false;
  }
  if (password !== passwordConfirm) {
    showError("كلمة المرور وتأكيدها غير متطابقتين.");
    document.getElementById("editTrainerPasswordConfirm").focus();
    return false;
  }
  try {
          const response = await fetch(`${window.API_BASE}/edit-trainer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        old_username: trainer.username,
        name,
        username,
        password,
      }),
    });
    const data = await response.json();
    if (data.success) {
      closeEditTrainerModal();
      await fetchAndRenderTrainersList();
      showSuccess("تم حفظ تعديلات المدرب بنجاح.");
    } else {
      showError(data.message || "تعذر حفظ التعديلات.");
    }
  } catch (err) {
    showError("حدث خطأ أثناء حفظ التعديلات. تأكد من اتصالك بالخادم.");
  }
  return false;
}

// تحقق تطابق كلمة المرور في نافذة التعديل
function initEditPasswordMatchWatcher() {
  const pass = document.getElementById("editTrainerPassword");
  const pass2 = document.getElementById("editTrainerPasswordConfirm");
  const statusEl = document.getElementById("editPasswordMatchStatus");
  if (!pass || !pass2 || !statusEl) return;
  const update = () => {
    const v1 = pass.value;
    const v2 = pass2.value;
    if (!v1 && !v2) {
      statusEl.textContent = "";
      statusEl.style.color = "";
      return;
    }
    if (v1 === v2) {
      statusEl.textContent = "كلمة متطابقة";
      statusEl.style.color = "#16a34a";
    } else {
      statusEl.textContent = "غير متطابقة";
      statusEl.style.color = "#dc2626";
    }
  };
  pass.removeEventListener &&
    pass.removeEventListener("input", pass.__matchHandler || (() => {}));
  pass2.removeEventListener &&
    pass2.removeEventListener("input", pass2.__matchHandler || (() => {}));
  pass.__matchHandler = update;
  pass2.__matchHandler = update;
  pass.addEventListener("input", update);
  pass2.addEventListener("input", update);
  update();
}

// أزرار الاقتراح في نافذة التعديل
async function suggestEditTrainerUsername() {
  const nameEl = document.getElementById("editTrainerName");
  const usernameEl = document.getElementById("editTrainerUsername");
  const btn = document.getElementById("editSuggestUsernameBtn");
  if (btn) btn.disabled = true;
  try {
    const name = nameEl?.value.trim() || "";
            const response = await fetch(
          `${window.API_BASE}/suggest-trainer-credentials`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          }
        );
    const data = await response.json();
    if (data.success) {
      usernameEl.value = data.username;
    } else {
      showError(data.message || "تعذر اقتراح اسم المستخدم.");
    }
  } catch (err) {
    showError("حدث خطأ أثناء جلب اسم المستخدم. تأكد من اتصالك بالخادم.");
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function suggestEditTrainerPassword() {
  const passwordEl = document.getElementById("editTrainerPassword");
  const passwordConfirmEl = document.getElementById(
    "editTrainerPasswordConfirm"
  );
  const btn = document.getElementById("editSuggestPasswordBtn");
  if (btn) btn.disabled = true;
  try {
            const response = await fetch(
          `${window.API_BASE}/suggest-trainer-credentials`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          }
        );
    const data = await response.json();
    if (data.success) {
      passwordEl.value = data.password;
      passwordConfirmEl.value = data.password;
      if (typeof initEditPasswordMatchWatcher === "function")
        initEditPasswordMatchWatcher();
    } else {
      showError(data.message || "تعذر اقتراح كلمة السر.");
    }
  } catch (err) {
    showError("حدث خطأ أثناء جلب كلمة السر. تأكد من اتصالك بالخادم.");
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ... existing code ...

function toggleTrainerPassword(btn, idx) {
  const mask = document.getElementById(`pw-mask-${idx}`);
  const plain = document.getElementById(`pw-plain-${idx}`);
  if (!mask || !plain) return;
  const isMasked = mask.style.display !== "none";
  mask.style.display = isMasked ? "none" : "";
  plain.style.display = isMasked ? "" : "none";
  // غيّر الأيقونة
  if (btn && btn.querySelector) {
    const icon = btn.querySelector("i");
    if (icon) icon.className = isMasked ? "fas fa-eye-slash" : "fas fa-eye";
  }
}
