document.addEventListener("DOMContentLoaded", () => {
  const headerContainer = document.getElementById("header");
  const pageContent = document.getElementById("page-content");

  if (!headerContainer || !pageContent) return;

  fetch("header.html")
    .then(res => {
      if (!res.ok) throw new Error("Header file not found");
      return res.text();
    })
    .then(html => {
      headerContainer.innerHTML = html;

      // Mobile menu toggle
      const toggle = document.getElementById("menuToggle");
      const navLinks = document.getElementById("navLinks");

      if (toggle && navLinks) {
        toggle.addEventListener("click", () => {
          navLinks.classList.toggle("show");
        });
      }

      // ✅ FIXED HEADER SPACING (ALL PAGES)
      const fixedHeader = headerContainer.querySelector(".bar-fixed");

      // if (fixedHeader) {
      //   const headerHeight = fixedHeader.offsetHeight;
      //   pageContent.style.paddingTop = headerHeight + "px";
      // }

      if (fixedHeader) {
  const headerHeight = fixedHeader.offsetHeight;
  const customPadding = -20; // 👈 change this value
  pageContent.style.paddingTop = (headerHeight + customPadding) + "px";
}


      // Optional fade-in
      pageContent.style.opacity = "1";
    })
    .catch(err => console.error(err));


document.querySelector(".nav-link").addEventListener("click", function (e) {
    e.preventDefault();
    this.parentElement.classList.toggle("active");
});

});


