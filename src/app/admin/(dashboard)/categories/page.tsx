import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "./actions";
import { messageFromParams } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { Plus, Save, Trash2 } from "lucide-react";

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
    <div className="grid gap-7">
      <section>
        <h1 className="text-3xl font-black">分类管理</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          分类用于首页筛选和后台整理，删除分类不会删除站点。
        </p>
      </section>

      {error ? <div className="message-error">{error}</div> : null}
      {ok ? <div className="message-ok">{okMessages[ok] ?? "操作已完成。"}</div> : null}

      <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
        <h2 className="text-lg font-black">添加分类</h2>
        <form action={createCategoryAction} className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_140px_auto]">
          <CategoryFields />
          <button className="btn-primary self-end" type="submit">
            <Plus size={17} aria-hidden />
            添加
          </button>
        </form>
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <h2 className="text-lg font-black">现有分类</h2>
          <span className="text-sm font-bold text-[var(--muted)]">{categories.length} 个分类</span>
        </div>

        {categories.length ? (
          categories.map((category) => (
            <form
              action={updateCategoryAction.bind(null, category.id)}
              className="grid gap-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5 md:grid-cols-[1fr_1fr_140px_auto_auto]"
              key={category.id}
            >
              <CategoryFields category={category} />
              <div className="self-end text-sm font-bold text-[var(--muted)]">
                {category._count.sites} 个站点
              </div>
              <div className="flex gap-2 self-end">
                <button className="btn-primary" type="submit">
                  <Save size={17} aria-hidden />
                  保存
                </button>
                <button
                  className="btn-danger"
                  formAction={deleteCategoryAction.bind(null, category.id)}
                  formNoValidate
                  type="submit"
                >
                  <Trash2 size={17} aria-hidden />
                  删除
                </button>
              </div>
            </form>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-10 text-center text-sm text-[var(--muted)]">
            还没有分类。站点可以先放在未分类。
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
