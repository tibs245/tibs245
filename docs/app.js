const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const sections = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !motionPreference.matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.remove("pending");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0 },
  );
  sections.forEach((section) => {
    section.classList.add("pending");
    observer.observe(section);
  });
  // Keyboard focus and a change of motion preference must never leave content hidden.
  document.addEventListener("focusin", (event) => {
    event.target.closest(".reveal")?.classList.remove("pending");
  });
  motionPreference.addEventListener("change", () => {
    if (motionPreference.matches) {
      sections.forEach((section) => section.classList.remove("pending"));
      observer.disconnect();
    }
  });
}
