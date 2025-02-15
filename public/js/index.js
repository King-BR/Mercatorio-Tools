function toggleDarkMode() {
  document.body.classList.toggle("light-mode");

  // Save the current theme preference in localStorage
  if (document.body.classList.contains("light-mode")) {
    localStorage.setItem("theme", "light");
  } else {
    localStorage.setItem("theme", "dark");
  }

  setDarkModeIcon();
}

function setDarkModeIcon() {
  const icon = document.getElementById("dark-mode-icon");
  if (document.body.classList.contains("light-mode")) {
    icon.classList.remove("fa-sun");
    icon.classList.add("fa-moon");
  } else {
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");
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

function w3_open() {
  document.getElementById("mySidebar").style.display = "block";
}

function w3_close() {
  document.getElementById("mySidebar").style.display = "none";
}

document.addEventListener("DOMContentLoaded", function () {
  // Check for saved preference in localStorage
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.body.classList.toggle("light-mode", savedTheme === "light");
  }

  setDarkModeIcon();

  checkLoginStatus();
});
