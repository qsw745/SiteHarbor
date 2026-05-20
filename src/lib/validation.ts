import { z } from "zod";

const httpUrl = z
  .string()
  .trim()
  .url("err-url-invalid")
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "err-url-protocol");

const optionalHttpUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || null)
  .refine((value) => {
    if (!value) return true;
    const parsed = z.string().url().safeParse(value);
    if (!parsed.success) return false;
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "err-icon-url-invalid");

export const slugSchema = z
  .string()
  .trim()
  .min(1, "err-slug-required")
  .max(80, "err-slug-too-long")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "err-slug-format");

export const siteFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "err-name-required")
    .max(80, "err-name-too-long"),
  slug: slugSchema,
  url: httpUrl,
  description: z
    .string()
    .trim()
    .max(240, "err-desc-too-long")
    .optional()
    .transform((value) => value || null),
  iconUrl: optionalHttpUrl,
  active: z.enum(["true", "false"]).transform((value) => value === "true"),
  sortOrder: z.coerce.number().int().min(0, "err-sort-order-range").max(99999, "err-sort-order-range"),
  categoryId: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null),
});

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "err-category-name-required")
    .max(60, "err-category-name-too-long"),
  slug: slugSchema,
  sortOrder: z.coerce.number().int().min(0, "err-sort-order-range").max(99999, "err-sort-order-range"),
});

export function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function firstZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "err-form-invalid";
}
