document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open);
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  const header = document.getElementById("header");
  window.addEventListener("scroll", () => {
    header.style.boxShadow = window.scrollY > 10 ? "0 2px 12px rgba(0,0,0,0.5)" : "none";
  });

  const typedEl = document.getElementById("typed");
  const roles = [
    "Full Stack Developer",
    "WordPress + Next.js Specialist",
    "Server Deployment & Production Debugging",
    "CRM / API Integrations (Dynamics 365)",
    "AI Chatbots with RAG + LLMs"
  ];
  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const type = () => {
    const current = roles[roleIndex];
    typedEl.textContent = current.slice(0, charIndex);
    let delay = deleting ? 40 : 90;

    if (!deleting && charIndex === current.length) {
      deleting = true;
      delay = 1600;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      delay = 400;
    }

    charIndex += deleting ? -1 : 1;
    setTimeout(type, delay);
  };

  type();

  document.getElementById("year").textContent = new Date().getFullYear();

  const revealEls = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => observer.observe(el));
});
