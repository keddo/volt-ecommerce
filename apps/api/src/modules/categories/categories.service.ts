import type { CategoryDTO, CategoryInput } from "@personal-ecommerce/shared";
import { prisma } from "../../lib/prisma";
import { storage, type UploadedFile } from "../../lib/storage";
import { uniqueSlug } from "../../lib/slugify";
import { HttpError } from "../../middleware/errorHandler";

function toDTO(category: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  status: string;
  _count: { products: number };
}): CategoryDTO {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    status: category.status as "ACTIVE" | "INACTIVE",
    productCount: category._count.products,
  };
}

export async function listCategories(): Promise<CategoryDTO[]> {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  return categories.map(toDTO);
}

export async function createCategory(input: CategoryInput, file?: UploadedFile): Promise<CategoryDTO> {
  const slug = await uniqueSlug(input.name, async (candidate) => {
    const existing = await prisma.category.findUnique({ where: { slug: candidate } });
    return existing !== null;
  });

  const uploaded = file ? await storage.save(file) : null;

  const category = await prisma.category.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      status: input.status,
      image: uploaded?.url,
    },
    include: { _count: { select: { products: true } } },
  });

  return toDTO(category);
}

export async function updateCategory(id: string, input: CategoryInput, file?: UploadedFile): Promise<CategoryDTO> {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Category not found");

  let slug = existing.slug;
  if (input.name !== existing.name) {
    slug = await uniqueSlug(input.name, async (candidate) => {
      if (candidate === existing.slug) return false;
      const other = await prisma.category.findUnique({ where: { slug: candidate } });
      return other !== null;
    });
  }

  let imageUrl = existing.image;
  if (file) {
    const uploaded = await storage.save(file);
    if (existing.image) await storage.delete(existing.image.replace("/uploads/", ""));
    imageUrl = uploaded.url;
  }

  const category = await prisma.category.update({
    where: { id },
    data: { name: input.name, slug, description: input.description, status: input.status, image: imageUrl },
    include: { _count: { select: { products: true } } },
  });

  return toDTO(category);
}

export async function deleteCategory(id: string): Promise<void> {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!category) throw new HttpError(404, "Category not found");

  if (category._count.products > 0) {
    throw new HttpError(409, `This category still has ${category._count.products} product(s) assigned to it`);
  }

  await prisma.category.delete({ where: { id } });
  if (category.image) await storage.delete(category.image.replace("/uploads/", ""));
}
