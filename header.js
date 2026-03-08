document.addEventListener("DOMContentLoaded", () => {
  const headerContainer = document.getElementById("header");
  const pageContent = document.getElementById("page-content");

  if (!headerContainer) return;

  fetch("header.html")
    .then((res) => {
      if (!res.ok) throw new Error("Header file not found");
      return res.text();
    })
    .then((html) => {
      headerContainer.innerHTML = html;

      // Mobile menu toggle
      const toggle = document.getElementById("menuToggle");
      const navLinks = document.getElementById("navLinks");

      if (toggle && navLinks) {
        toggle.addEventListener("click", () => {
          navLinks.classList.toggle("show");
        });
      }

      // ✅ FIXED HEADER SPACING (ALL PAGES THAT USE page-content)
      if (pageContent) {
        const fixedHeader = headerContainer.querySelector(".bar-fixed");
        if (fixedHeader) {
          const headerHeight = fixedHeader.offsetHeight;
          const customPadding = -20; // 👈 tweak if needed
          pageContent.style.paddingTop = headerHeight + customPadding + "px";
        }

        // Optional fade-in
        pageContent.style.opacity = "1";
      }

      // After header is injected, update auth UI based on current user
      initAuthHeader();
    })
    .catch((err) => console.error(err));
});

function initAuthHeader() {
  // On login page, always show login/register and hide logout, regardless of auth state
  if (window.location.pathname.endsWith("login.html")) {
    const registerLinks = document.querySelectorAll(".auth-register");
    const loginLinks = document.querySelectorAll(".auth-login");
    const logoutLinks = document.querySelectorAll(".auth-logout");
    const emailEl = document.getElementById("header-user-email");

    registerLinks.forEach((el) => (el.style.display = "inline-block"));
    loginLinks.forEach((el) => (el.style.display = "inline-block"));
    logoutLinks.forEach((el) => (el.style.display = "none"));
    // if (emailEl) {
    //   emailEl.innerHTML = '<i class="fa-regular fa-envelope"></i>';
    // }
    return;
  }

  // Update email and auth links based on /api/auth/me
  fetch("/api/auth/me", {
    credentials: "include",
  })
    .then((res) => {
      if (!res.ok) throw new Error("Not authenticated");
      return res.json();
    })
    .then((data) => {
      const emailEl = document.getElementById("header-user-email");
      if (emailEl && data.user) {
        const hasEmail = !!data.user.email;
        const fullName = [data.user.firstName, data.user.lastName]
          .filter(Boolean)
          .join(" ");
        const hasName = !!fullName;

        const identity = hasEmail
          ? data.user.email
          : hasName
            ? fullName
            : "Signed in";
        const iconClass = hasEmail
          ? "fa-regular fa-envelope"
          : "fa-regular fa-user";

        emailEl.innerHTML = '<i class="' + iconClass + '"></i> ' + identity;
      }

      const registerLinks = document.querySelectorAll(".auth-register");
      const loginLinks = document.querySelectorAll(".auth-login");
      const logoutLinks = document.querySelectorAll(".auth-logout");

      registerLinks.forEach((el) => (el.style.display = "none"));
      loginLinks.forEach((el) => (el.style.display = "none"));
      logoutLinks.forEach((el) => (el.style.display = "inline-block"));

      const logoutBtn = document.getElementById("header-logout-btn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
          try {
            await fetch("/api/auth/logout", {
              method: "POST",
              credentials: "include",
            });
          } catch (e) {
            console.error(e);
          } finally {
            // Redirect to login page after logout
            window.location.href = "/login.html";
          }
        });
      }
    })
    .catch(() => {
      // Not logged in: ensure login/register visible, logout hidden
      const registerLinks = document.querySelectorAll(".auth-register");
      const loginLinks = document.querySelectorAll(".auth-login");
      const logoutLinks = document.querySelectorAll(".auth-logout");
      const emailEl = document.getElementById("header-user-email");

      registerLinks.forEach((el) => (el.style.display = "inline-block"));
      loginLinks.forEach((el) => (el.style.display = "inline-block"));
      logoutLinks.forEach((el) => (el.style.display = "none"));
    });
}
