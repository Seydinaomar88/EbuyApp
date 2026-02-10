/*Sidebar mobile toggle*/ 
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  document.getElementById("openSidebar").onclick = () => {
    sidebar.classList.remove("-translate-x-full");
    overlay.classList.remove("hidden");
  };
  document.getElementById("closeSidebar").onclick = () => {
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
  };
  overlay.onclick = () => {
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
  };

class ProductManager {
  constructor(options) {
    this.form = options.formId ? document.getElementById(options.formId) : null;
    this.nameInput = this.form ? document.getElementById("name") : null;
    this.priceInput = this.form ? document.getElementById("price") : null;
    this.imageInput = this.form ? document.getElementById("image") : null;

    if (this.form) {
      this.form.addEventListener("submit", (e) => this.handleFormSubmit(e));
    }
  }

  getProducts() {
    return JSON.parse(localStorage.getItem("products") || "[]");
  }

  saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products));
  }

  showCard(message, type = "success") {
    const card = document.createElement("div");
    card.className = `toast-card ${type}`;

    const icon = type === "success"
      ? `<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" 
          stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`
      : `<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" 
          stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;

    card.innerHTML = `
      ${icon}
      <div class="content">
        <h4>${type === "success" ? "Succès" : "Erreur"}</h4>
        <p>${message}</p>
      </div>
    `;

    document.body.appendChild(card);

    setTimeout(() => {
      card.classList.add("hide");
      card.addEventListener("animationend", () => card.remove());
    }, 3000);
  }

  handleFormSubmit(e) {
    e.preventDefault();

    const name = this.nameInput.value.trim();
    const price = this.priceInput.value.trim();

    if (!name || !price || this.imageInput.files.length === 0) {
      this.showCard("Veuillez remplir tous les champs et choisir une image !", "error");
      return;
    }

    const products = this.getProducts();

    const reader = new FileReader();
    reader.onload = (event) => {
      const productData = { name, price, image: event.target.result };
      products.push(productData);
      this.saveProducts(products);
      this.form.reset();
      this.showCard("Produit ajouté avec succès !", "success");
    };
    reader.readAsDataURL(this.imageInput.files[0]);
  }
}

/* Initialisation */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("productForm") ? "productForm" : null;
  if (form) {
    new ProductManager({ formId: form });
  }
});
