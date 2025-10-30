import HomeButton from "@/components/home-button";
import LogoutButton from "@/components/logout-button";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="h-full flex flex-col text-zinc-50">
            <header className="relative z-40 bg-zinc-900/50 border-b border-zinc-700 p-4 backdrop-blur-lg shadow-sm">

                <div className="max-w-7xl lg:max-w-8xl mx-auto flex justify-between items-center h-6">
                    <div className="flex items-center gap-6">
                        <h1 className="text-2xl font-bold hidden sm:block">
                            Admin
                        </h1>
                        <HomeButton />
                    </div>
                    <LogoutButton />
                </div>
            </header>

            <main className="flex-1 w-full relative z-0 max-w-7xl mx-auto p-4 lg:px-0 lg:max-w-8xl">
                {children}
            </main>
        </div>
    )
}