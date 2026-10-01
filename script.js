const products=[
{name:'Fast Charging Cable',cat:'Mobile Accessories',price:299,icon:'🔌'},
{name:'Premium Phone Case',cat:'Mobile Accessories',price:399,icon:'📱'},
{name:'Kashmiri Style Suit',cat:'Suits',price:1499,icon:'👗'},
{name:'Casual Sneakers',cat:'Shoes',price:1299,icon:'👟'},
{name:'Beauty Essentials',cat:'Cosmetics',price:699,icon:'💄'},
{name:'Fashion Jewellery Set',cat:'Jewellery',price:899,icon:'💎'},
{name:'Everyday Backpack',cat:'Other',price:999,icon:'🎒'},
{name:'Wireless Earbuds',cat:'Mobile Accessories',price:1199,icon:'🎧'}
];
let cart=[], activeCat='';
function render(){
 const q=document.getElementById('search').value.toLowerCase();
 const list=products.filter(p=>(!activeCat||p.cat===activeCat)&&(!q||p.name.toLowerCase().includes(q)));
 document.getElementById('products').innerHTML=list.map((p,i)=>`<article class="product"><div class="pic">${p.icon}</div><div class="product-body"><small>${p.cat}</small><h3>${p.name}</h3><div class="price">₹${p.price}</div><button class="add" onclick="add(${products.indexOf(p)})">Add to Cart</button></div></article>`).join('');
}
function filterCat(c){activeCat=c;document.getElementById('shop').scrollIntoView({behavior:'smooth'});render()}
function add(i){cart.push(products[i]);document.getElementById('count').textContent=cart.length}
function showCart(){document.getElementById('modal').style.display='block';const el=document.getElementById('cartItems');el.innerHTML=cart.length?cart.map((p,i)=>`<div class="item"><span>${p.name}</span><b>₹${p.price}</b></div>`).join(''):'<p>Your cart is empty.</p>';document.getElementById('total').textContent=cart.reduce((s,p)=>s+p.price,0)}
function closeCart(){document.getElementById('modal').style.display='none'}
function checkout(){if(!cart.length)return alert('Add a product first.');const msg=encodeURIComponent('Hello BHAT CHOICE! I want to order:\n'+cart.map(p=>p.name+' - ₹'+p.price).join('\n')+'\nTotal: ₹'+cart.reduce((s,p)=>s+p.price,0));window.open('https://wa.me/91XXXXXXXXXX?text='+msg,'_blank')}
render();