import HomeButton from '@/components/home-button';
import LogoutButton from '@/components/logout-button';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-full flex flex-col text-zinc-50">
      <header className="z-40 bg-zinc-900/50 border-b border-zinc-700 backdrop-blur-lg shadow-sm p-4 md:px-10 lg:px-16">
        <div className="w-full mx-auto flex justify-between items-center h-6">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold hidden sm:block">Admin</h1>
            <HomeButton />
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 flex min-h-0 max-h-full w-full relative z-0 mx-auto  p-4 md:px-10 lg:px-16">
        {children}
      </main>
    </div>
  );
}
