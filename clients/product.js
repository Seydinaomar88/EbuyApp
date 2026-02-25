const product = JSON.parse(localStorage.getItem("selectedProduct"));
const cart = JSON.parse(localStorage.getItem("ebuy_cart") || "[]");

let quantity = 1;

document.getElementById("detailImage").src = product.image;
document.getElementById("detailName").textContent = product.name;
document.getElementById("detailPrice").textContent = product.price + " FCFA";
document.getElementById("detailDescription").textContent = product.description;

document.getElementById("plus").onclick = () => {
    quantity++;
    document.getElementById("qty").textContent = quantity;
};

document.getElementById("minus").onclick = () => {
    if (quantity > 1) {
        quantity--;
        document.getElementById("qty").textContent = quantity;
    }
};

document.getElementById("addToCartBtn").onclick = () => {

    const existing = cart.find(p => p.id === product.id);

    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ ...product, quantity });
    }

    localStorage.setItem("ebuy_cart", JSON.stringify(cart));

    alert("Produit ajouté au panier !");
    window.location.href = "panier.html";
};