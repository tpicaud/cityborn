import Header from "@/components/headers";

export default async function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <Header />

            {/* Background */}
            <div
                className="absolute inset-0 bg-cover bg-center z-[-1]"
                style={{ backgroundImage: `url('./background_worldmap.png')` }}
            />
            <div className="absolute inset-0 bg-black/50 z-[-1]" />

            {/* Content */}
            <div className="h-full">
                {children}
            </div>
        </div>
    )
}