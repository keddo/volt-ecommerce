import { z } from "zod";

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  status: "ACTIVE" | "INACTIVE";
  productCount: number;
}

export const categoryInputSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;
