const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rkumkpobxhilvagewvmy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrdW1rcG9ieGhpbHZhZ2V3dm15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE0NTYwMiwiZXhwIjoyMDk1NzIxNjAyfQ.hBrhsqBRMBn47RAmlriF_cr8Ojpm1KWtpJ8vWx3rUIo'
);

function img(id) {
  return `https://images.unsplash.com/photo-${id}?w=600&h=750&fit=crop`;
}

const fixes = {
  // === MEN'S WEAR ===

  // T-shirts & Tees
  'Premium Cotton Round Neck': [
    img('1521572163474-6864f9cf17ab'),
    img('1618354691373-d851c5c3a990'),
    img('1583743814966-8936f5b7be1a'),
  ],
  'Pique Polo T-Shirt': [
    img('1586363104862-3a5e2ab60d99'),
  ],
  'Bold Graphic Print Tee': [
    img('1583743814966-8936f5b7be1a'),
  ],
  'Nautical Stripe Long Sleeve': [
    img('1562157873-818bc0726f68'),
  ],

  // Jeans & Pants
  'Slim Fit Stretch Jeans': [
    img('1542272604-787c3835535d'),
    img('1594633312681-425c7b97ccd1'),
  ],
  'Cotton Twill Chinos': [
    img('1473966968600-fa801b869a1a'),
  ],
  'Performance Track Pants': [
    img('1552902865-b72c031ac5ea'),
  ],
  'Utility Cargo Shorts': [
    img('1591195853828-11db59a44f6b'),
  ],

  // Shirts
  'Formal Spread Collar Shirt': [
    img('1596755094514-f87e34085b2c'),
    img('1603252109303-2751441dd157'),
  ],
  'Brushed Flannel Check Shirt': [
    img('1602810318383-e386cc2a3ccf'),
  ],
  'Breathable Linen Camp Shirt': [
    img('1594938298603-c8148c4dae35'),
  ],

  // Hoodies & Sweatshirts
  'Fleece Zip Hoodie': [
    img('1620799140408-edc6dcb6d633'),
    img('1556905055-8f358a7a47b2'),
  ],
  'Heavyweight Crew Sweatshirt': [
    img('1576566588028-4147f3842f27'),
  ],

  // Jackets & Vests
  'Quilted Puffer Jacket': [
    img('1551028719-00167b16eac5'),
    img('1515886657613-9f3515b0c78f'),
  ],
  'Streetwear Bomber Jacket': [
    img('1591047139829-d91aecb6caea'),
  ],
  'Lightweight Quilted Vest': [
    img('1591047139829-d91aecb6caea'),
  ],

  // Knitwear
  'Wool Blend V-Neck Pullover': [
    img('1576566588028-4147f3842f27'),
    img('1516826957135-700dedea698c'),
  ],
  'Wool Blend Single-Breasted Blazer': [
    img('1594938298603-c8148c4dae35'),
  ],

  // Sets & Accessories
  'Slim Fit Jogger Set': [
    img('1516826957135-700dedea698c'),
  ],
  'Genuine Leather Belt': [
    img('1553062407-98eeb64c6a62'),
  ],

  // === WOMEN'S WEAR ===
  'Hand-Embroidered Kurti': [
    img('1610030469983-98e550d6193c'),
    img('1588483456677-00ad3328387d'),
  ],
  'Traditional Cotton Saree': [
    img('1610030469983-98e550d6193c'),
    img('1594938298603-c8148c4dae35'),
  ],
  'Anarkali Suit Set': [
    img('1594938298603-c8148c4dae35'),
    img('1612336307429-8a898d10e223'),
  ],
  'Floral Maxi Dress': [
    img('1572804013309-59a88b7e92f1'),
    img('1496747611176-843222e1e57c'),
  ],
  'High-Waist Palazzo Pants': [
    img('1506629082955-511b1aa562c8'),
  ],
  'Silk Blend Lehenga Set': [
    img('1595777457583-95e059d581b8'),
  ],
  'Casual Cotton Relaxed Top': [
    img('1515886657613-9f3515b0c78f'),
    img('1483985988355-763728e1935b'),
  ],
  'Plaid Wrap Dress': [
    img('1487222477894-8943e31ef7b2'),
  ],
  'Classic Denim Jacket': [
    img('1485968579580-b6d095142e6e'),
  ],
  'Printed Kurti Palazzo Co-ord': [
    img('1612336307429-8a898d10e223'),
  ],
  'Satin Pleated Midi Skirt': [
    img('1509631179647-0177331693ae'),
  ],
  'Chikankari Work Kurta': [
    img('1596609548086-85bbf8ddb6b9'),
  ],
  'Off-Shoulder Ruffle Blouse': [
    img('1525507119028-ed4c629a60a3'),
  ],
  'Designer Sharara Set': [
    img('1495385794356-15371f348c31'),
  ],
  'Cotton Leggings 3-Pack': [
    img('1529139574466-a303027c1d8b'),
  ],
  'Block Print Dupatta': [
    img('1558171813-4c088753af8f'),
  ],
  'Flared Peplum Top': [
    img('1512436991641-6745cdb1723f'),
  ],
  'Embroidered Palazzo Set': [
    img('1623387641168-d9803ddd3f35'),
  ],
  'Boho Kaftan Beach Dress': [
    img('1490481651871-ab68de25d43d'),
  ],
  'Printed Anarkali Gown': [
    img('1469334031218-e382a71b716b'),
  ],

  // === KIDS' WEAR ===
  'Fun Cartoon Print Tee': [
    img('1519238263530-99bdd11df2ea'),
    img('1540479859555-17af45c78602'),
  ],
  'Layered Tulle Party Frock': [
    img('1518831959646-742c3a14ebf7'),
    img('1545486332-9e0999c535b2'),
  ],
  'Stretchy Denim Overalls': [
    img('1503944583220-79d8926ad5e2'),
  ],
  'Royal Kids Sherwani': [
    img('1503944583220-79d8926ad5e2'),
  ],
  'Sequin Lehenga Choli Set': [
    img('1476234251651-f3f7ef1b4f12'),
  ],
  'Printed Jogger 2-Piece Set': [
    img('1506629082955-511b1aa562c8'),
    img('1540479859555-17af45c78602'),
  ],
  'Navy School Uniform Set': [
    img('1518611012118-696072aa579a'),
  ],
  'Padded Hooded Winter Jacket': [
    img('1471286174890-9c112ffca5b4'),
  ],
  'All-in-One Cotton Romper': [
    img('1504439468489-c8920d796a29'),
  ],
  'Sporty Track Suit': [
    img('1529139574466-a303027c1d8b'),
    img('1518611012118-696072aa579a'),
  ],
  'Mirror Work Ethnic Dress': [
    img('1558171813-4c088753af8f'),
  ],
  'Organic Cotton Onesie Pack': [
    img('1504439468489-c8920d796a29'),
    img('1519238263530-99bdd11df2ea'),
  ],
  'Mini Daura Suruwal Set': [
    img('1503944583220-79d8926ad5e2'),
    img('1540479859555-17af45c78602'),
  ],
  'Summer Shorts & Tee Combo': [
    img('1519238263530-99bdd11df2ea'),
  ],
  'Formal Shirt & Trouser Set': [
    img('1518611012118-696072aa579a'),
    img('1545486332-9e0999c535b2'),
  ],
  'Printed Summer Frock': [
    img('1518831959646-742c3a14ebf7'),
  ],
  'Warm Hoodie & Jogger Set': [
    img('1471286174890-9c112ffca5b4'),
    img('1540479859555-17af45c78602'),
  ],
  'Rainbow Stripe T-Shirt Pack': [
    img('1519238263530-99bdd11df2ea'),
  ],
  'Cute Animal Print Onesie': [
    img('1504439468489-c8920d796a29'),
    img('1503944583220-79d8926ad5e2'),
  ],
  'Festival Special ethnic Set': [
    img('1503944583220-79d8926ad5e2'),
    img('1558171813-4c088753af8f'),
  ],
  'Casual Denim Jacket Kids': [
    img('1545486332-9e0999c535b2'),
  ],
};

async function fixImages() {
  console.log('🔧 Fixing product images...\n');

  const { data: products, error } = await supabase.from('products').select('id, name, image_url');
  if (error) { console.error('Fetch error:', error); return; }

  let fixed = 0;
  let broken = 0;

  for (const product of products || []) {
    const newImages = fixes[product.name];
    if (!newImages) {
      console.log(`SKIP (no mapping): ${product.name}`);
      continue;
    }

    // Check if current image is broken
    const currentUrl = product.image_url;
    let isBroken = false;
    try {
      const resp = await fetch(currentUrl.replace('w=600&h=750', 'w=50&h=50'), { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      isBroken = !resp.ok;
    } catch {
      isBroken = true;
    }

    if (!isBroken) {
      console.log(`OK (already working): ${product.name}`);
      continue;
    }

    broken++;
    const { error: updateError } = await supabase
      .from('products')
      .update({
        image_url: newImages[0],
        image_urls: newImages,
      })
      .eq('id', product.id);

    if (updateError) {
      console.error(`ERROR: ${product.name}: ${updateError.message}`);
    } else {
      console.log(`FIXED: ${product.name}`);
      fixed++;
    }
  }

  console.log(`\n✅ Fixed ${fixed} broken images out of ${broken} broken products`);
}

fixImages();
