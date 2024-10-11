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

    document.getElementById("login-form").style.display = "none";
    document.getElementById("register-form").style.display = "none";
    document.getElementById("protected").style.display = "block";
    document.getElementById("login-message").textContent = "";
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
  document.getElementById("login-form").style.display = "block";
  document.getElementById("register-form").style.display = "block";
  document.getElementById("protected").style.display = "none";
}

async function checkLoginStatus() {
  const token = localStorage.getItem("token");

  if (!token && window.location.pathname.includes("dashboard")) {
    window.location.replace("/login.html");
    return;
  }
}
