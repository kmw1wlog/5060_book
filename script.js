document.querySelectorAll("form").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const button = form.querySelector("button[type='submit']");
    if (!button) return;
    button.textContent = "신청이 접수되었습니다";
    button.disabled = true;
  });
});

document.querySelectorAll("a[href^='#']").forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("lock-scroll");
  });
});
