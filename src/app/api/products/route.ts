import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const cuisineId  = searchParams.get('cuisineId');

    const filter: any = { isActive: true };
    if (categoryId) filter.categoryId = categoryId;
    if (cuisineId)  filter.cuisineId  = cuisineId;

    const products = await prisma.product.findMany({
      where: filter,
      include: { category: true, cuisine: true },
      orderBy: { name: 'asc' },
    });

    console.log("Products found:", products.length);
    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, price, description, categoryId, cuisineId, image } = await req.json();

    if (!name || price === undefined || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        description,
        categoryId,
        cuisineId: cuisineId || null,
        image,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
