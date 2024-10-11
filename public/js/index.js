document.addEventListener("DOMContentLoaded", function () {
  const toggleButton = document.getElementById('dark-mode-toggle');

  // Check for saved preference in localStorage
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.body.classList.toggle('dark-mode', savedTheme === 'dark');
  }

  // Toggle dark mode on button click
  toggleButton.addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');

    // Save the current theme preference in localStorage
    if (document.body.classList.contains('dark-mode')) {
      localStorage.setItem('theme', 'dark');
    } else {
      localStorage.setItem('theme', 'light');
    }
  });
});
