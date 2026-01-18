document.addEventListener("DOMContentLoaded", () => {

    /* ===== Load Header ===== */
    fetch("header.html")
        .then(res => {
            if (!res.ok) throw new Error("Header file not found");
            return res.text();
        })
        .then(html => {
            document.getElementById("header").innerHTML = html;

            // Mobile menu toggle
            const toggle = document.getElementById("menuToggle");
            const navLinks = document.getElementById("navLinks");

            if (toggle && navLinks) {
                toggle.addEventListener("click", () => {
                    navLinks.classList.toggle("show");
                });
            }
        })
        .catch(err => console.error(err));


    /* ===== Load Footer ===== */
    fetch("footer.html")
        .then(res => {
            if (!res.ok) throw new Error("Footer file not found");
            return res.text();
        })
        .then(html => {
            document.getElementById("footer").innerHTML = html;
        })
        .catch(err => console.error(err));

});
