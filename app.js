const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("show");
});
// card js

const frBtn = document.getElementById("fr-toggle-btn");
const frHiddenCards = document.querySelectorAll(".fr-hidden");

frBtn.addEventListener("click", () => {
    frHiddenCards.forEach(card => {
        card.style.display =
            card.style.display === "block" ? "none" : "block";
    });

    frBtn.textContent =
        frBtn.textContent === "View All Articles"
            ? "Hide Articles"
            : "View All Articles";
});
function viewArticles() {
    alert("View All Articles clicked!");
}
//  current pages js start from here 

document.getElementById("current-download-btn").addEventListener("click", () => {
    alert("Download PDF feature coming soon!");
});

document.getElementById("current-toc-btn").addEventListener("click", () => {
    alert("Table of Contents will open here.");
});

// current page js from here
document.querySelectorAll(".peroo-btn").forEach(button => {
    button.addEventListener("click", () => {
        alert("Action triggered!");
    });
});
// cheack
//   announcement js from here
dateInput.addEventListener("change", () => {
    if (dateInput.value) {
        card.classList.add("nx-active");
    } else {
        card.classList.remove("nx-active");
    }
});

// login page js from here
const form = document.getElementById("logForm");

form.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("logEmail").value.trim();
    const password = document.getElementById("logPassword").value.trim();

    if (!email || !password) {
        alert("Please fill in all fields");
        return;
    }

    if (!email.includes("@")) {
        alert("Enter a valid email address");
        return;
    }

    // Simulated login
    alert("Login successful!");
    form.reset();
});


// contact us start from here

document.getElementById("contactForm").addEventListener("submit", function (e) {
  e.preventDefault();

  // Get fields
  const firstName = document.getElementById("firstName");
  const lastName = document.getElementById("lastName");
  const email = document.getElementById("email");
  const subject = document.getElementById("subject");
  const category = document.getElementById("category");
  const message = document.getElementById("message");

  const fields = [firstName, lastName, email, subject, category, message];

  let isValid = true;

  // Clear old errors
  fields.forEach(field => {
    field.classList.remove("contact-error");
  });

  // Empty field check
  fields.forEach(field => {
    if (field.value.trim() === "") {
      field.classList.add("contact-error");
      isValid = false;
    }
  });

  // Email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email.value.trim())) {
    email.classList.add("contact-error");
    isValid = false;
    alert("❌ Please enter a valid email address.");
    return;
  }

  // If any field is invalid
  if (!isValid) {
    alert("⚠️ Please fill in all required fields before submitting the form.");
    return;
  }

  // SUCCESS
  alert("✅ Thank you! Your message has been sent successfully.");

  // Reset form
  document.getElementById("contactForm").reset();
});
// fee page js from here
const feeCards = document.querySelectorAll('.fee-card');

feeCards.forEach(card => {
    card.addEventListener('click', () => {

        // Remove active state from all cards
        feeCards.forEach(item => {
            item.classList.remove('fee-active');
        });

        // Add active state to clicked card
        card.classList.add('fee-active');
    });
});
