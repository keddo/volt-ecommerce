import { Prisma } from "@prisma/client";
import type { ProductDetail, ProductInput, ProductListItem } from "@personal-ecommerce/shared";
import { prisma } from "../../lib/prisma";
import { storage, type UploadedFile } from "../../lib/storage";
import { slugify, uniqueSlug } from "../../lib/slugify";
import { HttpError } from "../../middleware/errorHandler";

export interface ListParams {
  search?: string;
  category?: string;
  status?: "published" | "unpublished" | "all";
  stock?: "in" | "low" | "out" | "all";
  page: number;
  pageSize: number;
  sortField: "name" | "price" | "stock" | "createdAt";
  sortDir: "asc" | "desc";
}

function toNumber(value: Prisma.Decimal | null | undefined): number | null {
  return value === null || value === undefined ? null : Number(value);
}

export function toListItem(product: {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  category: { name: string };
  images: { url: string }[];
  price: Prisma.Decimal;
  discountPrice: Prisma.Decimal | null;
  stock: number;
  minStock: number;
  published: boolean;
  featured: boolean;
  createdAt: Date;
}): ProductListItem {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    image: product.images[0]?.url ?? null,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    price: Number(product.price),
    discountPrice: toNumber(product.discountPrice),
    stock: product.stock,
    minStock: product.minStock,
    published: product.published,
    featured: product.featured,
    createdAt: product.createdAt.toISOString(),
  };
}

function isForeignKeyRestrictError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") return true;
  // Postgres raises a RESTRICT violation (23001) as a raw driver error that Prisma surfaces
  // as PrismaClientUnknownRequestError, not the P2003 known-error code - check the message too.
  return err instanceof Error && /foreign key constraint|violates.*RESTRICT/i.test(err.message);
}

async function getLowStockIds(): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Product" WHERE stock <= "minStock"
  `;
  return rows.map((r) => r.id);
}

export async function listProducts(params: ListParams) {
  const where: Prisma.ProductWhereInput = {};

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { sku: { contains: params.search, mode: "insensitive" } },
      { brand: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params.category) where.categoryId = params.category;
  if (params.status === "published") where.published = true;
  if (params.status === "unpublished") where.published = false;

  if (params.stock === "out") {
    where.stock = 0;
  } else if (params.stock === "low") {
    const lowIds = await getLowStockIds();
    where.id = { in: lowIds };
    where.stock = { gt: 0 };
  } else if (params.stock === "in") {
    const lowIds = await getLowStockIds();
    where.id = { notIn: lowIds };
  }

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      orderBy: { [params.sortField]: params.sortDir },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return { items: rows.map(toListItem), total, page: params.page, pageSize: params.pageSize };
}

export const DETAIL_INCLUDE = {
  category: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  specifications: true,
  tags: { include: { tag: true } },
};

export function toDetail(product: Prisma.ProductGetPayload<{ include: typeof DETAIL_INCLUDE }>): ProductDetail {
  return {
    ...toListItem(product),
    description: product.description,
    brand: product.brand,
    seoTitle: product.seoTitle,
    metaDescription: product.metaDescription,
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      sortOrder: img.sortOrder,
    })),
    specifications: product.specifications.map((s) => ({ id: s.id, key: s.key, value: s.value })),
    tags: product.tags.map((t) => t.tag.name),
  };
}

export async function getProductById(id: string): Promise<ProductDetail> {
  const product = await prisma.product.findUnique({ where: { id }, include: DETAIL_INCLUDE });
  if (!product) throw new HttpError(404, "Product not found");
  return toDetail(product);
}

function parseSpecifications(raw: string | undefined): { key: string; value: string }[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s) => s && typeof s.key === "string" && typeof s.value === "string")
      .map((s) => ({ key: s.key, value: s.value }));
  } catch {
    throw new HttpError(400, "Invalid specifications format");
  }
}

function parseTags(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t): t is string => typeof t === "string" && t.trim().length > 0);
  } catch {
    throw new HttpError(400, "Invalid tags format");
  }
}

async function assertCategoryExists(categoryId: string) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) throw new HttpError(400, "Category does not exist");
}

async function connectTags(productId: string, tagNames: string[]) {
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
    await prisma.productTag.create({ data: { productId, tagId: tag.id } }).catch(() => {
      // already linked - ignore
    });
  }
}

export async function createProduct(input: ProductInput, files: UploadedFile[]): Promise<ProductDetail> {
  await assertCategoryExists(input.categoryId);
  const specifications = parseSpecifications(input.specifications);
  const tags = parseTags(input.tags);
  const slug = await uniqueSlug(input.name, async (candidate) => {
    const existing = await prisma.product.findUnique({ where: { slug: candidate } });
    return existing !== null;
  });

  const existingSku = await prisma.product.findUnique({ where: { sku: input.sku } });
  if (existingSku) throw new HttpError(409, "SKU is already in use");

  const uploaded = await Promise.all(files.map((f) => storage.save(f)));

  const product = await prisma.product.create({
    data: {
      name: input.name,
      slug,
      sku: input.sku,
      categoryId: input.categoryId,
      brand: input.brand,
      description: input.description,
      price: input.price,
      discountPrice: input.discountPrice ?? null,
      stock: input.stock,
      minStock: input.minStock,
      featured: input.featured,
      published: input.published,
      seoTitle: input.seoTitle,
      metaDescription: input.metaDescription,
      images: { create: uploaded.map((u, i) => ({ url: u.url, sortOrder: i })) },
      specifications: { create: specifications },
    },
    include: DETAIL_INCLUDE,
  });

  if (tags.length > 0) await connectTags(product.id, tags);

  return getProductById(product.id);
}

export async function updateProduct(id: string, input: ProductInput): Promise<ProductDetail> {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Product not found");

  await assertCategoryExists(input.categoryId);

  if (input.sku !== existing.sku) {
    const skuTaken = await prisma.product.findUnique({ where: { sku: input.sku } });
    if (skuTaken) throw new HttpError(409, "SKU is already in use");
  }

  let slug = existing.slug;
  if (input.name !== existing.name) {
    slug = await uniqueSlug(input.name, async (candidate) => {
      if (candidate === existing.slug) return false;
      const other = await prisma.product.findUnique({ where: { slug: candidate } });
      return other !== null;
    });
  }

  const specifications = parseSpecifications(input.specifications);
  const tags = parseTags(input.tags);

  await prisma.$transaction([
    prisma.productSpecification.deleteMany({ where: { productId: id } }),
    prisma.productTag.deleteMany({ where: { productId: id } }),
  ]);

  await prisma.product.update({
    where: { id },
    data: {
      name: input.name,
      slug,
      sku: input.sku,
      categoryId: input.categoryId,
      brand: input.brand,
      description: input.description,
      price: input.price,
      discountPrice: input.discountPrice ?? null,
      stock: input.stock,
      minStock: input.minStock,
      featured: input.featured,
      published: input.published,
      seoTitle: input.seoTitle,
      metaDescription: input.metaDescription,
      specifications: { create: specifications },
    },
  });

  if (tags.length > 0) await connectTags(id, tags);

  return getProductById(id);
}

export async function deleteProduct(id: string): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id }, include: { images: true } });
  if (!product) throw new HttpError(404, "Product not found");

  try {
    await prisma.product.delete({ where: { id } });
  } catch (err) {
    if (isForeignKeyRestrictError(err)) {
      throw new HttpError(409, "This product is referenced by existing orders and can't be deleted");
    }
    throw err;
  }

  await Promise.all(product.images.map((img) => storage.delete(img.url.replace("/uploads/", ""))));
}

export async function duplicateProduct(id: string): Promise<ProductDetail> {
  const source = await prisma.product.findUnique({ where: { id }, include: DETAIL_INCLUDE });
  if (!source) throw new HttpError(404, "Product not found");

  const slug = await uniqueSlug(`${source.name}-copy`, async (candidate) => {
    const other = await prisma.product.findUnique({ where: { slug: candidate } });
    return other !== null;
  });

  let sku = `${source.sku}-COPY`;
  let suffix = 2;
  while (await prisma.product.findUnique({ where: { sku } })) {
    sku = `${source.sku}-COPY-${suffix}`;
    suffix += 1;
  }

  const copy = await prisma.product.create({
    data: {
      name: `${source.name} (Copy)`,
      slug,
      sku,
      categoryId: source.categoryId,
      brand: source.brand,
      description: source.description,
      price: source.price,
      discountPrice: source.discountPrice,
      stock: source.stock,
      minStock: source.minStock,
      featured: false,
      published: false,
      seoTitle: source.seoTitle,
      metaDescription: source.metaDescription,
      images: { create: source.images.map((img) => ({ url: img.url, altText: img.altText, sortOrder: img.sortOrder })) },
      specifications: { create: source.specifications.map((s) => ({ key: s.key, value: s.value })) },
    },
  });

  if (source.tags.length > 0) await connectTags(copy.id, source.tags.map((t) => t.tag.name));

  return getProductById(copy.id);
}

export async function setPublished(id: string, published: boolean): Promise<ProductDetail> {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Product not found");
  await prisma.product.update({ where: { id }, data: { published } });
  return getProductById(id);
}

export async function addImages(id: string, files: UploadedFile[]): Promise<ProductDetail> {
  const existing = await prisma.product.findUnique({ where: { id }, include: { images: true } });
  if (!existing) throw new HttpError(404, "Product not found");

  const uploaded = await Promise.all(files.map((f) => storage.save(f)));
  const startOrder = existing.images.length;
  await prisma.productImage.createMany({
    data: uploaded.map((u, i) => ({ productId: id, url: u.url, sortOrder: startOrder + i })),
  });

  return getProductById(id);
}

export async function removeImage(id: string, imageId: string): Promise<ProductDetail> {
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image || image.productId !== id) throw new HttpError(404, "Image not found");

  await prisma.productImage.delete({ where: { id: imageId } });
  await storage.delete(image.url.replace("/uploads/", ""));

  return getProductById(id);
}

export async function bulkAction(ids: string[], action: "publish" | "unpublish" | "delete"): Promise<void> {
  if (action === "publish") {
    await prisma.product.updateMany({ where: { id: { in: ids } }, data: { published: true } });
    return;
  }
  if (action === "unpublish") {
    await prisma.product.updateMany({ where: { id: { in: ids } }, data: { published: false } });
    return;
  }

  const products = await prisma.product.findMany({ where: { id: { in: ids } }, include: { images: true } });
  try {
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
  } catch (err) {
    if (isForeignKeyRestrictError(err)) {
      throw new HttpError(409, "One or more products are referenced by existing orders and can't be deleted");
    }
    throw err;
  }
  await Promise.all(
    products.flatMap((p) => p.images.map((img) => storage.delete(img.url.replace("/uploads/", ""))))
  );
}
