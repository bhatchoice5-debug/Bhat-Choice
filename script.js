const products = [
  {name:'Fast Charging Cable',cat:'Mobile Accessories',price:155,icon:'🔌'},
  {name:'Premium Phone Case',cat:'Mobile Accessories',price:196,icon:'📱'},
  {name:'Kashmiri Style Suit',cat:'Suits',price:1199,icon:'suit kashmire.png'},
  {name:'Casual Sneakers',cat:'Shoes',price:1099,icon:'👟'},
  {name:'Beauty Essentials',cat:'Cosmetics',price:499,icon:'💄'},
  {name:'Fashion Jewellery Set',cat:'Jewellery',price:799,icon:'💎'},
  {name:'Everyday Backpack',cat:'Other',price:999,icon:'🎒'},
  {name:'Wireless Earbuds',cat:'Mobile Accessories',price:479,icon:'🎧'}
];

let cart = [];
let activeCat = '';

function render() {
  const search = document.getElementById('search');
  const productsBox = document.getElementById('products');

  const q = search ? search.value.toLowerCase() : '';

  const list = products.filter(p =>
    (!activeCat || p.cat === activeCat) &&
    (!q || p.name.toLowerCase().includes(q))
  );

  productsBox.innerHTML = list.map((p) => `
    <article class="product">
      <div class="pic">
        ${p.icon.endsWith('.png')
          ? `<img src="${p.icon}" alt="${p.name}">`
          : p.icon}
      </div>

      <div class="product-body">
        <small>${p.cat}</small>
        <h3>${p.name}</h3>
        <div class="price">₹${p.price}</div>
        <button class="add" onclick="add(${products.indexOf(p)})">
          Add to Cart
        </button>
      </div>
    </article>
  `).join('');
}

function filterCat(c) {
  activeCat = c === 'All' ? '' : c;

  document.querySelectorAll('.cat').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === c);
  });

  render();
}

function add(i) {
  cart.push(products[i]);

  document.getElementById('cartCount').textContent = cart.length;
}

function showCart() {
  const modal = document.getElementById('cartModal');
  const items = document.getElementById('cartItems');
  const total = document.getElementById('cartTotal');

  items.innerHTML = cart.length
    ? cart.map(p => `
        <div class="item">
          <span>${p.name}</span>
          <b>₹${p.price}</b>
        </div>
      `).join('')
    : '<p>Your cart is empty.</p>';

  total.textContent = cart.reduce((sum, p) => sum + p.price, 0);

  modal.classList.remove('hidden');
}

function closeCart() {
  document.getElementById('cartModal').classList.add('hidden');
}

function checkout() {
  if (!cart.length) {
    alert('Add a product first.');
    return;
  }

  const msg = encodeURIComponent(
    'Hello BHAT CHOICE! I want to order:\n' +
    cart.map(p => p.name + ' - ₹' + p.price).join('\n') +
    '\nTotal: ₹' +
    cart.reduce((sum, p) => sum + p.price, 0)
  );

  window.open(
    'https://wa.me/917889928279?text=' + msg,
    '_blank'
  );
}

document.querySelectorAll('.cat').forEach(btn => {
  btn.addEventListener('click', () => {
    filterCat(btn.dataset.cat);
  });
});

document.getElementById('search').addEventListener('input', render);

document.getElementById('cartBtn').addEventListener('click', showCart);

document.getElementById('closeCart').addEventListener('click', closeCart);

document.getElementById('orderForm').addEventListener('submit', function(e) {
  e.preventDefault();
  checkout();
});

render();
