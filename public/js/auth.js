const apiUrl = "/api/auth"; // Use relative URL

async function login() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const response = await fetch(`${apiUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const j = await response.json();
      throw new Error(j.error || j.message);
    }

    const data = await response.json();
    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("email", email);

    document.getElementById("login-password").value = "";
    document.getElementById("login-message").textContent = "";

    showAccountInfo();
  } catch (error) {
    document.getElementById("login-message").textContent = error.message;
  }
}

async function register() {
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;

  try {
    const response = await fetch(`${apiUrl}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const j = await response.json();
      throw new Error(j.error || j.message);
    }

    const data = await response.json();
    document.getElementById("register-message").textContent =
      "Registration successful! You can now log in.";
  } catch (error) {
    document.getElementById("register-message").textContent = error.message;
  }
}

async function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("email");
  document.getElementById("login-form").style.display = "block";
  document.getElementById("register-form").style.display = "block";
  document.getElementById("protected").style.display = "none";
}

async function checkLoginStatus() {
  const token = localStorage.getItem("token");

  if (!token && window.location.pathname.includes("dashboard")) {
    window.location.replace("/account");
  }

  if (token && window.location.pathname.includes("account")) {
    showAccountInfo();
    return;
  }
}

function showAccountInfo() {
  const loggedText = document.getElementById("logged-text");
  document.getElementById("protected").style.display = "block";
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "none";

  loggedText.innerHTML = `Email: ${localStorage.getItem("email")}<br>
  User ID: <span class="spoiler-content" id="userId">${localStorage.getItem(
    "userId"
  )}</span>
  <button class="spoiler-button w3-button w3-round w3-blue" id="spoiler-userId" onclick="toggleSpoiler('userId')">Show</button>`;
}
