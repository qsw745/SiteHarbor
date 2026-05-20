import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "./actions";
import { format, type Dictionary } from "@/lib/i18n";
import { getActiveDictionary } from "@/lib/locale";
import { messageFromParams, resolveMessage } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { Plus, Save, Tags, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

type CategoriesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const params = await searchParams;
  const { error, ok } = messageFromParams(params);
  const [{ dict }, categories] = await Promise.all([
    getActiveDictionary(),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            sites: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">{dict.categories.title}</h2>
        <p className="text-sm text-[var(--muted)]">{dict.categories.subtitle}</p>
      </section>

      {error ? <div className="message-error">{resolveMessage(dict, error, params)}</div> : null}
      {ok ? <div className="message-ok">{resolveMessage(dict, ok, params)}</div> : null}

      <section className="card p-5">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <h3 className="text-base font-semibold">{dict.categories.addCategory}</h3>
          <Tags size={16} className="text-[var(--muted)]" aria-hidden />
        </div>
        <form
          action={createCategoryAction}
          className="mt-4 grid gap-3 md:grid-cols-[1.2fr_1.2fr_120px_auto]"
        >
          <CategoryFields dict={dict} />
          <button className="btn-primary self-end" type="submit">
            <Plus size={15} aria-hidden />
            {dict.categories.add}
          </button>
        </form>
      </section>

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wider text-[var(--muted)]">
            {dict.categories.existing}
          </h3>
          <span className="text-xs text-[var(--muted)]">
            {format(dict.categories.countCategories, { count: categories.length })}
          </span>
        </div>

        {categories.length ? (
          categories.map((category) => (
            <form
              action={updateCategoryAction.bind(null, category.id)}
              className="card grid gap-3 p-5 md:grid-cols-[1.2fr_1.2fr_120px_auto_auto] md:items-end"
              key={category.id}
            >
              <CategoryFields category={category} dict={dict} />
              <div className="text-xs text-[var(--muted)] md:self-center md:pb-1">
                {format(dict.categories.countSites, { count: category._count.sites })}
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-danger"
                  formAction={deleteCategoryAction.bind(null, category.id)}
                  formNoValidate
                  type="submit"
                >
                  <Trash2 size={15} aria-hidden />
                  {dict.categories.delete}
                </button>
                <button className="btn-primary" type="submit">
                  <Save size={15} aria-hidden />
                  {dict.categories.save}
                </button>
              </div>
            </form>
          ))
        ) : (
          <div className="card px-8 py-12 text-center text-sm text-[var(--muted)]">
            {dict.categories.empty}
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

function CategoryFields({
  category,
  dict,
}: {
  category?: CategoryFieldCategory;
  dict: Dictionary;
}) {
  return (
    <>
      <label className="admin-label">
        {dict.fields.name}
        <input className="admin-field" defaultValue={category?.name} name="name" required />
      </label>
      <label className="admin-label">
        {dict.fields.slug}
        <input
          className="admin-field"
          defaultValue={category?.slug}
          name="slug"
          placeholder={dict.fields.slugFromNamePlaceholder}
        />
      </label>
      <label className="admin-label">
        {dict.fields.sortOrder}
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
