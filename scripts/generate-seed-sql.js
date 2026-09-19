// Generates supabase/seed-catalog.sql from catalog-data.js. No network. Re-runnable.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PRODUCTS, img } = require('./catalog-data');

const uid = () => crypto.randomUUID();
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const arr = (a) => `ARRAY[${a.map((x) => q(x)).join(',')}]`;
const daysAgo = (n) => `now() - interval '${n} days'`;

const USERS = [
  ['ace60363-e6da-4a84-a3b6-e6e822076751', 'ram@example.com', 'Ram Shrestha'],
  ['58ba1067-4870-4b0c-8c00-93d801450908', 'sita@example.com', 'Sita Tamang'],
  ['20839103-c45f-4bb5-aa19-c16ba082ebef', 'hari@example.com', 'Hari Gurung'],
  ['09ec69a8-7fbd-41b0-bfe6-7af382377a83', 'gita@example.com', 'Gita Magar'],
  ['a5001537-9891-48ad-b245-0c229cd70271', 'krishna@example.com', 'Krishna Thapa'],
  ['82ffbaa5-3c4d-42e9-9267-9a95326edaf1', 'laxmi@example.com', 'Laxmi Rai'],
  ['0d086b8e-369a-4426-9ec0-12c77e00f4de', 'binod@example.com', 'Binod Poudel'],
  ['d81a25bf-2c67-4872-acdc-d0344795bbf6', 'anita@example.com', 'Anita Khadka'],
  ['1a3937c3-be9d-4200-a040-895424247f94', 'suresh@example.com', 'Suresh Bhandari'],
  ['3cb1e44a-68a3-4911-844b-da3feb8154c6', 'kamala@example.com', 'Kamala Adhikari'],
];

const out = ['-- Doko Pasal realistic catalog seed. Run AFTER supabase/wipe-demo.sql.', '-- 60 products (verified photos), 5 banners, 5 coupons, 60 reviews, 8 orders, 6 threads.', ''];

// ---- products ----
const pids = PRODUCTS.map(() => uid());
out.push('-- products');
PRODUCTS.forEach((p, i) => {
  const urls = p.photos.map(img);
  out.push(`insert into products (id, name, description, price, sale_price, category, sizes, stock, image_url, image_urls, created_at) values (${q(pids[i])}, ${q(p.name)}, ${q(p.desc)}, ${p.price}, ${p.sale === null ? 'null' : p.sale}, ${q(p.cat)}, ${arr(p.sizes)}, ${p.stock}, ${q(urls[0])}, ${arr(urls)}, ${daysAgo(25 - (i % 25))});`);
});
out.push('');

// ---- banners (verified wide images) ----
const W = (id) => `https://images.unsplash.com/${id}?w=1200&h=500&fit=crop`;
const BANNERS = [
  ['Mega Dashain Sale', 'Up to 50% off on all traditional wear', W('photo-1617627143750-d86bc21e42bb'), '/products?sale=true', 'Shop Now', 1],
  ['New Arrivals for Men', 'Sharp suits, kurtas and winter layers', W('photo-1507679799987-c73779587ccf'), '/products?category=Men%27s+Wear', 'Explore', 2],
  ['Kids Festive Collection', 'Adorable outfits for your little ones', W('photo-1476234251651-f353703a034d'), '/products?category=Kids%27+Wear', 'View Collection', 3],
  ['Ethnic Wear Special', 'Sarees, kurtis and lehengas for every occasion', W('photo-1583391733956-3750e0ff4e8b'), "/products?category=Women%27s+Wear", 'Shop Ethnic', 4],
  ['Cash on Delivery', 'Pay at your doorstep, all over Nepal', W('photo-1483985988355-763728e1935b'), '/products', 'Start Shopping', 5],
];
out.push('-- banners');
BANNERS.forEach((b) => {
  out.push(`insert into banners (id, title, subtitle, image_url, link_url, button_text, position, active, created_at) values (${q(uid())}, ${q(b[0])}, ${q(b[1])}, ${q(b[2])}, ${q(b[3])}, ${q(b[4])}, ${b[5]}, true, now());`);
});
out.push('');

// ---- coupons ----
const COUPONS = [
  ['DASHAIN15', 'percentage', 15, 2000, 100, 6, '2027-10-30'],
  ['FIRST20', 'percentage', 20, 1500, 50, 11, '2027-12-31'],
  ['FLAT500', 'fixed', 500, 3000, 30, 4, '2027-12-31'],
  ['FREESHIP', 'fixed', 150, 1000, 200, 18, '2027-12-31'],
  ['TIHAR10', 'percentage', 10, 500, 150, 9, '2027-11-15'],
];
out.push('-- coupons');
COUPONS.forEach((c) => {
  out.push(`insert into coupons (id, code, type, value, min_order, max_uses, used_count, expires_at, active, created_at) values (${q(uid())}, ${q(c[0])}, ${q(c[1])}, ${c[2]}, ${c[3]}, ${c[4]}, ${c[5]}, ${q(c[6])}, true, now());`);
});
out.push('');

// ---- reviews: 1 per product, varied ----
const COMMENTS = {
  5: ['Amazing quality! Exactly as shown in the picture.', 'Perfect fit and fabric. Highly recommended!', 'Bought this for Dashain. Looked amazing!', 'Super comfortable and stylish. Five stars!', 'Excellent craftsmanship. Attention to detail.'],
  4: ['Love this product. Fabric is very comfortable.', 'Good value for money. Will buy again.', 'Delivery to Kathmandu was quick. Very happy!', 'Nice color and fabric. Runs true to size.', 'Great product! My kids absolutely love it.'],
  3: ['Decent quality for the price. Shipping was fast.', 'Good product but expected slightly better stitching.', 'Fair product. Nothing special but does the job.'],
};
out.push('-- reviews');
PRODUCTS.forEach((p, i) => {
  const r = i % 10 === 7 ? 3 : i % 3 === 0 ? 4 : 5;
  const pool = COMMENTS[r];
  const u = USERS[i % USERS.length];
  out.push(`insert into reviews (id, product_id, user_id, user_name, rating, comment, created_at) values (${q(uid())}, ${q(pids[i])}, ${q(u[0])}, ${q(u[2])}, ${r}, ${q(pool[i % pool.length])}, ${daysAgo(1 + (i % 28))});`);
});
out.push('');

// ---- demo orders (8) + items ----
const eff = (p) => (p.sale !== null && p.sale < p.price ? p.sale : p.price);
const ORDERS = [
  // [productIdxs, qtys, name, phone, address, payMethod, payStatus, ordStatus, daysAgo, note]
  [[20, 21], [1, 1], 'Ram Shrestha', '9841234567', 'Kalimati, Kathmandu', 'cod', 'pending', 'pending', 1, null],
  [[5, 0], [1, 2], 'Sita Tamang', '9851034567', 'Lakeside, Pokhara', 'esewa', 'paid', 'processing', 2, 'Please call before delivery'],
  [[40, 44], [1, 1], 'Hari Gurung', '9846023456', 'Dharan-12, Sunsari', 'khalti', 'paid', 'shipped', 5, null],
  [[25, 30], [2, 1], 'Gita Magar', '9867012345', 'Butwal-8, Rupandehi', 'cod', 'pending', 'processing', 7, null],
  [[10, 12], [1, 1], 'Krishna Thapa', '9845012345', 'Biratnagar-5, Morang', 'esewa', 'paid', 'delivered', 12, null],
  [[50, 55], [1, 2], 'Laxmi Rai', '9852023456', 'Damak-3, Jhapa', 'khalti', 'paid', 'delivered', 15, 'Gift wrap please'],
  [[35, 36], [1, 1], 'Binod Poudel', '9849034567', 'Baneshwor, Kathmandu', 'bank', 'pending', 'pending', 0, null],
  [[15, 45], [1, 1], 'Anita Khadka', '9864012345', 'Dhangadhi-4, Kailali', 'cod', 'pending', 'delivered', 20, null],
];
out.push('-- orders + items');
ORDERS.forEach((o, i) => {
  const oid = uid();
  const u = USERS[i % USERS.length];
  let total = 0;
  const lines = [];
  o[0].forEach((pi, k) => {
    const p = PRODUCTS[pi];
    const qty = o[1][k];
    total += eff(p) * qty;
    lines.push(`insert into order_items (id, order_id, product_id, product_name, size, quantity, price) values (${q(uid())}, ${q(oid)}, ${q(pids[pi])}, ${q(p.name)}, ${q(p.sizes[0])}, ${qty}, ${eff(p)});`);
  });
  out.push(`insert into orders (id, user_id, customer_name, customer_phone, customer_address, total_amount, payment_method, payment_status, order_status, order_note, created_at) values (${q(oid)}, ${q(u[0])}, ${q(o[2])}, ${q(o[3])}, ${q(o[4])}, ${total}, ${q(o[5])}, ${q(o[6])}, ${q(o[7])}, ${o[9] === null ? 'null' : q(o[9])}, ${daysAgo(o[8])});`);
  out.push(...lines);
});
out.push('');

// ---- support threads (6) ----
const THREADS = [
  ['Can I exchange for a bigger size?', 'Namaste! Yes, size exchange is free within 7 days. Please share your order ID.', 'I ordered a kurta in M but need L. Order id starts with a3f9.', 'Noted! We will arrange a pickup and send L. Anything else?'],
  ['When will my order arrive in Pokhara?', 'Namaste! Pokhara delivery takes 3-4 days. Your order is on the way.', 'Great, thank you! Will someone call before delivery?', 'Yes, our rider calls 30 minutes before arrival.'],
  ['I want to return this sweater', 'Sorry to hear that! What is the issue — size or quality?', 'The color is darker than the photo. Can I get a refund?', 'Yes. We will pick it up and refund to your eSewa within 3 days.'],
  ['Does DASHAIN15 still work?', 'Yes! DASHAIN15 gives 15% off on orders above Rs. 2000 until Tihar.', 'My cart is Rs. 1800. If I add socks will it apply?', 'Yes — once your total crosses Rs. 2000 the code will apply.'],
  ['Is Cash on Delivery available in Butwal?', 'Yes, COD is available all over Nepal with no extra charge.', 'Perfect, placing my order now. Thank you!', 'You are welcome! Message us anytime for help.'],
  ['Do you have this lehenga in maroon?', 'The lehenga comes in red, maroon and green. Which size do you need?', 'Maroon in size M please. Is it in stock?', 'Yes, maroon M is in stock. You can order right away!'],
];
out.push('-- conversations + messages');
THREADS.forEach((t, i) => {
  const cid = uid();
  const u = USERS[(i * 2) % USERS.length];
  out.push(`insert into conversations (id, user_id, user_name, user_email, last_message, last_message_at, unread_count, created_at) values (${q(cid)}, ${q(u[0])}, ${q(u[2])}, ${q(u[1])}, ${q(t[3])}, ${daysAgo(3 - Math.min(i, 2))}, ${i < 2 ? 1 : 0}, ${daysAgo(6 - Math.min(i, 5))});`);
  t.forEach((msg, j) => {
    const admin = j % 2 === 1;
    out.push(`insert into messages (id, conversation_id, sender_id, sender_name, sender_email, content, media_url, media_type, is_admin, is_read, created_at) values (${q(uid())}, ${q(cid)}, ${q(admin ? USERS[0][0] : u[0])}, ${q(admin ? 'Doko Pasal' : u[2])}, ${q(admin ? 'admin' : u[1])}, ${q(msg)}, null, null, ${admin}, true, ${daysAgo(6 - Math.min(i, 5))});`);
  });
});
out.push('');
out.push("-- verify: expect 60 / 5 / 5 / 60 / 8 / 6");
out.push('select (select count(*) from products) as products, (select count(*) from banners) as banners, (select count(*) from coupons) as coupons, (select count(*) from reviews) as reviews, (select count(*) from orders) as orders, (select count(*) from conversations) as convos;');

fs.writeFileSync(path.join(__dirname, '..', 'supabase', 'seed-catalog.sql'), out.join('\n'));
console.log('WROTE seed-catalog.sql:', out.length, 'lines,', PRODUCTS.length, 'products');
