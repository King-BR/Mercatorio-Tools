document.addEventListener("DOMContentLoaded", () => {
  const reportSelector = document.getElementById("reportSelector");
  const jsonDisplay = document.getElementById("jsonDisplay");

  // Fetch the list of JSON files dynamically
  function fetchJsonFiles() {
    fetch("api/reports/list-json-files")
      .then((response) => response.json())
      .then((files) => {
        populateReportDropdown(files);
      })
      .catch((error) => console.error("Error fetching JSON files:", error));
  }

  // Populate the dropdown with the JSON file names
  function populateReportDropdown(files) {
    // Clear existing options
    reportSelector.innerHTML =
      '<option value="" disabled selected>Select a JSON report</option>';
    files.forEach((file) => {
      const option = document.createElement("option");
      option.value = file;
      option.text = file;
      reportSelector.appendChild(option);
    });
  }

  // Handle report selection
  reportSelector.addEventListener("change", (event) => {
    const selectedFile = event.target.value;
    if (selectedFile) {
      fetchReportContent(selectedFile);
    }
  });

  // Fetch the selected JSON report and display it
  function fetchReportContent(filename) {
    fetch(`api/reports/raw_reports/${filename}`)
      .then((response) => response.json())
      .then((data) => {
        displayJson(data);
      })
      .catch((error) => console.error("Error loading JSON file:", error));
  }

  // Display the JSON content in a readable format
  function displayJson(data) {
    jsonDisplay.textContent = JSON.stringify(data, null, 4);
  }

  // Fetch the JSON file list when the page loads
  fetchJsonFiles();
});
