const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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

  // Create products (skip if already exist)
  const existingProducts = await prisma.product.findMany();
  let burgerProduct = existingProducts.find(p => p.name === 'Club Sandwich');

  if (existingProducts.length === 0) {
    for (const prod of productsData) {
      const cat = createdCategories.find(c => c.name === prod.catName);
      if (cat) {
        const created = await prisma.product.create({
          data: {
            name: prod.name,
            price: prod.price,
            description: prod.desc,
            kdsEnabled: prod.kdsEnabled ?? true,
            isActive: true,
            categoryId: cat.id,
          },
        });
        if (prod.name === 'Club Sandwich') burgerProduct = created;
      }
    }
    console.log('Products seeded!');
  } else {
    console.log('Products already exist, skipping.');
    // Make sure isActive is set
    await prisma.product.updateMany({ data: { isActive: true } });
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
