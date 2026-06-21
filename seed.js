const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDF0iQlKp1YRClC7GfsSfCw7FL2hcEpJc4",
  authDomain: "lucy-garden.firebaseapp.com",
  projectId: "lucy-garden",
  storageBucket: "lucy-garden.firebasestorage.app",
  messagingSenderId: "828869866166",
  appId: "1:828869866166:web:739979546e5e553e362c17",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log('🌱 Seeding Firestore...\n');

  // 1. ADMIN USER
  console.log('👑 Adding Admin...');
  await setDoc(doc(db, 'users', '9470248156'), {
    name: 'Lal Babu Gupta',
    phone: '9470248156',
    pin: '1234',
    role: 'admin',
    shop: 'Lucy Garden',
    id: 'LG-ADM-001',
    area: 'Madhubani',
    address: 'Thana Mor, Near Payas Hotel, Madhubani, Bihar - 847211',
    createdAt: new Date().toISOString(),
  });
  console.log('   ✅ Admin: 9470248156 / 1234\n');

  // 2. RETAILERS
  console.log('👤 Adding Retailers...');
  const retailers = [
    { phone: '9876543210', name: 'Ramesh Kumar', shop: 'Ramesh Dairy Store', area: 'Madhubani', address: 'Main Bazaar, Madhubani', id: 'LG-RET-001' },
    { phone: '9876543211', name: 'Suresh Yadav', shop: 'Suresh Milk Centre', area: 'Jainagar', address: 'Near Bus Stand, Jainagar', id: 'LG-RET-002' },
    { phone: '9876543212', name: 'Mohan Lal', shop: 'Mohan Dairy', area: 'Rajnagar', address: 'Station Road, Rajnagar', id: 'LG-RET-003' },
    { phone: '9876543213', name: 'Priya Devi', shop: 'Priya Milk House', area: 'Madhubani', address: 'Thana Mor, Madhubani', id: 'LG-RET-004' },
    { phone: '9876543214', name: 'Anita Kumari', shop: 'Anita Dairy', area: 'Benipatti', address: 'Main Chowk, Benipatti', id: 'LG-RET-005' },
    { phone: '9876543215', name: 'Rajesh Singh', shop: 'Singh Dairy Farm', area: 'Jhanjharpur', address: 'Bazaar Road, Jhanjharpur', id: 'LG-RET-006' },
    { phone: '9876543216', name: 'Sunita Devi', shop: 'Sunita Milk Point', area: 'Madhubani', address: 'Near Post Office, Madhubani', id: 'LG-RET-007' },
    { phone: '9876543217', name: 'Vijay Sharma', shop: 'Vijay Dairy Corner', area: 'Pandaul', address: 'Main Road, Pandaul', id: 'LG-RET-008' },
  ];

  for (const r of retailers) {
    await setDoc(doc(db, 'users', r.phone), {
      ...r,
      pin: '1234',
      role: 'retailer',
      createdAt: new Date().toISOString(),
    });
    console.log(`   ✅ ${r.name} (${r.phone})`);
  }
  console.log('');

  // 3. PRODUCTS
  console.log('🏪 Adding Products...');
  const products = [
    { name: 'Full Cream Milk', price: 60, unit: 'litre', stock: 200, category: 'Milk', icon: '🥛' },
    { name: 'Toned Milk', price: 48, unit: 'litre', stock: 150, category: 'Milk', icon: '🥛' },
    { name: 'Skimmed Milk', price: 42, unit: 'litre', stock: 80, category: 'Milk', icon: '🥛' },
    { name: 'Fresh Paneer', price: 320, unit: 'kg', stock: 25, category: 'Dairy', icon: '🧀' },
    { name: 'Dahi (Curd)', price: 50, unit: 'kg', stock: 60, category: 'Dairy', icon: '🥣' },
    { name: 'Amul Butter', price: 520, unit: 'kg', stock: 12, category: 'Dairy', icon: '🧈' },
    { name: 'Desi Ghee', price: 650, unit: 'kg', stock: 18, category: 'Ghee', icon: '✨' },
    { name: 'Fresh Cream', price: 280, unit: 'kg', stock: 8, category: 'Dairy', icon: '🍦' },
    { name: 'Sweet Lassi', price: 25, unit: 'glass', stock: 100, category: 'Beverages', icon: '🥤' },
    { name: 'Chaach', price: 15, unit: 'glass', stock: 120, category: 'Beverages', icon: '🥤' },
    { name: 'Khoya (Mawa)', price: 400, unit: 'kg', stock: 5, category: 'Dairy', icon: '🍮' },
    { name: 'Flavoured Milk', price: 30, unit: 'bottle', stock: 50, category: 'Beverages', icon: '🍼' },
  ];

  for (const p of products) {
    await addDoc(collection(db, 'products'), {
      ...p,
      createdAt: new Date().toISOString(),
    });
    console.log(`   ✅ ${p.name} — ₹${p.price}/${p.unit}`);
  }
  console.log('');

  // 4. SETTINGS
  console.log('⚙️ Adding Settings...');
  await setDoc(doc(db, 'settings', 'app'), {
    milkRate: 60,
    morningSlot: '5:30 AM - 7:00 AM',
    eveningSlot: '5:00 PM - 6:30 PM',
    autoConfirmOrders: false,
    lowStockThreshold: 15,
    ownerPhone: '9470248156',
    ownerName: 'Lal Babu Gupta',
    businessName: 'Lucy Garden',
    address: 'Thana Mor, Near Payas Hotel, Madhubani, Bihar - 847211',
    email: 'contact.lucygarden@gmail.com',
    updatedAt: new Date().toISOString(),
  });
  console.log('   ✅ App settings saved\n');

  // 5. SAMPLE LEDGER ENTRIES (for demo)
  console.log('📒 Adding Sample Ledger Entries...');
  const ledgerEntries = [
    { retailerId: 'LG-RET-001', retailer: 'Ramesh Kumar', amount: 3060, type: 'debit', note: 'Order — 20L Milk + 3kg Paneer + 5kg Dahi + 1kg Ghee', date: '13 May 2025' },
    { retailerId: 'LG-RET-001', retailer: 'Ramesh Kumar', amount: -2000, type: 'credit', note: 'UPI Payment (PhonePe)', date: '12 May 2025' },
    { retailerId: 'LG-RET-002', retailer: 'Suresh Yadav', amount: 1560, type: 'debit', note: 'Order — 15L Milk + 2kg Paneer', date: '13 May 2025' },
    { retailerId: 'LG-RET-004', retailer: 'Priya Devi', amount: 2200, type: 'debit', note: 'Order — 25L Milk + 2kg Dahi', date: '13 May 2025' },
    { retailerId: 'LG-RET-004', retailer: 'Priya Devi', amount: -1000, type: 'credit', note: 'Cash Payment', date: '11 May 2025' },
    { retailerId: 'LG-RET-006', retailer: 'Rajesh Singh', amount: 1800, type: 'debit', note: 'Order — 20L Milk + 2kg Paneer', date: '12 May 2025' },
    { retailerId: 'LG-RET-008', retailer: 'Vijay Sharma', amount: 2500, type: 'debit', note: 'Order — 30L Milk + 1kg Ghee', date: '13 May 2025' },
    { retailerId: 'LG-RET-008', retailer: 'Vijay Sharma', amount: -2500, type: 'credit', note: 'Bank Transfer (NEFT)', date: '13 May 2025' },
  ];

  for (const entry of ledgerEntries) {
    await addDoc(collection(db, 'ledger'), {
      ...entry,
      createdAt: new Date().toISOString(),
    });
  }
  console.log('   ✅ 8 ledger entries added\n');

  // 6. RETAILER BALANCES (quick lookup)
  console.log('💰 Setting Retailer Balances...');
  const balances = [
    { id: 'LG-RET-001', balance: 1060, lastPaymentDate: '12 May 2025', lastPaymentAmount: 2000 },
    { id: 'LG-RET-002', balance: 1560, lastPaymentDate: null, lastPaymentAmount: 0 },
    { id: 'LG-RET-003', balance: 0, lastPaymentDate: '10 May 2025', lastPaymentAmount: 3000 },
    { id: 'LG-RET-004', balance: 1200, lastPaymentDate: '11 May 2025', lastPaymentAmount: 1000 },
    { id: 'LG-RET-005', balance: 0, lastPaymentDate: null, lastPaymentAmount: 0 },
    { id: 'LG-RET-006', balance: 1800, lastPaymentDate: '8 May 2025', lastPaymentAmount: 1500 },
    { id: 'LG-RET-007', balance: 0, lastPaymentDate: '13 May 2025', lastPaymentAmount: 2200 },
    { id: 'LG-RET-008', balance: 0, lastPaymentDate: '13 May 2025', lastPaymentAmount: 2500 },
  ];

  for (const b of balances) {
    await setDoc(doc(db, 'retailer_balances', b.id), {
      balance: b.balance,
      lastPaymentDate: b.lastPaymentDate,
      lastPaymentAmount: b.lastPaymentAmount,
      updatedAt: new Date().toISOString(),
    });
  }
  console.log('   ✅ All balances set\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 SEED COMPLETE!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📌 Login Credentials:');
  console.log('   Admin:    9470248156 / 1234');
  console.log('   Retailer: 9876543210 / 1234');
  console.log('   (All retailers PIN: 1234)\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
