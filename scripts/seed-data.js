const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  'https://rkumkpobxhilvagewvmy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrdW1rcG9ieGhpbHZhZ2V3dm15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE0NTYwMiwiZXhwIjoyMDk1NzIxNjAyfQ.hBrhsqBRMBn47RAmlriF_cr8Ojpm1KWtpJ8vWx3rUIo'
);

const uid = () => crypto.randomUUID();
const img = (id) => `https://images.unsplash.com/photo-${id}?w=600&h=750&fit=crop`;

const names = [
  'Ram Shrestha','Sita Tamang','Hari Gurung','Gita Magar','Krishna Thapa',
  'Laxmi Rai','Binod Poudel','Anita Khadka','Suresh Bhandari','Kamala Adhikari'
];

const userEmails = [
  'ram@example.com','sita@example.com','hari@example.com','gita@example.com','krishna@example.com',
  'laxmi@example.com','binod@example.com','anita@example.com','suresh@example.com','kamala@example.com'
];

// ========== 60 PRODUCTS - EACH WITH UNIQUE IMAGES ==========
const products = [
  // --- MEN'S WEAR (20) ---
  { name:'Premium Cotton Round Neck', description:'Soft 100% cotton round-neck t-shirt with a regular fit. Breathable fabric perfect for everyday casual wear. Available in multiple colors.', price:999, sale_price:799, category:"Men's Wear", sizes:['S','M','L','XL','XXL'], stock:45, imgIds:['1521572163474-6864f9cf17ab','1618354691373-d851c5c3a990','1583743814966-8936f5b7be1a'] },
  { name:'Slim Fit Stretch Jeans', description:'Modern slim fit jeans crafted from premium stretch denim. Mid-rise waist with tapered legs and classic 5-pocket styling.', price:2499, sale_price:1999, category:"Men's Wear", sizes:['28','30','32','34','36'], stock:35, imgIds:['1542272604-787c3835535d','1594633312681-425c7b97ccd1'] },
  { name:'Formal Spread Collar Shirt', description:'Elegant formal shirt in fine cotton blend. Slim fit with spread collar and full button placket. Ideal for office and formal occasions.', price:1899, sale_price:null, category:"Men's Wear", sizes:['S','M','L','XL'], stock:40, imgIds:['1596755094514-f87e34085b2c','1603252109303-2751441dd157'] },
  { name:'Fleece Zip Hoodie', description:'Comfortable zip-up hoodie in premium fleece. Full-zip front with kangaroo pockets and adjustable drawstring hood. Great for layering.', price:2999, sale_price:2499, category:"Men's Wear", sizes:['M','L','XL','XXL'], stock:25, imgIds:['1556821840-3a63f74e541b','1578768079470-38a65bac1597'] },
  { name:'Pique Polo T-Shirt', description:'Classic polo in pique cotton with ribbed collar, two-button placket, and side vents. Smart casual look for all occasions.', price:1499, sale_price:null, category:"Men's Wear", sizes:['S','M','L','XL','XXL'], stock:50, imgIds:['1625910513413-5fc42821c4d4'] },
  { name:'Wool Blend Single-Breasted Blazer', description:'Sophisticated wool blend blazer. Single-breasted with notch lapel, two front buttons, and chest pocket. Perfect for business meetings.', price:5999, sale_price:4999, category:"Men's Wear", sizes:['M','L','XL'], stock:15, imgIds:['1507679799987-c73779587ccf'] },
  { name:'Cotton Twill Chinos', description:'Relaxed-fit chino pants in soft cotton twill. Flat front with slash pockets and button closure. Versatile for casual and semi-formal.', price:1999, sale_price:null, category:"Men's Wear", sizes:['28','30','32','34','36'], stock:30, imgIds:['1473966968600-fa801b869a1a'] },
  { name:'Quilted Puffer Jacket', description:'Warm lightweight puffer jacket with quilted insulation. Water-resistant shell, zip front, and side pockets. Ideal for cold weather.', price:4499, sale_price:3499, category:"Men's Wear", sizes:['M','L','XL','XXL'], stock:20, imgIds:['1551028719-00167b16eac5','1544923246-77307dd270b2'] },
  { name:'Nautical Stripe Long Sleeve', description:'Classic striped long sleeve t-shirt in soft cotton jersey. Ribbed crew neck and cuffs. Timeless nautical-inspired design.', price:1299, sale_price:null, category:"Men's Wear", sizes:['S','M','L','XL'], stock:40, imgIds:['1622445275576-721325763afe'] },
  { name:'Performance Track Pants', description:'Moisture-wicking track pants with elastic waistband and drawcord. Zip pockets and tapered leg. Perfect for workouts and lounging.', price:1799, sale_price:1499, category:"Men's Wear", sizes:['S','M','L','XL','XXL'], stock:35, imgIds:['1552902865-b72c031ac5ea'] },
  { name:'Brushed Flannel Check Shirt', description:'Warm flannel shirt in classic plaid. Brushed cotton for extra softness. Button-down collar and chest pocket for winter layering.', price:2199, sale_price:null, category:"Men's Wear", sizes:['M','L','XL','XXL'], stock:28, imgIds:['1602810318383-e386cc2a3ccf'] },
  { name:'Breathable Linen Camp Shirt', description:'Breathable linen shirt with camp collar and coconut shell buttons. Relaxed fit perfect for beach vacations and casual outings.', price:2499, sale_price:1999, category:"Men's Wear", sizes:['S','M','L','XL'], stock:22, imgIds:['1603252109303-2751441dd157'] },
  { name:'Heavyweight Crew Sweatshirt', description:'Heavyweight cotton sweatshirt with classic crew neck. Ribbed cuffs and hem. Fleece-lined interior for warmth and comfort.', price:2299, sale_price:null, category:"Men's Wear", sizes:['M','L','XL','XXL'], stock:30, imgIds:['1578768079470-38a65bac1597'] },
  { name:'Utility Cargo Shorts', description:'Durable cargo shorts with multiple utility pockets. Relaxed fit with elastic waist and adjustable drawstring. Great for outdoor adventures.', price:1599, sale_price:1299, category:"Men's Wear", sizes:['S','M','L','XL'], stock:35, imgIds:['1591195853828-11db59a44f6b'] },
  { name:'Streetwear Bomber Jacket', description:'Stylish bomber jacket in lightweight polyester. Ribbed collar, cuffs, and hem. Zip front with side pockets. A streetwear essential.', price:3999, sale_price:3299, category:"Men's Wear", sizes:['M','L','XL'], stock:18, imgIds:['1544923246-77307dd270b2'] },
  { name:'Wool Blend V-Neck Pullover', description:'Classic V-neck sweater in soft wool blend. Ribbed trim at neck, cuffs, and hem. Layer over a shirt for a polished look.', price:2799, sale_price:null, category:"Men's Wear", sizes:['M','L','XL','XXL'], stock:20, imgIds:['1434389677669-e08b4cda3ea4','1576566588028-4147f3842f27'] },
  { name:'Bold Graphic Print Tee', description:'Eye-catching graphic print t-shirt in 100% cotton. Bold front design with regular fit and crew neck. Everyday comfort meets style.', price:1199, sale_price:999, category:"Men's Wear", sizes:['S','M','L','XL','XXL'], stock:50, imgIds:['1583743814966-8936f5b7be1a'] },
  { name:'Genuine Leather Belt', description:'Full-grain genuine leather belt with brushed metal buckle. Width 1.5 inches. A wardrobe essential that lasts years.', price:1499, sale_price:null, category:"Men's Wear", sizes:['28','30','32','34','36'], stock:40, imgIds:['1553062407-98eeb64c6a62'] },
  { name:'Lightweight Quilted Vest', description:'Lightweight quilted vest with stand collar. Zip front closure and side pockets. Perfect for layering in transitional weather.', price:2999, sale_price:2499, category:"Men's Wear", sizes:['M','L','XL','XXL'], stock:15, imgIds:['1591047139829-d91aecb6caea'] },
  { name:'Slim Fit Jogger Set', description:'Matching jogger set with slim-fit sweatpants and crew neck top. French terry fabric with ribbed cuffs. Athletic meets casual.', price:2799, sale_price:2299, category:"Men's Wear", sizes:['S','M','L','XL'], stock:25, imgIds:['1588117305388-c2631a279f82'] },

  // --- WOMEN'S WEAR (20) ---
  { name:'Hand-Embroidered Kurti', description:'Beautiful hand-embroidered kurti in soft cotton. Intricate thread work on neckline and hemline. A-line silhouette for a flattering fit.', price:2499, sale_price:1999, category:"Women's Wear", sizes:['XS','S','M','L','XL'], stock:30, imgIds:['1583391733956-6c78276477e2','1610030469983-98e550d6193c'] },
  { name:'Traditional Cotton Saree', description:'Elegant cotton saree with traditional border design. Lightweight breathable fabric for daily wear. Includes matching blouse piece.', price:3999, sale_price:3499, category:"Women's Wear", sizes:['Free Size'], stock:20, imgIds:['1610030469983-98e550d6193c','1594938298603-c8148c4dae35'] },
  { name:'Anarkali Suit Set', description:'Graceful Anarkali set with flared kurta, palazzo pants, and matching dupatta. Geometric print on soft georgette. Perfect for festive occasions.', price:5999, sale_price:4999, category:"Women's Wear", sizes:['S','M','L','XL'], stock:15, imgIds:['1594938298603-c8148c4dae35','1612336307429-8a898d10e223'] },
  { name:'Floral Maxi Dress', description:'Flowing maxi dress with vibrant floral print. V-neckline, adjustable straps, and tiered skirt. Perfect for summer outings.', price:3499, sale_price:2999, category:"Women's Wear", sizes:['XS','S','M','L'], stock:22, imgIds:['1572804013309-59a88b7e92f1','1496747611176-843222e1e57c'] },
  { name:'High-Waist Palazzo Pants', description:'Elegant high-waist palazzo pants in flowy crepe. Wide-leg design with side zip. Dress up with heels or keep casual with flats.', price:1999, sale_price:null, category:"Women's Wear", sizes:['XS','S','M','L','XL'], stock:35, imgIds:['1506629082955-511b1aa562c8'] },
  { name:'Silk Blend Lehenga Set', description:'Stunning silk blend lehenga with embroidered blouse and sheer dupatta. Heavy hemline and waistband work. Ideal for weddings.', price:12999, sale_price:9999, category:"Women's Wear", sizes:['S','M','L'], stock:8, imgIds:['1595777457583-95e059d581b8'] },
  { name:'Casual Cotton Relaxed Top', description:'Relaxed-fit cotton top with round neck and short sleeves. Soft breathable fabric for all-day comfort. Pairs with jeans or leggings.', price:1299, sale_price:999, category:"Women's Wear", sizes:['XS','S','M','L','XL'], stock:50, imgIds:['1515886657613-9f3515b0c78f','1483985988355-763728e1935b'] },
  { name:'Plaid Wrap Dress', description:'Charming wrap dress in classic plaid. V-neckline, tie waist, and flutter sleeves. Flattering silhouette for all body types.', price:2999, sale_price:2499, category:"Women's Wear", sizes:['XS','S','M','L'], stock:20, imgIds:['1487222477894-8943e31ef7b2'] },
  { name:'Classic Denim Jacket', description:'Timeless denim jacket in vintage wash. Button-front closure with chest pockets. A must-have layering piece for any wardrobe.', price:3499, sale_price:2999, category:"Women's Wear", sizes:['XS','S','M','L'], stock:18, imgIds:['1485968579580-b6d095142e6e'] },
  { name:'Printed Kurti Palazzo Co-ord', description:'Co-ord set of printed kurti and solid palazzo. Straight-cut kurti with side slits. Comfortable and stylish for work or casual.', price:2799, sale_price:null, category:"Women's Wear", sizes:['S','M','L','XL'], stock:25, imgIds:['1612336307429-8a898d10e223'] },
  { name:'Satin Pleated Midi Skirt', description:'Elegant pleated midi skirt in satin-finish fabric. Elastic waistband for comfort. Pairs beautifully with tucked-in tops.', price:2199, sale_price:1799, category:"Women's Wear", sizes:['XS','S','M','L'], stock:22, imgIds:['1509631179647-0177331693ae'] },
  { name:'Chikankari Work Kurta', description:'Handcrafted Chikankari kurta in pure white cotton. Delicate shadow work embroidery. Straight fit with side slits.', price:3499, sale_price:2999, category:"Women's Wear", sizes:['S','M','L','XL'], stock:15, imgIds:['1596609548086-85bbf8ddb6b9'] },
  { name:'Off-Shoulder Ruffle Blouse', description:'Trendy off-shoulder blouse in stretchy cotton-blend. Ruffle trim along neckline. Shows off collarbones beautifully.', price:1699, sale_price:null, category:"Women's Wear", sizes:['XS','S','M','L'], stock:28, imgIds:['1525507119028-ed4c629a60a3'] },
  { name:'Designer Sharara Set', description:'Designer sharara set with short kurti, flared sharara pants, and net dupatta. Zari and sequin embellishments for festive celebrations.', price:7999, sale_price:6499, category:"Women's Wear", sizes:['S','M','L'], stock:10, imgIds:['1495385794356-15371f348c31'] },
  { name:'Cotton Leggings 3-Pack', description:'Set of 3 cotton leggings in essential colors. 4-way stretch with wide waistband. Opaque non-see-through fabric. Everyday essentials.', price:1499, sale_price:1199, category:"Women's Wear", sizes:['XS','S','M','L','XL'], stock:60, imgIds:['1529139574466-a303027c1d8b'] },
  { name:'Block Print Dupatta', description:'Beautifully printed dupatta in lightweight chiffon. Vibrant block print design. Versatile as scarf, shawl, or head covering.', price:899, sale_price:699, category:"Women's Wear", sizes:['Free Size'], stock:45, imgIds:['1558171813-4c088753af8f'] },
  { name:'Flared Peplum Top', description:'Cute peplum top with flared waist. Cap sleeves and V-neckline. Structured yet flowy silhouette that pairs with skinny jeans.', price:1599, sale_price:null, category:"Women's Wear", sizes:['XS','S','M','L'], stock:25, imgIds:['1512436991641-6745cdb1723f'] },
  { name:'Embroidered Palazzo Set', description:'Luxurious palazzo set with embroidered kurta and flared palazzos. Thread and mirror work detailing. Rich fabric with graceful fall.', price:4499, sale_price:3999, category:"Women's Wear", sizes:['S','M','L','XL'], stock:12, imgIds:['1587654780291-39c9404d7dd0'] },
  { name:'Boho Kaftan Beach Dress', description:'Free-spirited kaftan with bohemian print. Side pockets and adjustable waist tie. Perfect as beach cover-up or casual summer dress.', price:2499, sale_price:1999, category:"Women's Wear", sizes:['S','M','L','XL'], stock:18, imgIds:['1490481651871-ab68de25d43d'] },
  { name:'Printed Anarkali Gown', description:'Floor-length Anarkali gown with all-over print. Flared bottom with matching dupatta. Perfect for receptions and evening events.', price:6999, sale_price:5999, category:"Women's Wear", sizes:['S','M','L'], stock:10, imgIds:['1469334031218-e382a71b716b'] },

  // --- KIDS' WEAR (20) ---
  { name:'Fun Cartoon Print Tee', description:'Colorful cartoon print t-shirt for kids. Soft cotton gentle on skin. Durable print stays vibrant after multiple washes.', price:699, sale_price:499, category:"Kids' Wear", sizes:['3-4Y','5-6Y','7-8Y','9-10Y'], stock:60, imgIds:['1519238263530-99bdd11df2ea','1540479859555-17af45c78602'] },
  { name:'Layered Tulle Party Frock', description:'Adorable party frock with layered tulle skirt and satin bodice. Bow detail on waist. Perfect for birthdays and celebrations.', price:1999, sale_price:1499, category:"Kids' Wear", sizes:['3-4Y','5-6Y','7-8Y'], stock:25, imgIds:['1518831959646-742c3a14ebf7','1545486332-9e0999c535b2'] },
  { name:'Stretchy Denim Overalls', description:'Cute denim overalls with adjustable straps and front pocket. Soft stretchy denim for active kids. Easy snap buttons.', price:1499, sale_price:null, category:"Kids' Wear", sizes:['2-3Y','4-5Y','6-7Y','8-9Y'], stock:30, imgIds:['1503944583220-79d8926ad5e2'] },
  { name:'Royal Kids Sherwani', description:'Royal-looking sherwani with churidar pants. Silk blend with golden embroidery. Perfect for weddings and cultural celebrations.', price:3499, sale_price:2999, category:"Kids' Wear", sizes:['3-4Y','5-6Y','7-8Y','9-10Y'], stock:15, imgIds:['1516627145197-440fb8c8d8c6'] },
  { name:'Sequin Lehenga Choli Set', description:'Mini lehenga choli for little girls. Bright colors with sequin and mirror work. Includes skirt, blouse, and small dupatta.', price:2999, sale_price:2499, category:"Kids' Wear", sizes:['3-4Y','5-6Y','7-8Y'], stock:12, imgIds:['1476234251651-f3f7ef1b4f12'] },
  { name:'Printed Jogger 2-Piece Set', description:'Jogger set with printed sweatshirt and matching pants. Soft French terry fabric. Elastic waistband and cuffs.', price:1799, sale_price:1499, category:"Kids' Wear", sizes:['4-5Y','6-7Y','8-9Y','10-11Y'], stock:35, imgIds:['1506629082955-511b1aa562c8','1540479859555-17af45c78602'] },
  { name:'Navy School Uniform Set', description:'Complete school uniform with polo shirt and shorts/skirt. Durable polyester-cotton blend. Wrinkle and stain resistant.', price:1299, sale_price:null, category:"Kids' Wear", sizes:['4-5Y','6-7Y','8-9Y','10-11Y','12-13Y'], stock:50, imgIds:['1518611012118-696072aa579a'] },
  { name:'Padded Hooded Winter Jacket', description:'Warm padded jacket with hood. Water-resistant outer shell and soft fleece lining. Full zip with chin guard for cold mornings.', price:2499, sale_price:1999, category:"Kids' Wear", sizes:['4-5Y','6-7Y','8-9Y','10-11Y'], stock:20, imgIds:['1471286174890-9c112ffca5b4'] },
  { name:'All-in-One Cotton Romper', description:'Adorable romper in soft printed cotton. Snap closure at bottom for easy diaper changes. Perfect for summer outings.', price:899, sale_price:699, category:"Kids' Wear", sizes:['0-1Y','1-2Y','2-3Y'], stock:40, imgIds:['1504439468489-c8920d796a29'] },
  { name:'Sporty Track Suit', description:'Track suit with full zip jacket and elastic waist pants. Stripes along sides for classic athletic look. Great for sports.', price:1999, sale_price:1699, category:"Kids' Wear", sizes:['5-6Y','7-8Y','9-10Y','11-12Y'], stock:30, imgIds:['1529139574466-a303027c1d8b','1518611012118-696072aa579a'] },
  { name:'Mirror Work Ethnic Dress', description:'Beautiful ethnic dress with mirror work and tassels. Soft cotton lining. Perfect for Dashain, Tihar, and festive celebrations.', price:1799, sale_price:1499, category:"Kids' Wear", sizes:['3-4Y','5-6Y','7-8Y'], stock:20, imgIds:['1558171813-4c088753af8f'] },
  { name:'Organic Cotton Onesie Pack', description:'Set of 3 organic cotton onesies in pastel colors. Envelope neckline for easy on/off. Reinforced snaps. Gentle on newborn skin.', price:1199, sale_price:999, category:"Kids' Wear", sizes:['0-3M','3-6M','6-12M'], stock:55, imgIds:['1504439468489-c8920d796a29','1519238263530-99bdd11df2ea'] },
  { name:'Mini Daura Suruwal Set', description:'Miniature Nepali Daura Suruwal for boys. Cotton with cross-button front. Perfect for cultural events and family gatherings.', price:1999, sale_price:1699, category:"Kids' Wear", sizes:['4-5Y','6-7Y','8-9Y','10-11Y'], stock:18, imgIds:['1516627145197-440fb8c8d8c6','1476234251651-f3f7ef1b4f12'] },
  { name:'Summer Shorts & Tee Combo', description:'Matching set of printed shorts and crew neck tee. Lightweight cotton for hot days. Elastic waistband for comfortable fit.', price:999, sale_price:799, category:"Kids' Wear", sizes:['3-4Y','5-6Y','7-8Y','9-10Y'], stock:45, imgIds:['1587654780291-39c9404d7dd0'] },
  { name:'Formal Shirt & Trouser Set', description:'Smart formal set with white cotton shirt and navy pants. Perfect for school events and family gatherings. Iron-free fabric.', price:1599, sale_price:null, category:"Kids' Wear", sizes:['5-6Y','7-8Y','9-10Y','11-12Y'], stock:25, imgIds:['1518611012118-696072aa579a','1545486332-9e0999c535b2'] },
  { name:'Printed Summer Frock', description:'Lightweight summer frock with fun prints. Sleeveless design with flared skirt. Elastic waist for easy dressing.', price:1299, sale_price:999, category:"Kids' Wear", sizes:['2-3Y','4-5Y','6-7Y'], stock:35, imgIds:['1518831959646-742c3a14ebf7'] },
  { name:'Warm Hoodie & Jogger Set', description:'Cozy hoodie and jogger set in soft fleece. Kangaroo pocket and drawstring hood. Elastic cuffs for a snug fit.', price:1699, sale_price:1399, category:"Kids' Wear", sizes:['4-5Y','6-7Y','8-9Y','10-11Y'], stock:30, imgIds:['1471286174890-9c112ffca5b4','1540479859555-17af45c78602'] },
  { name:'Rainbow Stripe T-Shirt Pack', description:'Pack of 3 rainbow stripe t-shirts in vibrant colors. 100% cotton jersey. Crew neck with ribbed collar. Daily essentials.', price:1499, sale_price:1199, category:"Kids' Wear", sizes:['3-4Y','5-6Y','7-8Y','9-10Y'], stock:40, imgIds:['1519238263530-99bdd11df2ea'] },
  { name:'Cute Animal Print Onesie', description:'Adorable animal-print onesie for babies. Zip front for easy changes. Footed design keeps little toes warm. Soft jersey fabric.', price:999, sale_price:799, category:"Kids' Wear", sizes:['0-3M','3-6M','6-12M'], stock:50, imgIds:['1504439468489-c8920d796a29','1516627145197-440fb8c8d8c6'] },
  { name:'Festival Special ethnic Set', description:'Festive ethnic set with kurta, dhoti pants, and tiny turban. Rich fabric with gold trim. Perfect for Diwali and cultural programs.', price:2499, sale_price:1999, category:"Kids' Wear", sizes:['3-4Y','5-6Y','7-8Y'], stock:15, imgIds:['1476234251651-f3f7ef1b4f12','1558171813-4c088753af8f'] },
  { name:'Casual Denim Jacket Kids', description:'Mini denim jacket with button front. Classic wash with chest pockets. Layer over any outfit for instant cool factor.', price:1999, sale_price:1599, category:"Kids' Wear", sizes:['4-5Y','6-7Y','8-9Y'], stock:20, imgIds:['1545486332-9e0999c535b2'] }
];

// ========== 5 BANNERS ==========
const banners = [
  { title:'Mega Dashain Sale', subtitle:'Up to 50% off on all traditional wear', image_url:'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=500&fit=crop', link_url:'/products?category=Women%27s+Wear', button_text:'Shop Now', position:1, active:true },
  { title:'New Arrivals for Men', subtitle:'Check out the latest collection', image_url:'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=500&fit=crop', link_url:'/products?category=Men%27s+Wear', button_text:'Explore', position:2, active:true },
  { title:'Kids Summer Collection', subtitle:'Adorable outfits for your little ones', image_url:'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=1200&h=500&fit=crop', link_url:'/products?category=Kids%27+Wear', button_text:'View Collection', position:3, active:true },
  { title:'Free Delivery on Rs. 2000+', subtitle:'Flat rate shipping across Nepal', image_url:'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=500&fit=crop', link_url:'/products', button_text:'Start Shopping', position:4, active:true },
  { title:'Ethnic Wear Special', subtitle:'Handpicked traditional outfits for every occasion', image_url:'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200&h=500&fit=crop', link_url:'/products?search=traditional', button_text:'Shop Ethnic', position:5, active:true }
];

const coupons = [
  { code:'DASHAIN15', type:'percentage', value:15, min_order:2000, max_uses:100, used_count:23, expires_at:'2026-10-30', active:true },
  { code:'FIRST20', type:'percentage', value:20, min_order:1500, max_uses:50, used_count:12, expires_at:'2026-12-31', active:true },
  { code:'FLAT500', type:'fixed', value:500, min_order:3000, max_uses:30, used_count:8, expires_at:'2026-09-15', active:true },
  { code:'FREESHIP', type:'fixed', value:150, min_order:1000, max_uses:200, used_count:67, expires_at:'2026-12-31', active:true },
  { code:'NEWYEAR', type:'percentage', value:10, min_order:500, max_uses:150, used_count:45, expires_at:'2027-01-15', active:true }
];

const reviewComments = [
  'Amazing quality! Exactly as shown in the picture.',
  'Love this product. Fabric is very comfortable.',
  'Good value for money. Will buy again.',
  'The fit is perfect. Highly recommended!',
  'Beautiful design and great stitching.',
  'Delivered on time. Product quality is excellent.',
  'Better than expected. Very happy with my purchase.',
  'Nice color and fabric. Runs true to size.',
  'Perfect for the occasion. Got many compliments.',
  'Decent quality for the price. Shipping was fast.',
  'Not bad, but expected slightly better stitching.',
  'Great product! My kids absolutely love it.',
  'The material feels premium. Worth every rupee.',
  'Slightly tight around the waist but overall good.',
  'Lovely embroidery work. Very detailed and precise.',
  'Repeat customer here. Always satisfied.',
  'This kurti is now my favorite! Beautiful pattern.',
  'Color faded a little after first wash though.',
  'Super comfortable and stylish. Five stars!',
  'Bought this for Dashain. Looked amazing!',
  'Good quality cotton. Breathable and soft.',
  'Sizing chart was accurate. Fits perfectly.',
  'Delivery to Kathmandu was quick. Very happy!',
  'Excellent craftsmanship. Attention to detail.',
  'Fair product. Nothing special but does the job.',
  'My daughter loved this dress! Beautiful color.',
  'Very elegant design. Perfect for formal events.',
  'Satisfied with the purchase. Will recommend.',
  'The stitching could be better but fabric is nice.',
  'Absolutely love it! Already ordered another one.',
  'Perfect for daily wear. Very durable material.',
  'Got many compliments at the party. Thank you!',
  'The packaging was also very nice and premium.',
  'Could use more color options but great product.',
  'My son wears this every day. He loves it!',
  'Arrived earlier than expected. Very pleased.',
  'The fabric quality is top notch. Highly recommend.',
  'Good for the price range. Not premium but decent.',
  'This is exactly what I was looking for. Perfect!',
  'Will definitely shop here again. Great experience.'
];

async function seed() {
  console.log('🚀 Starting seed...\n');

  // ===== 0. Create Auth Users =====
  console.log('👤 Creating 10 test auth users...');
  const realUserIds = [];
  for (let i = 0; i < userEmails.length; i++) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: userEmails[i],
      password: 'Test123456',
      email_confirm: true,
      user_metadata: { full_name: names[i] }
    });
    if (error && error.message?.includes('already')) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const found = users?.users?.find(u => u.email === userEmails[i]);
      if (found) { realUserIds.push(found.id); console.log(`  ℹ️  ${userEmails[i]} exists, using existing`); }
    } else if (data?.user) {
      realUserIds.push(data.user.id);
      console.log(`  ✅ Created ${userEmails[i]}`);
    } else {
      console.error(`  ❌ ${userEmails[i]}:`, error?.message);
      realUserIds.push(uid());
    }
  }
  console.log(`  📋 ${realUserIds.length} user IDs ready\n`);

  // ===== 1. Products =====
  console.log('📦 Inserting 60 products...');
  const productRows = products.map(p => ({
    id: uid(),
    name: p.name,
    description: p.description,
    price: p.price,
    sale_price: p.sale_price,
    category: p.category,
    sizes: p.sizes,
    stock: p.stock,
    image_url: img(p.imgIds[0]),
    image_urls: p.imgIds.map(id => img(id)),
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  }));

  const { error: prodErr } = await supabase.from('products').insert(productRows);
  if (prodErr) console.error('Products error:', prodErr);
  else console.log(`  ✅ ${productRows.length} products inserted\n`);

  // ===== 2. Banners =====
  console.log('🖼️  Inserting 5 banners...');
  const bannerRows = banners.map(b => ({ id: uid(), ...b, created_at: new Date().toISOString() }));
  const { error: banErr } = await supabase.from('banners').insert(bannerRows);
  if (banErr) console.error('Banners error:', banErr);
  else console.log(`  ✅ ${bannerRows.length} banners inserted\n`);

  // ===== 3. Coupons =====
  console.log('🎟️  Inserting 5 coupons...');
  const couponRows = coupons.map(c => ({ id: uid(), ...c, created_at: new Date().toISOString() }));
  const { error: coupErr } = await supabase.from('coupons').insert(couponRows);
  if (coupErr) console.error('Coupons error:', coupErr);
  else console.log(`  ✅ ${couponRows.length} coupons inserted\n`);

  // ===== 4. Orders + Order Items =====
  console.log('📋 Inserting 25 orders...');
  const payMethods = ['cod','khalti','esewa'];
  const oStatuses = ['pending','processing','shipped','delivered','cancelled'];
  const pStatuses = ['pending','paid','paid','paid','failed'];
  const cities = ['Kathmandu','Pokhara','Lalitpur','Bhaktapur','Biratnagar','Butwal','Dharan','Hetauda','Nepalgunj','Janakpur'];

  const orderRows = [];
  const itemRows = [];

  for (let i = 0; i < 25; i++) {
    const orderId = uid();
    const userId = realUserIds[i % realUserIds.length];
    const numItems = Math.floor(Math.random() * 3) + 1;
    let total = 0;
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
    const city = cities[i % cities.length];

    for (let j = 0; j < numItems; j++) {
      const prod = productRows[Math.floor(Math.random() * productRows.length)];
      const qty = Math.floor(Math.random() * 2) + 1;
      const price = prod.sale_price || prod.price;
      const size = prod.sizes[Math.floor(Math.random() * prod.sizes.length)];
      total += price * qty;
      itemRows.push({ id: uid(), order_id: orderId, product_id: prod.id, product_name: prod.name, size, quantity: qty, price });
    }

    const si = i % oStatuses.length;
    orderRows.push({
      id: orderId, user_id: userId,
      customer_name: names[i % names.length],
      customer_phone: `98${String(Math.floor(Math.random() * 10000000)).padStart(7,'0')}`,
      customer_address: `${Math.floor(Math.random()*500)+1}, ${city}, Nepal`,
      total_amount: total,
      payment_method: payMethods[i % payMethods.length],
      payment_status: pStatuses[si], order_status: oStatuses[si],
      order_note: i % 4 === 0 ? 'Please deliver in the morning' : null,
      coupon_code: i % 5 === 0 ? 'DASHAIN15' : null,
      discount_amount: i % 5 === 0 ? Math.floor(total * 0.15) : 0,
      created_at: createdAt
    });
  }

  const { error: ordErr } = await supabase.from('orders').insert(orderRows);
  if (ordErr) console.error('Orders error:', ordErr);
  else console.log(`  ✅ ${orderRows.length} orders inserted`);

  const { error: itemErr } = await supabase.from('order_items').insert(itemRows);
  if (itemErr) console.error('Order items error:', itemErr);
  else console.log(`  ✅ ${itemRows.length} order items inserted\n`);

  // ===== 5. Reviews =====
  console.log('⭐ Inserting 40 reviews...');
  const reviewRows = [];
  for (let i = 0; i < 40; i++) {
    const prod = productRows[Math.floor(Math.random() * productRows.length)];
    reviewRows.push({
      id: uid(), product_id: prod.id,
      user_id: realUserIds[i % realUserIds.length],
      user_name: names[i % names.length],
      rating: Math.floor(Math.random() * 3) + 3,
      comment: reviewComments[i % reviewComments.length],
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  const { error: revErr } = await supabase.from('reviews').insert(reviewRows);
  if (revErr) console.error('Reviews error:', revErr);
  else console.log(`  ✅ ${reviewRows.length} reviews inserted\n`);

  // ===== 6. Activity Logs =====
  console.log('📊 Inserting 60 activity logs...');
  const actions = ['page_view','product_view','add_to_cart','purchase','signup','login'];
  const pages = ['/', '/products', '/cart', '/checkout', '/orders', '/profile'];
  const actRows = [];
  for (let i = 0; i < 60; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const prod = productRows[Math.floor(Math.random() * productRows.length)];
    actRows.push({
      id: uid(),
      user_id: realUserIds[i % realUserIds.length],
      user_email: userEmails[i % userEmails.length],
      user_name: names[i % names.length],
      action, page: pages[Math.floor(Math.random() * pages.length)],
      details: action === 'product_view' ? { product_id: prod.id, product_name: prod.name }
        : action === 'purchase' ? { total: prod.price, payment_method: 'cod' } : {},
      created_at: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  const { error: actErr } = await supabase.from('activity_logs').insert(actRows);
  if (actErr) console.error('Activity error:', actErr);
  else console.log(`  ✅ ${actRows.length} activity logs inserted\n`);

  // ===== 7. Site Settings =====
  console.log('⚙️  Inserting site settings...');
  const settings = [
    { key:'store_name', value:'Doko Pasal' },
    { key:'store_tagline', value:'Authentic Nepali Fashion, Delivered to Your Doorstep' },
    { key:'announcement_text', value:'Free Delivery on orders above Rs. 2000!' },
    { key:'announcement_active', value:'true' },
    { key:'contact_email', value:'support@dokopasal.com' },
    { key:'contact_phone', value:'+977-9801234567' },
    { key:'contact_address', value:'New Baneshwor, Kathmandu, Nepal' },
    { key:'facebook_url', value:'https://facebook.com/dokopasal' },
    { key:'instagram_url', value:'https://instagram.com/dokopasal' },
    { key:'tiktok_url', value:'https://tiktok.com/@dokopasal' },
    { key:'delivery_info', value:'We deliver across Nepal. Standard delivery takes 2-5 business days. Free delivery on orders above Rs. 2000.' },
    { key:'return_info', value:'We accept returns within 7 days of delivery. Items must be unworn with tags attached. Contact support for return requests.' }
  ];
  const { error: setErr } = await supabase.from('site_settings').upsert(settings.map(s => ({ ...s, updated_at: new Date().toISOString() })), { onConflict: 'key' });
  if (setErr) console.error('Settings error:', setErr);
  else console.log(`  ✅ ${settings.length} settings inserted\n`);

  // ===== 8. Conversations + Messages =====
  console.log('💬 Inserting 8 conversations + messages...');
  const convRows = [];
  const msgRows = [];
  for (let i = 0; i < 8; i++) {
    const convId = uid();
    const userId = realUserIds[i];
    const userName = names[i];
    const msgs = [
      { content:'Hi, I have a question about my order.', is_admin:false },
      { content:'Hello! Sure, how can I help you?', is_admin:true },
      { content:'When will my order be delivered?', is_admin:false },
      { content:'Your order is on the way. Expected delivery within 2-3 days.', is_admin:true }
    ];
    convRows.push({
      id: convId, user_id: userId, user_name: userName,
      user_email: userEmails[i],
      last_message: msgs[msgs.length-1].content,
      last_message_at: new Date(Date.now() - (8-i)*3600000).toISOString(),
      unread_count: i < 3 ? (i === 0 ? 1 : i === 1 ? 2 : 1) : 0,
      created_at: new Date(Date.now() - (8-i)*86400000).toISOString()
    });
    msgs.forEach((m, j) => {
      msgRows.push({
        id: uid(), conversation_id: convId,
        sender_id: m.is_admin ? realUserIds[0] : userId,
        sender_name: m.is_admin ? 'Doko Pasal' : userName,
        sender_email: m.is_admin ? 'admin' : userEmails[i],
        content: m.content, media_url: null, media_type: null,
        is_admin: m.is_admin, is_read: true,
        created_at: new Date(Date.now() - (8-i)*3600000 + j*300000).toISOString()
      });
    });
  }
  const { error: convErr } = await supabase.from('conversations').insert(convRows);
  if (convErr) console.error('Conversations error:', convErr);
  else console.log(`  ✅ ${convRows.length} conversations inserted`);

  const { error: msgErr } = await supabase.from('messages').insert(msgRows);
  if (msgErr) console.error('Messages error:', msgErr);
  else console.log(`  ✅ ${msgRows.length} messages inserted`);

  console.log('\n🎉 Seed complete! Refresh your site.');
}

seed().catch(console.error);
