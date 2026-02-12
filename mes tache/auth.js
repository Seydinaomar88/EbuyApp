
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

/* =========================
   INSCRIPTION
========================= */
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    let users = JSON.parse(localStorage.getItem("users")) || [];

    const userExists = users.find(user => user.email === email);
    if (userExists) {
      alert("Ce compte existe déjà");
      return;
    }

    users.push({ email, password, role });
    localStorage.setItem("users", JSON.stringify(users));

    alert("Compte créé avec succès");
    window.location.href = "../index.html"; // retour connexion
  });
}

/* =========================
   CONNEXION
========================= */
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const users = JSON.parse(localStorage.getItem("users")) || [];

    console.log("Utilisateurs enregistrés :", users);

    const user = users.find(
      u => u.email === email && u.password === password
    );

    if (!user) {
      alert("Email ou mot de passe incorrect");
      return;
    }

    localStorage.setItem("connectedUser", JSON.stringify(user));

    if (user.role === "admin") {
      window.location.href = "admin.html";
    } else if (user.role === "vendeur") {
      window.location.href = "/vendeur/vendeur.html";
    } else {
      window.location.href = "/clients/client.html";
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
  window.location.href = "../index.html";
}
