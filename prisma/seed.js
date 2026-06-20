const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const productsData = [
  // Coffee
  { name: 'Espresso',          price: 80,  catName: 'Coffee',      cuisineName: 'Italian',     desc: 'Strong single-shot espresso',            kdsEnabled: true },
  { name: 'Cappuccino',        price: 120, catName: 'Coffee',      cuisineName: 'Italian',     desc: 'Espresso with steamed milk foam',        kdsEnabled: true },
  { name: 'Latte',             price: 130, catName: 'Coffee',      cuisineName: 'Italian',     desc: 'Smooth espresso with lots of milk',      kdsEnabled: true },
  { name: 'Americano',         price: 100, catName: 'Coffee',      cuisineName: 'Italian',     desc: 'Espresso diluted with hot water',        kdsEnabled: true },
  { name: 'Cold Brew',         price: 150, catName: 'Coffee',      cuisineName: 'Continental', desc: 'Slow-steeped cold coffee',               kdsEnabled: true },
  // Tea
  { name: 'Masala Chai',       price: 60,  catName: 'Tea',         cuisineName: 'Indian',      desc: 'Spiced Indian milk tea',                 kdsEnabled: true },
  { name: 'Green Tea',         price: 70,  catName: 'Tea',         cuisineName: 'Indian',      desc: 'Light and refreshing green tea',         kdsEnabled: true },
  { name: 'Lemon Iced Tea',    price: 90,  catName: 'Tea',         cuisineName: 'Continental', desc: 'Chilled tea with lemon',                 kdsEnabled: true },
  { name: 'Chamomile Tea',     price: 80,  catName: 'Tea',         cuisineName: 'Continental', desc: 'Soothing herbal chamomile',              kdsEnabled: false },
  // Bakery
  { name: 'Butter Croissant',  price: 90,  catName: 'Bakery',      cuisineName: 'Continental', desc: 'Flaky, buttery French croissant',        kdsEnabled: true },
  { name: 'Blueberry Muffin',  price: 80,  catName: 'Bakery',      cuisineName: 'Continental', desc: 'Moist muffin bursting with blueberries', kdsEnabled: true },
  { name: 'Banana Bread',      price: 70,  catName: 'Bakery',      cuisineName: 'Continental', desc: 'Homestyle banana loaf slice',            kdsEnabled: true },
  { name: 'Cinnamon Roll',     price: 110, catName: 'Bakery',      cuisineName: 'Indian',      desc: 'Soft roll with cinnamon glaze',          kdsEnabled: true },
  // Main Course
  { name: 'Club Sandwich',     price: 220, catName: 'Main Course', cuisineName: 'Continental', desc: 'Triple-decker with chicken & veggies',   kdsEnabled: true },
  { name: 'Margherita Pizza',  price: 280, catName: 'Main Course', cuisineName: 'Italian',     desc: 'Classic tomato & mozzarella pizza',      kdsEnabled: true },
  { name: 'Pasta Arrabbiata',  price: 240, catName: 'Main Course', cuisineName: 'Italian',     desc: 'Spicy tomato pasta',                     kdsEnabled: true },
  { name: 'Caesar Salad',      price: 180, catName: 'Main Course', cuisineName: 'Continental', desc: 'Romaine, croutons, Caesar dressing',     kdsEnabled: true },
  { name: 'Grilled Paneer',    price: 260, catName: 'Main Course', cuisineName: 'Indian',      desc: 'Marinated paneer with mint chutney',     kdsEnabled: true },
  // Desserts
  { name: 'Chocolate Lava Cake', price: 160, catName: 'Desserts', cuisineName: 'Continental', desc: 'Warm cake with molten chocolate centre',  kdsEnabled: true },
  { name: 'Cheesecake',        price: 150, catName: 'Desserts',    cuisineName: 'Continental', desc: 'Classic New York-style cheesecake',      kdsEnabled: true },
  { name: 'Tiramisu',          price: 170, catName: 'Desserts',    cuisineName: 'Italian',     desc: 'Italian coffee-flavoured dessert',       kdsEnabled: true },
  { name: 'Brownie',           price: 100, catName: 'Desserts',    cuisineName: 'Indian',      desc: 'Fudgy chocolate brownie with nuts',      kdsEnabled: true },
];

async function main() {
  console.log('Seeding database...');

  // Create default admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@cafe.com' },
    update: {},
    create: {
      email: 'admin@cafe.com',
      password: 'admin123',
      name: 'Cafe Admin',
      role: 'ADMIN',
    },
  });
  console.log('Admin user seeded:', adminUser.email);

  const cashierUser = await prisma.user.upsert({
    where: { email: 'cashier@cafe.com' },
    update: {},
    create: {
      email: 'cashier@cafe.com',
      password: 'cashier123',
      name: 'Demo Cashier',
      role: 'CASHIER',
    },
  });
  console.log('Cashier user seeded:', cashierUser.email);

  const kitchenUser = await prisma.user.upsert({
    where: { email: 'kitchen@cafe.com' },
    update: {},
    create: {
      email: 'kitchen@cafe.com',
      password: 'kitchen123',
      name: 'Kitchen Staff',
      role: 'KITCHEN',
    },
  });
  console.log('Kitchen user seeded:', kitchenUser.email);


  // Create categories
  const categories = ['Coffee', 'Tea', 'Bakery', 'Main Course', 'Desserts'];
  const createdCategories = [];

  for (const catName of categories) {
    const cat = await prisma.category.upsert({
      where: { name: catName },
      update: {},
      create: { name: catName },
    });
    createdCategories.push(cat);
  }
  console.log('Categories seeded:', createdCategories.map(c => c.name));

  // Upsert cuisines
  const cuisineNames = ['Italian', 'Indian', 'Continental'];
  const createdCuisines = [];
  for (const cname of cuisineNames) {
    const c = await prisma.cuisine.upsert({
      where: { name: cname },
      update: {},
      create: { name: cname },
    });
    createdCuisines.push(c);
  }
  console.log('Cuisines seeded:', createdCuisines.map(c => c.name));

  // Products — skip if already populated (e.g. loaded from MySQL Workbench SQL)
  const productCount = await prisma.product.count();
  let burgerProduct = null;

  if (productCount === 0) {
    // Fresh DB — seed from productsData array
    for (const prod of productsData) {
      const cat = createdCategories.find(c => c.name === prod.catName);
      const cuisine = createdCuisines.find(c => c.name === prod.cuisineName);
      if (cat) {
        const created = await prisma.product.create({
          data: {
            name: prod.name,
            price: prod.price,
            description: prod.desc,
            kdsEnabled: prod.kdsEnabled ?? true,
            isActive: true,
            categoryId: cat.id,
            cuisineId: cuisine?.id ?? null,
          },
        });
        if (prod.name === 'Club Sandwich') burgerProduct = created;
      }
    }
    console.log('Products seeded from productsData!');
  } else {
    console.log(`Products already exist (${productCount} rows) — skipping product seed.`);
    // Try to find Club Sandwich for variants/addons demo
    burgerProduct = await prisma.product.findFirst({ where: { name: 'Club Sandwich' } });
  }

  // Add variants + addons to Burger/Sandwich product (demo for self-order)
  if (burgerProduct) {
    const existingVariants = await prisma.productVariant.findMany({ where: { productId: burgerProduct.id } });
    if (existingVariants.length === 0) {
      await prisma.productVariant.createMany({
        data: [
          { productId: burgerProduct.id, name: 'Chicken Burger', priceDelta: 0 },
          { productId: burgerProduct.id, name: 'Veg Burger', priceDelta: -1.5 },
        ],
      });
      await prisma.productAddon.createMany({
        data: [
          { productId: burgerProduct.id, name: 'Extra Cheese', priceDelta: 0.5 },
          { productId: burgerProduct.id, name: 'Extra Sauce', priceDelta: 0.25 },
          { productId: burgerProduct.id, name: 'Wheat Bun', priceDelta: 0 },
        ],
      });
      console.log('Variants and addons seeded for:', burgerProduct.name);
    }
  }

  // Create floors and tables
  const floor1 = await prisma.floor.upsert({
    where: { name: 'Ground Floor' },
    update: {},
    create: { name: 'Ground Floor' },
  });

  const existingTables = await prisma.table.findMany({ where: { floorId: floor1.id } });
  if (existingTables.length === 0) {
    const tableNames = ['Table 1', 'Table 2', 'Table 3', 'Table 4'];
    for (const name of tableNames) {
      await prisma.table.create({
        data: { name, floorId: floor1.id, token: Math.random().toString(36).substring(2, 10) },
      });
    }
    console.log('Floor and Tables seeded!');
  } else {
    console.log('Tables already exist, skipping.');
  }

  // Create default Coupon
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      discount: 10.0,
      type: 'PERCENTAGE',
      expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });
  console.log('Coupon code seeded!');

  // Create demo promotions for self-order coupon modal
  const existingPromos = await prisma.promotion.findMany();
  if (existingPromos.length === 0) {
    await prisma.promotion.createMany({
      data: [
        { name: '30% Discount', description: 'Orders above ₹500', discount: 30, type: 'PERCENTAGE', scope: 'ORDER', minOrderAmount: 500, isActive: true },
        { name: '50% Discount', description: 'Happy Hour special', discount: 50, type: 'PERCENTAGE', scope: 'ORDER', minOrderAmount: 0, isActive: true },
      ],
    });
    console.log('Promotions seeded!');
  }

  // Seed SelfOrderingConfig
  const existingConfig = await prisma.selfOrderingConfig.findFirst();
  if (!existingConfig) {
    await prisma.selfOrderingConfig.create({
      data: { brandName: 'Cafe Gourmet', brandColor: '#b45309', isEnabled: true, welcomeMessage: 'Welcome! Order directly from your table.' },
    });
    console.log('SelfOrderingConfig seeded!');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
