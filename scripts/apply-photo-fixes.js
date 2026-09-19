// Apply visually-verified photo swaps to catalog-data.js. Re-runnable (idempotent).
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, 'catalog-data.js');
let src = fs.readFileSync(FILE, 'utf8');

// product name -> verified photo id list (eyeballed via contact sheets)
const FIX = {
  'Dhaka Daura Suruwal Set': ['photo-1507679799987-c73779587ccf', 'photo-1520975954732-35dd22299614', 'photo-1602810316693-3667c854239a', 'photo-1603252109303-2751441dd157'],
  'Classic Washed Denim Jacket': ['photo-1611312449408-fcece27cdbb7', 'photo-1525507119028-ed4c629a60a3', 'photo-1544022613-e87ca75a784a', 'photo-1473966968600-fa801b869a1a'],
  'Everest Lightweight Puffer Vest': ['photo-1548126032-079a0fb0099d', 'photo-1591047139829-d91aecb6caea', 'photo-1521341957697-b93449760f30', 'photo-1488161628813-04466f872be2'],
  'Everest Windcheater Jacket': ['photo-1591047139829-d91aecb6caea', 'photo-1548126032-079a0fb0099d', 'photo-1521341957697-b93449760f30', 'photo-1488161628813-04466f872be2'],
  'Breathable Linen Casual Shirt': ['photo-1596755094514-f87e34085b2c', 'photo-1602810318383-e386cc2a3ccf', 'photo-1598033129183-c4f50c736f10', 'photo-1489987707025-afc232f7ea0f'],
  'Himalayan Cotton Round-Neck Tee': ['photo-1521572163474-6864f9cf17ab', 'photo-1576566588028-4147f3842f27', 'photo-1583743814966-8936f5b7be1a', 'photo-1523381210434-271e8be1f52b'],
  'Pokhara Active Track Pants': ['photo-1584865288642-42078afe6942', 'photo-1624378439575-d8705ad7ae80', 'photo-1541099649105-f69ad21f3246', 'photo-1523381210434-271e8be1f52b'],
  'Chitwan Cotton Casual Shorts': ['photo-1591195853828-11db59a44f6b', 'photo-1541099649105-f69ad21f3246', 'photo-1473966968600-fa801b869a1a', 'photo-1542272604-787c3835535d'],
  'Sherpa Fleece Crewneck Sweatshirt': ['photo-1620799140408-edc6dcb6d633', 'photo-1552374196-c4e7ffc6e126', 'photo-1516826957135-700dedea698c', 'photo-1523381210434-271e8be1f52b'],
  'Kathmandu Slim-Fit Casual Blazer': ['photo-1507679799987-c73779587ccf', 'photo-1594938298603-c8148c4dae35', 'photo-1552374196-1ab2a1c593e8', 'photo-1552374196-c4e7ffc6e126'],
  'Basantapur Cotton Long Kurta': ['photo-1520975954732-35dd22299614', 'photo-1602810316693-3667c854239a', 'photo-1603252109303-2751441dd157', 'photo-1596755094514-f87e34085b2c'],
  'Newari Dhoti Kurta Set': ['photo-1520975954732-35dd22299614', 'photo-1602810318383-e386cc2a3ccf', 'photo-1596755094514-f87e34085b2c', 'photo-1598033129183-c4f50c736f10'],
  'Festive Embroidered Lehenga': ['photo-1617627143750-d86bc21e42bb', 'photo-1610030469983-98e550d6193c', 'photo-1595777457583-95e059d581b8', 'photo-1572804013309-59a88b7e92f1'],
  'Rayon Palazzo Kurta Set': ['photo-1515886657613-9f3515b0c78f', 'photo-1581044777550-4cfa60707c03', 'photo-1495385794356-15371f348c31', 'photo-1506629082955-511b1aa562c8'],
  'Velvet Dhaka Blouse': ['photo-1524504388940-b1c1722653e1', 'photo-1529139574466-a303027c1d8b', 'photo-1539109136881-3be0616acf4b'],
  'Patan Premium Silk Blouse': ['photo-1487222477894-8943e31ef7b2', 'photo-1529139574466-a303027c1d8b', 'photo-1524504388940-b1c1722653e1'],
  'Nagarkot Chunky Woolen Sweater': ['photo-1576871337622-98d48d1cf531', 'photo-1434389677669-e08b4cac3105', 'photo-1543076447-215ad9ba6923', 'photo-1620799139507-2a76f79a2f4d'],
  'Pokhara Wool-Blend Cardigan': ['photo-1434389677669-e08b4cac3105', 'photo-1576871337622-98d48d1cf531', 'photo-1539109136881-3be0616acf4b', 'photo-1578587018452-892bacefd3f2'],
  'Jumla Warm Thermal Set': ['photo-1620799140408-edc6dcb6d633', 'photo-1523381210434-271e8be1f52b', 'photo-1576566588028-4147f3842f27', 'photo-1516826957135-700dedea698c'],
  'Lucknowi Chikankari Kurta': ['photo-1617627143750-d86bc21e42bb', 'photo-1583391733956-3750e0ff4e8b', 'photo-1529139574466-a303027c1d8b', 'photo-1581044777550-4cfa60707c03'],
  'Thamel Pleated Midi Skirt': ['photo-1594633312681-425c7b97ccd1', 'photo-1509631179647-0177331693ae', 'photo-1496747611176-843222e1e57c', 'photo-1515886657613-9f3515b0c78f'],
  'Lakeside Wide-Leg Palazzo Pants': ['photo-1506629082955-511b1aa562c8', 'photo-1515886657613-9f3515b0c78f', 'photo-1581044777550-4cfa60707c03', 'photo-1541099649105-f69ad21f3246'],
  'Bouddha High-Waist Denim Skirt': ['photo-1594633312681-425c7b97ccd1', 'photo-1591195853828-11db59a44f6b', 'photo-1542272604-787c3835535d', 'photo-1541099649105-f69ad21f3246'],
  'Kids School Uniform Set': ['photo-1509062522246-3755977927d7', 'photo-1588072432836-e10032774350', 'photo-1607453998774-d533f65dac99'],
  'Baby Girl Party Frock': ['photo-1526634332515-d56c5fd16991', 'photo-1476234251651-f353703a034d', 'photo-1604467794349-0b74285de7e7', 'photo-1622290291468-a28f7a7dc6a8'],
  'Newborn Bhoto Suruwal Set': ['photo-1522771930-78848d9293e8', 'photo-1622290291468-a28f7a7dc6a8', 'photo-1604467794349-0b74285de7e7', 'photo-1526634332515-d56c5fd16991'],
  'Kids Padded Winter Jacket': ['photo-1514090458221-65bb69cf63e6', 'photo-1503919545889-aef636e10ad4', 'photo-1607453998774-d533f65dac99'],
  'Kids Cotton Shorts Set': ['photo-1596870230751-ebdfce98ec42', 'photo-1471286174890-9c112ffca5b4', 'photo-1591195853828-11db59a44f6b', 'photo-1476234251651-f353703a034d'],
  'Bhaktapur Boys Festive Kurta Set': ['photo-1519238263530-99bdd11df2ea', 'photo-1542810634-71277d95dcbb', 'photo-1471286174890-9c112ffca5b4'],
  'Kirtipur Kids Denim Overalls': ['photo-1555009393-f20bdb245c4d', 'photo-1514090458221-65bb69cf63e6', 'photo-1542272604-787c3835535d', 'photo-1541099649105-f69ad21f3246'],
  'Lakeside Girls Tulle Party Dress': ['photo-1476234251651-f353703a034d', 'photo-1520006403909-838d6b92c22e', 'photo-1542810634-71277d95dcbb', 'photo-1607453998774-d533f65dac99'],
  'Chitwan Kids Fleece Tracksuit': ['photo-1596870230751-ebdfce98ec42', 'photo-1607453998774-d533f65dac99', 'photo-1556821840-3a63f95609a7', 'photo-1523381210434-271e8be1f52b'],
  'Mustang Kids Hooded Rain Jacket': ['photo-1503919545889-aef636e10ad4', 'photo-1476234251651-f353703a034d', 'photo-1607453998774-d533f65dac99'],
  'Kids Cotton T-Shirt Pack of 3': ['photo-1523381210434-271e8be1f52b', 'photo-1620799140408-edc6dcb6d633', 'photo-1607453998774-d533f65dac99', 'photo-1519238263530-99bdd11df2ea'],
  'Junior Cargo Shorts': ['photo-1591195853828-11db59a44f6b', 'photo-1471286174890-9c112ffca5b4', 'photo-1541099649105-f69ad21f3246', 'photo-1542272604-787c3835535d'],
  'Kids Fleece Hoodie': ['photo-1556821840-3a63f95609a7', 'photo-1620799140408-edc6dcb6d633', 'photo-1516826957135-700dedea698c'],
  'Little Princess Lehenga Choli': ['photo-1476234251651-f353703a034d', 'photo-1542810634-71277d95dcbb', 'photo-1520006403909-838d6b92c22e'],
  'Boys Festive Vest Set': ['photo-1519238263530-99bdd11df2ea', 'photo-1542810634-71277d95dcbb', 'photo-1471286174890-9c112ffca5b4', 'photo-1607453998774-d533f65dac99'],
  'Kids School Sweater Vest': ['photo-1522771930-78848d9293e8', 'photo-1471286174890-9c112ffca5b4', 'photo-1519238263530-99bdd11df2ea', 'photo-1576871337622-98d48d1cf531'],
  'Doko Kids Stretch Denim Jeans': ['photo-1542272604-787c3835535d', 'photo-1541099649105-f69ad21f3246', 'photo-1555009393-f20bdb245c4d', 'photo-1471286174890-9c112ffca5b4'],
  'Little Pashmina Salwar Set': ['photo-1542810634-71277d95dcbb', 'photo-1476234251651-f353703a034d', 'photo-1520006403909-838d6b92c22e'],
  'Kids Fleece Pajama Set': ['photo-1596870230751-ebdfce98ec42', 'photo-1476234251651-f353703a034d', 'photo-1519238263530-99bdd11df2ea', 'photo-1522771930-78848d9293e8'],
  'Pokhara Girls Pleated Skirt': ['photo-1594633312681-425c7b97ccd1', 'photo-1476234251651-f353703a034d', 'photo-1520006403909-838d6b92c22e', 'photo-1607453998774-d533f65dac99'],
};

let changed = 0;
for (const [name, ids] of Object.entries(FIX)) {
  const re = new RegExp(`(\\{ name: '${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[\\s\\S]*?photos: )\\[[^\\]]*\\]`);
  const arr = '[' + ids.map((i) => `'${i}'`).join(', ') + ']';
  const next = src.replace(re, `$1${arr}`);
  if (next !== src) { src = next; changed++; }
  else console.log('MISS:', name);
}
fs.writeFileSync(FILE, src);
console.log('UPDATED:', changed, '/', Object.keys(FIX).length);
