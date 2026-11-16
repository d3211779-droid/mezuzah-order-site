import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** The catalog was split into /admin/models, /admin/colors and /admin/fills. Old links still work. */
export default async function AdminCatalogRedirect({ searchParams }: { searchParams: SearchParams }) {
  const tab = (await searchParams).tab;
  redirect(tab === "colors" ? "/admin/colors" : tab === "fills" ? "/admin/fills" : "/admin/models");
}
