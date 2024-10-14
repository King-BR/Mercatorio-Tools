function toggleDarkMode() {
  document.body.classList.toggle("light-mode");

  // Save the current theme preference in localStorage
  if (document.body.classList.contains("light-mode")) {
    localStorage.setItem("theme", "light");
  } else {
    localStorage.setItem("theme", "dark");
  }
}

function toggleSpoiler(elementId) {
  const spoiler = document.getElementById(elementId);
  const button = document.getElementById(`spoiler-${elementId}`);
  if (spoiler.style.display === "none" || !spoiler.style.display) {
    spoiler.style.display = "inline";
    button.textContent = "Hide";
  } else {
    spoiler.style.display = "none";
    button.textContent = "Show";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Check for saved preference in localStorage
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.body.classList.toggle("light-mode", savedTheme === "light");
  }

  checkLoginStatus();
});
