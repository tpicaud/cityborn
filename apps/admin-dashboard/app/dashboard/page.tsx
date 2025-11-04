// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { CategoriesEditor } from "@/components/categories-editor/categories-editor";

export default async function Dashboard() {
  const session = await getSession();

  if (!session?.isAuthenticated) {
    redirect("/login");
  }

  return (
    <CategoriesEditor />
  );
}