class SalesApp {
    constructor() {
        this.main = document.querySelector("main");
        this.itemsPerPage = 5; // 5 ventes par page
        this.currentPage = 1;
        this.render();
    }

    getSales() {
        const sales = JSON.parse(localStorage.getItem("sales") || "[]");
        // Trier du plus récent au plus ancien
        return sales.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    saveSales(sales) {
        localStorage.setItem("sales", JSON.stringify(sales));
    }

    render() {
        this.main.innerHTML = `
            <h1 class="text-3xl font-bold mb-6">Gestion des ventes</h1>
            <div class="mb-4 flex gap-4 items-center">
                <input type="date" id="filterDate" class="border px-3 py-2 rounded shadow-sm focus:outline-none focus:ring focus:border-purple-300">
                <button id="clearFilter" class="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition">Réinitialiser</button>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 shadow-md rounded-lg overflow-hidden">
                    <thead class="bg-purple-100">
                        <tr>
                            <th class="px-6 py-3 text-left text-sm font-semibold text-purple-900">ID</th>
                            <th class="px-6 py-3 text-left text-sm font-semibold text-purple-900">Date & Heure</th>
                            <th class="px-6 py-3 text-left text-sm font-semibold text-purple-900">Articles</th>
                            <th class="px-6 py-3 text-left text-sm font-semibold text-purple-900">Total (FCFA)</th>
                            <th class="px-6 py-3 text-center text-sm font-semibold text-purple-900">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="salesTableBody" class="bg-white divide-y divide-gray-200"></tbody>
                </table>
            </div>
            <div class="mt-4 flex justify-center gap-2" id="pagination"></div>
        `;

        this.tableBody = document.getElementById("salesTableBody");
        this.paginationDiv = document.getElementById("pagination");

        document.getElementById("filterDate").onchange = (e) => {
            this.currentPage = 1;
            this.filterByDate(e.target.value);
        };
        document.getElementById("clearFilter").onclick = () => {
            document.getElementById("filterDate").value = "";
            this.currentPage = 1;
            this.renderTable();
        };

        this.renderTable();
    }

    renderTable(filteredSales = null) {
        const sales = filteredSales || this.getSales();
        this.tableBody.innerHTML = "";

        if (sales.length === 0) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-6 text-gray-500">Aucune vente enregistrée</td>
                </tr>
            `;
            this.paginationDiv.innerHTML = "";
            return;
        }

        const totalPages = Math.ceil(sales.length / this.itemsPerPage);
        if (this.currentPage > totalPages) this.currentPage = totalPages;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const paginatedSales = sales.slice(start, end);

        paginatedSales.forEach((sale, index) => {
            const itemsList = sale.items.map(i => `${i.name} x${i.quantity}`).join(", ");
            const tr = document.createElement("tr");
            tr.className = "hover:bg-gray-50 transition";

            const dateObj = new Date(sale.date);
            const formattedDate = dateObj.toLocaleDateString("fr-FR") + " " + dateObj.toLocaleTimeString("fr-FR");

            tr.innerHTML = `
                <td class="px-6 py-4 text-sm text-gray-700">${sale.id}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${formattedDate}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${itemsList}</td>
                <td class="px-6 py-4 text-sm font-semibold text-gray-900">${sale.total.toFixed(2)}</td>
                <td class="px-6 py-4 text-center">
                    <button data-index="${start + index}" class="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition">Supprimer</button>
                </td>
            `;
            this.tableBody.appendChild(tr);
        });

        // Boutons supprimer
        this.tableBody.querySelectorAll("button").forEach(btn => {
            btn.onclick = (e) => this.deleteSale(e.target.dataset.index);
        });

        this.renderPagination(totalPages);
    }

    renderPagination(totalPages) {
        this.paginationDiv.innerHTML = "";

        if (totalPages <= 1) return;

        // Précédent
        const prevBtn = document.createElement("button");
        prevBtn.textContent = "← Précédent";
        prevBtn.className = "px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition";
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.onclick = () => { this.currentPage--; this.renderTable(); };
        this.paginationDiv.appendChild(prevBtn);

        // Numéros
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement("button");
            btn.textContent = i;
            btn.className = `px-3 py-1 rounded ${i === this.currentPage ? "bg-purple-600 text-white" : "bg-gray-200 hover:bg-gray-300"} transition`;
            btn.onclick = () => { this.currentPage = i; this.renderTable(); };
            this.paginationDiv.appendChild(btn);
        }

        // Suivant
        const nextBtn = document.createElement("button");
        nextBtn.textContent = "Suivant →";
        nextBtn.className = "px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition";
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.onclick = () => { this.currentPage++; this.renderTable(); };
        this.paginationDiv.appendChild(nextBtn);
    }

    deleteSale(index) {
        if (!confirm("Voulez-vous vraiment supprimer cette vente ?")) return;
        const sales = this.getSales();
        sales.splice(index, 1);
        this.saveSales(sales);
        this.renderTable();
    }

    filterByDate(date) {
        if (!date) return this.renderTable();
        const sales = this.getSales().filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate.toISOString().startsWith(date);
        });
        this.renderTable(sales);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new SalesApp();
});
