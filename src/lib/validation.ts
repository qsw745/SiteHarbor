import { z } from "zod";

const httpUrl = z
  .string()
  .trim()
  .url("请输入有效 URL")
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "URL 必须以 http:// 或 https:// 开头");

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
  }, "图标 URL 必须是有效的 http(s) 地址");

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug 不能为空")
  .max(80, "Slug 最长 80 个字符")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug 只能包含小写字母、数字和短横线");

export const siteFormSchema = z.object({
  name: z.string().trim().min(1, "站点名称不能为空").max(80),
  slug: slugSchema,
  url: httpUrl,
  description: z
    .string()
    .trim()
    .max(240, "描述最长 240 个字符")
    .optional()
    .transform((value) => value || null),
  iconUrl: optionalHttpUrl,
  active: z.enum(["true", "false"]).transform((value) => value === "true"),
  sortOrder: z.coerce.number().int().min(0).max(99999),
  categoryId: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null),
});

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "分类名称不能为空").max(60),
  slug: slugSchema,
  sortOrder: z.coerce.number().int().min(0).max(99999),
});

export function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function firstZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "表单内容无效";
}
