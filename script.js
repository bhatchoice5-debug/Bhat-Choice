const products = [
  {
    name: 'Fast Charging Cable',
    cat: 'Mobile Accessories',
    price: 155,
    icon: 'fast_charging_cable.png'
  },
  {
    name: 'Premium Phone Case',
    cat: 'Mobile Accessories',
    price: 196,
    icon: 'premium_phone_case.png'
  },
  {
    name: 'Kashmiri Style Suit',
    cat: 'Suits',
    price: 1199,
    icon: 'suit kashmire.png'
  },
  {
    name: 'Casual Sneakers',
    cat: 'Shoes',
    price: 1099,
    icon: 'casual_sneakers.png'
  },
  {
    name: 'Beauty Essentials',
    cat: 'Cosmetics',
    price: 499,
    icon: 'beauty_essentials.png'
  },
  {
    name: 'Fashion Jewellery Set',
    cat: 'Jewellery',
    price: 799,
    icon: 'fashion_jewellery_set.png'
  },
  {
    name: 'Everyday Backpack',
    cat: 'Other',
    price: 999,
    icon: 'everyday_backpack.png'
  },
  {
    name: 'Wireless Earbuds',
    cat: 'Mobile Accessories',
    price: 479,
    icon: 'wireless_earbuds.png'
  }
];

let cart = [];
let activeCat = '';

function render() {

  const search = document.getElementById('search');
  const productsBox = document.getElementById('products');

  const q = search
    ? search.value.toLowerCase().trim()
    : '';

  const list = products.filter(p =>
    (!activeCat || p.cat === activeCat) &&
    (!q || p.name.toLowerCase().includes(q))
  );

  if (!list.length) {
    productsBox.innerHTML = `
      <div class="no-products">
        <h3>No products found</h3>
        <p>Try another search.</p>
      </div>
    `;
    return;
  }

  productsBox.innerHTML = list.map(p => `

    <article class="product">

      <div class="pic">

        <img
          src="${p.icon}"
          alt="${p.name}"
          onerror="this.style.display='none';this.parentElement.innerHTML='🛍️'"
        >

      </div>

      <div class="product-body">

        <small>${p.cat}</small>

        <h3>${p.name}</h3>

        <div class="price">
          ₹${p.price}
        </div>

        <button
          class="add"
          onclick="add(${products.indexOf(p)})"
        >
          Add to Cart
        </button>

      </div>

    </article>

  `).join('');
}


function filterCat(c) {

  activeCat = c === 'All' ? '' : c;

  document.querySelectorAll('.cat').forEach(btn => {

    btn.classList.toggle(
      'active',
      btn.dataset.cat === c
    );

  });

  render();
}


function add(i) {

  cart.push(products[i]);

  document.getElementById('cartCount').textContent =
    cart.length;

}


function showCart() {

  const modal = document.getElementById('cartModal');
  const items = document.getElementById('cartItems');
  const total = document.getElementById('cartTotal');

  items.innerHTML = cart.length

    ? cart.map(p => `
        <div class="item">

          <div>
            <span>${p.name}</span>
            <small>${p.cat}</small>
          </div>

          <b>₹${p.price}</b>

        </div>
      `).join('')

    : '<p class="empty-cart">Your cart is empty.</p>';

  total.textContent =
    cart.reduce((sum, p) => sum + p.price, 0);

  modal.classList.remove('hidden');
}


function closeCart() {

  document
    .getElementById('cartModal')
    .classList.add('hidden');

}


function checkout() {

  if (!cart.length) {

    alert('Please add a product first.');

    return false;
  }

  const form =
    document.getElementById('orderForm');

  if (!form.reportValidity()) {
    return false;
  }

  const transactionId =
    document
      .getElementById('transactionId')
      .value
      .trim();

  const screenshot =
    document
      .getElementById('paymentScreenshot')
      .files[0];

  if (!transactionId) {

    alert(
      'Please enter your Transaction ID / UTR.'
    );

    return false;
  }

  if (!screenshot) {

    alert(
      'Please select your payment screenshot.'
    );

    return false;
  }


  const data =
    new FormData(form);

  const name =
    data.get('name');

  const phone =
    data.get('phone');

  const house =
    data.get('house');

  const area =
    data.get('area');

  const post =
    data.get('post');

  const district =
    data.get('district');

  const state =
    data.get('state');

  const pin =
    data.get('pin');

  const landmark =
    data.get('landmark');


  const total =
    cart.reduce(
      (sum, p) => sum + p.price,
      0
    );


  const orderLines =
    cart
      .map(
        p =>
          `${p.name} - ₹${p.price}`
      )
      .join('\n');


  const message =

`🛍️ BHAT CHOICE — NEW ORDER

PRODUCTS:
${orderLines}

TOTAL: ₹${total}

CUSTOMER:
Name: ${name}
Phone: ${phone}

ADDRESS:
House: ${house}
Area: ${area}
Post Office: ${post || '-'}
District: ${district}
State: ${state}
PIN: ${pin}
Landmark: ${landmark || '-'}

PAYMENT:
Payment Method: UPI
Transaction ID / UTR: ${transactionId}

PAYMENT SCREENSHOT:
${screenshot.name}

I have completed the UPI payment and am sending my payment proof for verification.

Please verify the payment and confirm my order.`;


  const whatsappUrl =
    'https://wa.me/917889928279?text=' +
    encodeURIComponent(message);


  window.open(
    whatsappUrl,
    '_blank'
  );


  return true;
}


/* CATEGORY */

document
  .querySelectorAll('.cat')
  .forEach(btn => {

    btn.addEventListener(
      'click',
      () => {

        filterCat(
          btn.dataset.cat
        );

      }
    );

  });


/* SEARCH */

document
  .getElementById('search')
  .addEventListener(
    'input',
    render
  );


/* CART */

document
  .getElementById('cartBtn')
  .addEventListener(
    'click',
    showCart
  );


document
  .getElementById('closeCart')
  .addEventListener(
    'click',
    closeCart
  );


/* SCREENSHOT */

document
  .getElementById('paymentScreenshot')
  .addEventListener(
    'change',
    function () {

      const status =
        document.getElementById(
          'fileStatus'
        );

      if (this.files.length) {

        status.textContent =
          '✅ Screenshot selected: ' +
          this.files[0].name;

        status.classList.add('selected');

      } else {

        status.textContent =
          '📸 Select your payment screenshot';

        status.classList.remove(
          'selected'
        );
      }

    }
  );


/* ORDER FORM */

document
  .getElementById('orderForm')
  .addEventListener(
    'submit',
    function(e) {

      e.preventDefault();

      checkout();

    }
  );


render();
