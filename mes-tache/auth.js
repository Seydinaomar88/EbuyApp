// =======================
// INITIALISATION ADMIN
// =======================

function initAdmin() {
  let users = JSON.parse(localStorage.getItem("users")) || [];

  const adminExists = users.find(
    user => user.email === "admintest@admin.com"
  );

  if (!adminExists) {
    users.push({
      email: "admintest@admin.com",
      password: btoa("admin123"),
      role: "admin"
    });

    localStorage.setItem("users", JSON.stringify(users));
    console.log("Admin créé automatiquement");
  }
}

initAdmin();


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
  return btoa(password); // simulation hash
}


// =========================
// INSCRIPTION
// =========================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    let users = getUsers();

    const userExists = users.find(user => user.email === email);
    if (userExists) {
      alert("Ce compte existe déjà");
      return;
    }

    if (role === "admin") {
      alert("Création d'admin interdite");
      return;
    }

    users.push({
      email,
      password: hashPassword(password),
      role
    });

    saveUsers(users);

    alert("Compte créé avec succès");

    // 🔥 Redirection correcte GitHub Pages
   window.location.href = "/EbuyApp/index.html";
  });
}


// =========================
// CONNEXION
// =========================

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

    // 🔥 REDIRECTIONS CORRIGÉES pour GitHub Pages
    if (user.role === "admin") {
      window.location.href = "./admin-dashboard.html";
    } 
    else if (user.role === "vendeur") {
      window.location.href = "./vendeur/vendeur.html";
    } 
    else {
      window.location.href = "./clients/client.html";
    }
  });
}


// =======================
// PROTECTION DES PAGES
// =======================

function protectPage(requiredRole = null) {
  const user = JSON.parse(localStorage.getItem("connectedUser"));

  if (!user) {
    window.location.href = "./index.html";
    return;
  }

  if (requiredRole && user.role !== requiredRole) {
    alert("Accès refusé");
    window.location.href = "./index.html";
  }
}


// =======================
// DÉCONNEXION
// =======================

function logout() {
  localStorage.removeItem("connectedUser");
  window.location.href = "./index.html";
}