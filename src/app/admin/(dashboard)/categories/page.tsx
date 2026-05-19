import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "./actions";
import { messageFromParams } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { Plus, Save, Tags, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

const okMessages: Record<string, string> = {
  "category-created": "分类已添加。",
  "category-updated": "分类已保存。",
  "category-deleted": "分类已删除，原站点会变为未分类。",
};

type CategoriesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const params = await searchParams;
  const { error, ok } = messageFromParams(params);
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          sites: true,
        },
      },
    },
  });

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">分类管理</h2>
        <p className="text-sm text-[var(--muted)]">
          分类用于首页筛选，删除分类不会删除站点（站点会变为未分类）。
        </p>
      </section>

      {error ? <div className="message-error">{error}</div> : null}
      {ok ? <div className="message-ok">{okMessages[ok] ?? "操作已完成。"}</div> : null}

      <section className="card p-5">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <h3 className="text-base font-semibold">添加分类</h3>
          <Tags size={16} className="text-[var(--muted)]" aria-hidden />
        </div>
        <form
          action={createCategoryAction}
          className="mt-4 grid gap-3 md:grid-cols-[1.2fr_1.2fr_120px_auto]"
        >
          <CategoryFields />
          <button className="btn-primary self-end" type="submit">
            <Plus size={15} aria-hidden />
            添加
          </button>
        </form>
      </section>

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
            现有分类
          </h3>
          <span className="text-xs text-[var(--muted)]">{categories.length} 个分类</span>
        </div>

        {categories.length ? (
          categories.map((category) => (
            <form
              action={updateCategoryAction.bind(null, category.id)}
              className="card grid gap-3 p-5 md:grid-cols-[1.2fr_1.2fr_120px_auto_auto] md:items-end"
              key={category.id}
            >
              <CategoryFields category={category} />
              <div className="text-xs text-[var(--muted)] md:self-center md:pb-1">
                {category._count.sites} 个站点
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-danger"
                  formAction={deleteCategoryAction.bind(null, category.id)}
                  formNoValidate
                  type="submit"
                >
                  <Trash2 size={15} aria-hidden />
                  删除
                </button>
                <button className="btn-primary" type="submit">
                  <Save size={15} aria-hidden />
                  保存
                </button>
              </div>
            </form>
          ))
        ) : (
          <div className="card px-8 py-12 text-center text-sm text-[var(--muted)]">
            还没有分类，站点可以暂时放在「未分类」。
          </div>
        )}
      </section>
    </div>
  );
}

type CategoryFieldCategory = {
  name: string;
  slug: string;
  sortOrder: number;
};

function CategoryFields({ category }: { category?: CategoryFieldCategory }) {
  return (
    <>
      <label className="admin-label">
        名称
        <input className="admin-field" defaultValue={category?.name} name="name" required />
      </label>
      <label className="admin-label">
        Slug
        <input
          className="admin-field"
          defaultValue={category?.slug}
          name="slug"
          placeholder="留空时按名称自动生成"
        />
      </label>
      <label className="admin-label">
        排序
        <input
          className="admin-field"
          defaultValue={category?.sortOrder ?? 0}
          min={0}
          name="sortOrder"
          type="number"
        />
      </label>
    </>
  );
}
