/* Logout */
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("connectedUser");
    localStorage.removeItem("ebuy_cart");
    alert("Vous êtes déconnecté");
    window.location.href = "../index.html";
  });
}

/* Product Manager */
class ProductManager {
    constructor(options) {
        this.tableBody = document.getElementById(options.tableBodyId);
        this.currentPage = 1;
        this.itemsPerPage = 5;
        this.paginationContainer = document.getElementById("pagination");
        this.displayProducts();
    }

    getProducts() {
        return JSON.parse(localStorage.getItem("products") || "[]");
    }

    saveProducts(products) {
        localStorage.setItem("products", JSON.stringify(products));
    }

    deleteProduct(index) {
        const products = this.getProducts();
        products.splice(index, 1);
        if ((this.currentPage - 1) * this.itemsPerPage >= products.length && this.currentPage > 1) {
            this.currentPage--;
        }
        this.saveProducts(products);
        this.displayProducts();
    }

    displayProducts() {
        const products = this.getProducts();
        this.tableBody.innerHTML = "";

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const paginatedProducts = products.slice(start, end);

        paginatedProducts.forEach((p, index) => {
            const realIndex = start + index;
            const tr = document.createElement("tr");
            tr.className = "border-b hover:bg-gray-50";

            tr.innerHTML = `
                <td class="px-4 py-2">${realIndex + 1}</td>
                <td class="px-4 py-2"><img src="${p.image}" class="w-16 h-16 object-cover rounded"></td>
                <td class="px-4 py-2">${p.name}</td>
                <td class="px-4 py-2">${p.description}</td>
                <td class="px-4 py-2">${p.price} FCFA</td>
                <td class="px-4 py-2 flex gap-2">
                    <button class="bg-yellow-500 text-white px-3 py-1 rounded edit-btn" data-index="${realIndex}">Modifier</button>
                    <button class="bg-red-600 text-white px-3 py-1 rounded delete-btn" data-index="${realIndex}">Supprimer</button>
                </td>
            `;

            this.tableBody.appendChild(tr);
        });

        this.renderPagination(products.length);

        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.onclick = (e) => this.openEditModal(e.currentTarget.dataset.index);
        });

        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.onclick = (e) => this.showDeleteConfirm(e.currentTarget.dataset.index);
        });
    }

    renderPagination(totalItems) {
        this.paginationContainer.innerHTML = "";
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        if (totalPages <= 1) return;

        const prev = document.createElement("button");
        prev.textContent = "←";
        prev.className = "px-3 py-1 rounded bg-gray-200 hover:bg-gray-300";
        prev.disabled = this.currentPage === 1;
        prev.onclick = () => { this.currentPage--; this.displayProducts(); };
        this.paginationContainer.appendChild(prev);

        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement("button");
            btn.textContent = i;
            btn.className = `px-3 py-1 rounded ${i === this.currentPage ? "bg-purple-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`;
            btn.onclick = () => { this.currentPage = i; this.displayProducts(); };
            this.paginationContainer.appendChild(btn);
        }

        const next = document.createElement("button");
        next.textContent = "→";
        next.className = "px-3 py-1 rounded bg-gray-200 hover:bg-gray-300";
        next.disabled = this.currentPage === totalPages;
        next.onclick = () => { this.currentPage++; this.displayProducts(); };
        this.paginationContainer.appendChild(next);
    }

    openEditModal(index) {
        const products = this.getProducts();
        const p = products[index];
        document.getElementById("editName").value = p.name;
        document.getElementById("editDescription").value = p.description;
        document.getElementById("editPrice").value = p.price;
        document.getElementById("editIndexModal").value = index;
        document.getElementById("editModal").classList.remove("hidden");
    }

    showDeleteConfirm(index) {
        const confirmDiv = document.createElement("div");
        confirmDiv.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
        confirmDiv.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-2xl w-11/12 max-w-sm text-center">
                <h3 class="text-xl font-bold mb-4">Confirmer la suppression ?</h3>
                <p class="mb-4">Êtes-vous sûr de vouloir supprimer ce produit ?</p>
                <div class="flex justify-center gap-3">
                    <button id="cancelDelete" class="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition">Annuler</button>
                    <button id="confirmDelete" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Supprimer</button>
                </div>
            </div>
        `;
        document.body.appendChild(confirmDiv);

        document.getElementById("cancelDelete").onclick = () => confirmDiv.remove();
        document.getElementById("confirmDelete").onclick = () => {
            this.deleteProduct(index);
            confirmDiv.remove();
        };
    }
}

/* Initialisation */
const listManager = new ProductManager({ tableBodyId: "productsTableBody" });

/* Modal */
document.getElementById("closeModal").onclick = () => {
    document.getElementById("editModal").classList.add("hidden");
};

document.getElementById("editForm").onsubmit = (e) => {
    e.preventDefault();
    const index = document.getElementById("editIndexModal").value;
    const name = document.getElementById("editName").value;
    const description = document.getElementById("editDescription").value;
    const price = document.getElementById("editPrice").value;
    const file = document.getElementById("editImage").files[0];

    const products = JSON.parse(localStorage.getItem("products") || "[]");
    const product = products[index];
    product.name = name;
    product.description = description;
    product.price = price;

    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            product.image = event.target.result;
            products[index] = product;
            localStorage.setItem("products", JSON.stringify(products));
            listManager.displayProducts();
            document.getElementById("editModal").classList.add("hidden");
        };
        reader.readAsDataURL(file);
    } else {
        products[index] = product;
        localStorage.setItem("products", JSON.stringify(products));
        listManager.displayProducts();
        document.getElementById("editModal").classList.add("hidden");
    }
};

/* Sidebar responsive */
const sidebar = document.getElementById("sidebar");
document.getElementById("openSidebar").onclick = () => sidebar.classList.remove("-translate-x-full");
document.getElementById("closeSidebar").onclick = () => sidebar.classList.add("-translate-x-full");
