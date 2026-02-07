
// =======================
// OUTILS
// =======================
function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function hashPassword(password) {
  return btoa(password); // simulation de hash (prototype)
}

// =======================
// INSCRIPTION (SIGN UP)
// =======================
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    // Champs optionnels UI
    const interest = document.querySelector('input[name="interest"]:checked')?.nextSibling?.textContent?.trim() || "Non précisé";

    if (!email || password.length < 5) {
      alert("Email valide requis et mot de passe ≥ 5 caractères");
      return;
    }

    let users = getUsers();

    if (users.find(u => u.email === email)) {
      alert("Ce compte existe déjà");
      return;
    }

    const newUser = {
      email,
      password: hashPassword(password),
      role,
      interest
    };

    users.push(newUser);
    saveUsers(users);

    alert("Compte créé avec succès");
    window.location.href = "login.html";
  });
}

// =======================
// CONNEXION (LOGIN)
// =======================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = hashPassword(
      document.getElementById("loginPassword").value
    );

    const users = getUsers();

    const user = users.find(
      u => u.email === email && u.password === password
    );

    if (!user) {
      alert("Email ou mot de passe incorrect");
      return;
    }

    localStorage.setItem("connectedUser", JSON.stringify(user));

    // Redirection selon rôle
    if (user.role === "admin") {
      window.location.href = "admin.html";
    } else if (user.role === "vendeur") {
      window.location.href = "vendeur.html";
    } else {
      window.location.href = "dashboard.html";
    }
  });
}

// =======================
// PROTECTION DES PAGES
// =======================
function protectPage(requiredRole = null) {
  const user = JSON.parse(localStorage.getItem("connectedUser"));

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  if (requiredRole && user.role !== requiredRole) {
    alert("Accès refusé");
    window.location.href = "login.html";
  }
}

// =======================
// DÉCONNEXION
// =======================
function logout() {
  localStorage.removeItem("connectedUser");
  window.location.href = "login.html";
}
