```javascript
const PRODUCTS = [
 ["Fast Charging Cable","Mobile Accessories",155,"🔌","fast_charging_cable.png"],
 ["Premium Phone Case","Mobile Accessories",196,"📱","premium_phone_case.png"],
 ["Kashmiri Style Suit","Suits",1199,"👗","suit kashmire.png"],
 ["Casual Sneakers","Shoes",1099,"👟","casual_sneakers.png"],
 ["Beauty Essentials","Cosmetics",499,"💄","beauty_essentials.png"],
 ["Fashion Jewellery Set","Jewellery",799,"💎","fashion_jewellery_set.png"],
 ["Everyday Backpack","Other",999,"🎒","everyday_backpack.png"],
 ["Wireless Earbuds","Mobile Accessories",479,"🎧","wireless_earbuds.png"]
];

const WHATSAPP_NUMBER = "917889928279";
let category = "All";
let cart = [];
const $ = id => document.getElementById(id);

function renderCategories(){
 const cats = ["All", ...new Set(PRODUCTS.map(p => p[1]))];
 $("cats").innerHTML = cats.map(c =>
  `<button class="cat ${category===c?"active":""}" data-cat="${c}">${c}</button>`
 ).join("");
 $("cats").querySelectorAll("button").forEach(btn => {
  btn.onclick = () => { category = btn.dataset.cat; renderCategories(); renderProducts(); };
 });
}

function renderProducts(){
 const q = $("search").value.trim().toLowerCase();
 const list = PRODUCTS.filter(p =>
  (category==="All" || p[1]===category) && p[0].toLowerCase().includes(q)
 );
 $("products").innerHTML = list.length ? list.map(p =>
  `<article class="product">
   <div class="art"><img src="assets/${p[4]}" alt="${p[0]}" onerror="this.outerHTML='<span>${p[3]}</span>'"></div>
   <div class="info"><div class="category">${p[1]}</div><h3>${p[0]}</h3>
   <div class="bottom"><span class="price">₹${p[2]}</span><button class="add" data-add="${p[0]}">+ ADD</button></div></div>
  </article>`
 ).join("") : "<p>No products found.</p>";

 $("products").querySelectorAll("[data-add]").forEach(btn => {
  btn.onclick = () => {
   cart.push(PRODUCTS.find(p => p[0]===btn.dataset.add));
   $("count").textContent = cart.length;
   btn.textContent = "ADDED ✓";
  };
 });
}

function openCheckout(){
 if(!cart.length){alert("Your cart is empty. Add a product first.");return;}
 const counts = {};
 cart.forEach(p => counts[p[0]] = (counts[p[0]]||0)+1);
 const total = cart.reduce((s,p)=>s+p[2],0);
 $("summary").textContent = "Items:\n" +
  Object.entries(counts).map(([name,n])=>`${name} × ${n}`).join("\n") +
  `\n\nTotal: ₹${total}`;
 $("modal").hidden = false;
}

$("cartBtn").onclick = openCheckout;
$("close").onclick = () => $("modal").hidden = true;
$("search").addEventListener("input",renderProducts);
$("year").textContent = new Date().getFullYear();

$("form").onsubmit = event => {
 event.preventDefault();
 const total = cart.reduce((s,p)=>s+p[2],0);
 const counts = {};
 cart.forEach(p => counts[p[0]] = (counts[p[0]]||0)+1);
 const items = Object.entries(counts).map(([name,n])=>`${name} × ${n}`).join(", ");
 const message =
  "BHAT CHOICE KASHMIR — PAYMENT VERIFICATION REQUEST\n" +
  "STATUS: PAYMENT PENDING VERIFICATION — NOT CONFIRMED\n" +
  `Name: ${$("name").value}\nPhone: ${$("phone").value}\n` +
  `Address: ${$("address").value}\nItems: ${items}\n` +
  `Total: INR ${total}\nTransaction ID / UTR: ${$("utr").value}\n` +
  "I will attach my payment screenshot in this WhatsApp chat. Please verify payment before confirming the order.";

 window.open("https://wa.me/"+WHATSAPP_NUMBER+"?text="+encodeURIComponent(message),"_blank");
};

renderCategories();
renderProducts();
```
