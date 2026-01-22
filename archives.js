const archiveYears = document.querySelectorAll(".archives-year");

archiveYears.forEach(year => {
  const btn = year.querySelector(".archives-year-btn");

  btn.addEventListener("click", () => {
    archiveYears.forEach(item => {
      if (item !== year) {
        item.classList.remove("active");
      }
    });
    year.classList.toggle("active");
  });
});
