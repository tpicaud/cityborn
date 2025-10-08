import Header from "@/components/headers";

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div>
            {/* Header */}
            <Header />

            {/* Background */}
            <div
                className="absolute inset-0 bg-cover bg-center z-[-1]"
                style={{ backgroundImage: `url('./background_worldmap.png')` }}
            />
            <div className="absolute inset-0 bg-black/50 z-[-1]" />

            {/* Content */}
            {children}
        </div>
    )
}