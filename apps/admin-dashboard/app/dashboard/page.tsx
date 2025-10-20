// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/logout-button";
import { ActiveUsers } from "@/components/active-users";
import { GuessObjectBuilder } from "@/components/guess-object-builder/guess-object-builder";

export default async function Dashboard() {
  const session = await getSession();
  
  if (!session?.isAuthenticated) {
    redirect("/login");
  }
  
  return (
    <div className="h-full flex flex-col text-zinc-50">
      <header className="relative z-40 bg-zinc-900/50 border-b border-zinc-700 p-4 backdrop-blur-lg shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold hidden sm:block">
              Admin
            </h1>
            <ActiveUsers />
          </div>
          <LogoutButton />
        </div>
      </header>
      
      <main className="flex-1 w-full relative z-0 max-w-6xl mx-auto p-4 lg:px-0">
         <GuessObjectBuilder />
      </main>
    </div>
  );
}