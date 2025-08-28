// التحقق من وجود جلسة نشطة
function checkSession() {
  const trainer = localStorage.getItem("trainer");
  if (trainer) {
    window.location.href = "index.html";
  }
}

// تشغيل التحقق عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", checkSession);

// معالجة تسجيل الدخول
document
  .getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorMessage = document.getElementById("errorMessage");
    const errorText = document.getElementById("errorText");
    const loginBtn = document.querySelector(".login-btn");
    const loginForm = document.getElementById("loginForm");

    // إخفاء رسالة الخطأ السابقة
    errorMessage.style.display = "none";

    // التحقق من إدخال البيانات
    if (!username || !password) {
      showError("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    // إظهار حالة التحميل
    loginForm.classList.add("loading");
    loginBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> جار التحقق...';

    try {
      const response = await fetch(`${window.API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        // حفظ بيانات المدرب في localStorage
        localStorage.setItem("trainer", JSON.stringify(data.trainer));

        // إظهار رسالة نجاح
        showSuccess("تم تسجيل الدخول بنجاح");

        // الانتقال إلى الصفحة الرئيسية بعد ثانية
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1000);
      } else {
        showError(data.message || "حدث خطأ أثناء تسجيل الدخول");
      }
    } catch (error) {
      console.error("Error:", error);
      showError("حدث خطأ في الاتصال بالخادم");
    } finally {
      // إزالة حالة التحميل
      loginForm.classList.remove("loading");
      loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> تسجيل الدخول';
    }
  });

// دالة إظهار رسالة خطأ
function showError(message) {
  const errorMessage = document.getElementById("errorMessage");
  const errorText = document.getElementById("errorText");

  errorText.textContent = message;
  errorMessage.style.display = "flex";

  // إخفاء الرسالة تلقائياً بعد 5 ثوان
  setTimeout(() => {
    errorMessage.style.display = "none";
  }, 5000);
}

// دالة إظهار رسالة نجاح
function showSuccess(message) {
  const errorMessage = document.getElementById("errorMessage");
  const errorText = document.getElementById("errorText");

  errorMessage.className = "alert alert-success";
  errorText.innerHTML = '<i class="fas fa-check-circle"></i> ' + message;
  errorMessage.style.display = "flex";
}

// إضافة تأثيرات للحقول
document.querySelectorAll(".form-control").forEach((input) => {
  input.addEventListener("focus", function () {
    this.parentElement.classList.add("focused");
  });

  input.addEventListener("blur", function () {
    if (!this.value) {
      this.parentElement.classList.remove("focused");
    }
  });
});

// إضافة تأثير النقر على الحقول
document.querySelectorAll(".form-control").forEach((input) => {
  input.addEventListener("click", function () {
    this.focus();
  });
});

// إضافة دعم Enter للانتقال بين الحقول
document.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    const activeElement = document.activeElement;
    if (activeElement.tagName === "INPUT") {
      e.preventDefault();
      const inputs = document.querySelectorAll(".form-control");
      const currentIndex = Array.from(inputs).indexOf(activeElement);
      const nextInput = inputs[currentIndex + 1];

      if (nextInput) {
        nextInput.focus();
      } else {
        // إذا كان آخر حقل، قم بتسجيل الدخول
        document.getElementById("loginForm").dispatchEvent(new Event("submit"));
      }
    }
  }
});
