const btn = document.getElementById('menuBtn');
const menu = document.getElementById('mobileMenu');
const overlay = document.getElementById('overlay');
const icon = btn.querySelector('svg path');

btn.addEventListener('click', () => {
    if (menu.classList.contains('translate-x-full')) {
        /* Ouvrir menu */
        menu.classList.remove('translate-x-full');
        menu.classList.add('translate-x-0');
        overlay.classList.remove('hidden');
        /* Croix */
        icon.setAttribute('d', 'M6 18L18 6M6 6l12 12');
    } else {
        /* Fermer menu */
        menu.classList.add('translate-x-full');
        menu.classList.remove('translate-x-0');
        overlay.classList.add('hidden');
        /* Hamburger */
        icon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
    }
});

/* Fermer menu en cliquant sur overlay */
overlay.addEventListener('click', () => {
    menu.classList.add('translate-x-full');
    menu.classList.remove('translate-x-0');
    overlay.classList.add('hidden');
    icon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
});

/* DECONNEXION UTILISATEUR */

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {

    /*Supprimer utilisateur connecté*/ 
    localStorage.removeItem("connectedUser");

    /*(Optionnel) Vider le panier*/ 
    localStorage.removeItem("ebuy_cart");

    /*(Optionnel) fermer toutes les modales*/ 
    if (typeof app !== "undefined") {
      app.cartService.clear();
    }

    alert("Vous êtes déconnecté");

    /*Redirection vers login*/ 
    window.location.href = "../index.html";
  });
}


const { jsPDF } = window.jspdf;

/* PRODUITS */
class ProductService {
    static init() {
        if (!localStorage.getItem("products")) {
            localStorage.setItem("products", JSON.stringify([
                { id: 1, name: "chaussure Nike rouge", price: 10000, image: "./assets/products/shoes1.jpg" },
                { id: 2, name: "chaussure Nike blanche", price: 15000, image: "./assets/products/shoes1-2.jpg" },
                { id: 3, name: "chaussure Nike verte", price: 20000, image: "./assets/products/shoes1-1.jpg" },
                { id: 4, name: "Chaussure marron", price: 20000, image: "./assets/products/shoes1-3.jpg" },
            ]));
        }
    }

    static getAll() {
        return JSON.parse(localStorage.getItem("products") || "[]");
    }
}

/* PANIER */
class CartService {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem("ebuy_cart") || "[]");
    }

    save() {
        localStorage.setItem("ebuy_cart", JSON.stringify(this.cart));
    }

    add(product) {
        const existing = this.cart.find(p => Number(p.id) === Number(product.id));
        if (existing) {
            existing.quantity++;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
            });
        }
        this.save();
    }

    changeQty(index, delta) {
        this.cart[index].quantity += delta;
        if (this.cart[index].quantity <= 0) {
            this.cart.splice(index, 1);
        }
        this.save();
    }

    remove(index) {
        this.cart.splice(index, 1);
        this.save();
    }

    clear() {
        this.cart = [];
        this.save();
    }

    count() {
        return this.cart.reduce((s, p) => s + p.quantity, 0);
    }

    total() {
        return this.cart.reduce((t, p) => t + p.price * p.quantity, 0);
    }
}

/* UI / LOGIQUE */
class ShopApp {
    constructor() {
        ProductService.init();
        this.products = ProductService.getAll();
        this.displayedProducts = [...this.products];
        this.cartService = new CartService();

        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.pagination = document.getElementById("pagination");


        this.cacheDOM();
        this.bindEvents();
        this.renderProducts();
        this.renderCart();
        this.updateCartCount();
    }

    cacheDOM() {
        this.grid = document.getElementById("productsGrid");
        this.cartCount = document.getElementById("cartCount");
        this.cartModal = document.getElementById("cartModal");
        this.cartItems = document.getElementById("cartItems");
        this.cartTotal = document.getElementById("cartTotal");

        this.productModal = document.getElementById("productModal");
        this.modalImage = document.getElementById("modalImage");
        this.modalName = document.getElementById("modalName");
        this.modalPrice = document.getElementById("modalPrice");

        this.searchInput = document.getElementById("searchText");
        this.searchImage = document.getElementById("searchImage");
    }

    bindEvents() {
        document.getElementById("cartBtn").onclick = () => {
            this.renderCart();
            this.cartModal.classList.remove("hidden");
        };

        document.getElementById("closeCart").onclick =
            () => this.cartModal.classList.add("hidden");

        document.getElementById("closeModal").onclick =
            () => this.productModal.classList.add("hidden");

        document.getElementById("addToCartModal").onclick =
            () => this.addToCart(this.currentIndex);

        document.getElementById("checkout").onclick =
            () => this.checkout();

        this.searchInput.oninput = (e) => {
            const term = e.target.value.toLowerCase();
            this.displayedProducts = this.products.filter(p =>
                p.name.toLowerCase().includes(term)
            );
            this.currentPage = 1;
            this.renderProducts();
        };
        /* Recherche par image */
        this.searchImage.addEventListener("change", (e) => {
            this.searchByImage(e);
        });

    }

    searchByImage(event) {
        const file = event.target.files[0];
        if (!file) return;

        const fileName = file.name.toLowerCase();

        /* Extraire les mots du nom du fichier */
        const imageWords = fileName
            .replace(/\.[^/.]+$/, "") // enlever extension
            .split(/[\s-_]+/)         // séparer par espace, -, _
            .filter(w => w.length > 2);

        let results = [];

        this.products.forEach(p => {
            const productWords = p.name.toLowerCase().split(" ");

            /* Vérifier si au moins 1 mot correspond */
            const match = imageWords.some(imgWord =>
                productWords.some(prodWord =>
                    prodWord.includes(imgWord) || imgWord.includes(prodWord)
                )
            );

            if (match) results.push(p);
        });

        /* Si aucun mot trouvé → afficher produit proche (fallback) */
        if (results.length === 0) {
            results = this.products.filter(p =>
                fileName.includes("shoe") || fileName.includes("chaussure")
            );
        }

        if (results.length === 0) {
            alert("Aucun produit similaire trouvé");
            return;
        }

        this.displayedProducts = results;
        this.currentPage = 1;
        this.renderProducts();
    }



    renderProducts() {
        this.grid.innerHTML = "";

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const paginatedProducts = this.displayedProducts.slice(start, end);

        paginatedProducts.forEach((p, i) => {
            const card = document.createElement("div");
            card.className = "bg-white rounded-xl shadow-md p-6 flex flex-col relative mt-5";

            card.innerHTML = `
        <div class="flex justify-center mt-3 cursor-pointer">
            <img src="${p.image}" class="w-full h-36 object-contain product-img">
        </div>
        <div class="mt-4 flex-1 flex flex-col justify-between">
            <p class="text-gray-700 text-base font-semibold">${p.name}</p>
            <div class="flex justify-between mt-2">
                <span class="font-bold text-xl">${p.price} FCFA</span>
                <span class="text-gray-400 cursor-pointer add-heart text-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>

                </span>
            </div>
        </div>
        <div class="mt-4 flex gap-3">
            <button class="flex-1 bg-black text-white text-sm py-3 rounded-lg add">Ajouter</button>
            <button class="flex-1 border text-sm py-3 rounded-lg details">Détails</button>
        </div>
        `;

            this.grid.appendChild(card);

            const realIndex = this.displayedProducts.indexOf(p);

            card.querySelector(".add").onclick = () => this.addToCart(realIndex);
            card.querySelector(".add-heart").onclick = () => this.addToCart(realIndex);
            card.querySelector(".details").onclick = () => this.openModal(realIndex);
            card.querySelector(".product-img").onclick = () => this.openModal(realIndex);
        });

        this.renderPagination();
    }

    renderPagination() {
        this.pagination.innerHTML = "";

        const totalPages = Math.ceil(
            this.displayedProducts.length / this.itemsPerPage
        );

        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement("button");
            btn.textContent = i;

            btn.className = `
            px-4 py-2 border rounded-lg text-sm
            ${i === this.currentPage ? "bg-black text-white" : "bg-white"}
        `;

            btn.onclick = () => {
                this.currentPage = i;
                this.renderProducts();
            };

            this.pagination.appendChild(btn);
        }
    }


    openModal(index) {
        this.currentIndex = index;
        const p = this.displayedProducts[index];
        this.modalImage.src = p.image;
        this.modalName.textContent = p.name;
        this.modalPrice.textContent = `${p.price} FCFA`;
        this.productModal.classList.remove("hidden");
    }

    addToCart(index) {
        const product = this.displayedProducts[index];
        this.cartService.add(product);
        this.updateCartCount();
        this.renderCart();
        alert(`${product.name} ajouté au panier`);
    }

    updateCartCount() {
        this.cartCount.textContent = this.cartService.count();
    }

    renderCart() {
        this.cartItems.innerHTML = "";
        if (this.cartService.cart.length === 0) {
            this.cartItems.innerHTML = "<p class='text-center'>Panier vide </p>";
            this.cartTotal.textContent = "0";
            return;
        }

        this.cartService.cart.forEach((p, i) => {
            const div = document.createElement("div");
            div.className = "flex justify-between items-center border-b pb-2";
            div.innerHTML = `
        <div class="flex items-center gap-2">
          <img src="${p.image}" class="w-12 h-12 object-cover rounded">
          <span>${p.name} - ${p.price} FCFA x ${p.quantity}</span>
        </div>
        <div class="flex gap-2">
          <button onclick="app.changeQty(${i},-1)">−</button>
          <button onclick="app.changeQty(${i},1)">+</button>
          <button onclick="app.removeItem(${i})">X</button>
        </div>
      `;
            this.cartItems.appendChild(div);
        });

        this.cartTotal.textContent = this.cartService.total().toFixed(2);
    }

    changeQty(i, d) {
        this.cartService.changeQty(i, d);
        this.renderCart();
        this.updateCartCount();
    }

    removeItem(i) {
        this.cartService.remove(i);
        this.renderCart();
        this.updateCartCount();
    }

checkout() {
    if (this.cartService.cart.length === 0) {
        alert("Panier vide !");
        return;
    }

    const doc = new jsPDF();
    const primaryColor = [88, 80, 236];
    const gray = [120, 120, 120];

    // Titre
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...primaryColor);
    doc.text("FACTURE CLIENT", 105, 20, { align: "center" });

    // Ligne
    doc.setDrawColor(...primaryColor);
    doc.line(20, 25, 190, 25);

    // Infos
    doc.setFontSize(10);
    doc.setTextColor(...gray);
    const date = new Date();
    doc.text(`Date : ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`, 20, 35);
    doc.text("E-Buy Shop", 150, 35);

    // Table
    let y = 50;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("Produit", 20, y);
    doc.text("Qté", 110, y);
    doc.text("Prix", 130, y);
    doc.text("Total", 160, y);
    doc.line(20, y + 2, 190, y + 2);

    y += 10;
    let total = 0;
    doc.setFont("helvetica", "normal");

    this.cartService.cart.forEach(p => {
        const subtotal = p.price * p.quantity;
        total += subtotal;

        doc.text(p.name, 20, y);
        doc.text(String(p.quantity), 115, y);
        doc.text(`${p.price} FCFA`, 130, y);
        doc.text(`${subtotal.toFixed(2)} FCFA`, 160, y);

        y += 8;
    });

    // Total
    y += 10;
    doc.setDrawColor(0);
    doc.line(110, y, 190, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`TOTAL : ${total.toFixed(2)} FCFA`, 150, y + 10);

    // Footer
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...gray);
    doc.text("Merci pour votre achat ", 105, 280, { align: "center" });
    doc.text("Signature : ____________________", 20, 260);

    doc.save("facture-ebuy.pdf");

    // === ENREGISTRER LA VENTE AVEC DATE COMPLETE ===
    const sale = {
        id: Date.now(),
        date: new Date().toISOString(), // garde date + heure
        items: this.cartService.cart.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            quantity: p.quantity
        })),
        total: total
    };

    const sales = JSON.parse(localStorage.getItem("sales") || "[]");
    sales.push(sale);
    localStorage.setItem("sales", JSON.stringify(sales));

    // Reset panier
    this.cartService.clear();
    this.renderCart();
    this.updateCartCount();
    this.cartModal.classList.add("hidden");

    alert("Paiement effectué ! Vente enregistrée.");
}



}

/*INIT*/
const app = new ShopApp();