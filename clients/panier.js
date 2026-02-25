function getCart() {
    return JSON.parse(localStorage.getItem("ebuy_cart") || "[]");
}

const container = document.getElementById("cartItems");
const totalElement = document.getElementById("cartTotal");

function renderCart() {

    const cart = getCart();

    container.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = `
        <div class="text-center py-10 text-gray-500">
            <i class="fas fa-shopping-cart text-4xl mb-4"></i>
            <p>Votre panier est vide</p>
        </div>
        `;
        totalElement.textContent = "0";
        return;
    }

    cart.forEach((p, index) => {

        total += p.price * p.quantity;

        container.innerHTML += `
        <div class="bg-white rounded-2xl shadow-md  transition p-5 mb-6">

            <div class="flex flex-col md:flex-row justify-between items-center gap-6">

                <!-- PRODUIT INFO -->
                <div class="flex items-center gap-5 w-full md:w-auto">
                    <img src="${p.image}"
                         class="w-20 h-20 object-cover rounded-xl border">

                    <div>
                        <h3 class="font-bold text-lg text-gray-800">${p.name}</h3>

                        <p class="text-purple-600 font-semibold">
                            ${p.price.toLocaleString()} FCFA
                        </p>

                        <p class="text-sm text-gray-500">
                            Sous-total :
                            ${(p.price * p.quantity).toLocaleString()} FCFA
                        </p>
                    </div>
                </div>

                <!-- QUANTITE -->
                <div class="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-xl">

                    <button onclick="changeQty(${index}, -1)"
                        class="w-8 h-8 flex items-center justify-center bg-white rounded-lg hover:bg-gray-200 transition">
                        −
                    </button>

                    <span class="font-semibold">${p.quantity}</span>

                    <button onclick="changeQty(${index}, 1)"
                        class="w-8 h-8 flex items-center justify-center bg-white rounded-lg hover:bg-gray-200 transition">
                        +
                    </button>
                </div>

                <!-- ACTION -->
                <button onclick="removeItem(${index})"
                    class="text-red-500 hover:text-red-700 transition text-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                </button>

            </div>
        </div>
        `;
    });

    totalElement.textContent = total.toLocaleString();
}

function changeQty(index, delta) {

    const cart = getCart();

    cart[index].quantity += delta;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    localStorage.setItem("ebuy_cart", JSON.stringify(cart));

    renderCart();
}

function removeItem(index) {

    const cart = getCart();

    cart.splice(index, 1);

    localStorage.setItem("ebuy_cart", JSON.stringify(cart));

    renderCart();
}

document.addEventListener("DOMContentLoaded", renderCart);

