import Header from '@/components/Header';

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className="h-full flex flex-col p-4 md:p-6 text-neutral text-shadow-classic;
"
    >
      {/* Header */}
      <Header />

      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center z-[-1]"
        style={{ backgroundImage: `url('./background_worldmap.png')` }}
      />
      <div className="absolute inset-0 bg-black/50 z-[-1]" />

      {/* Content */}
      <div className="h-full">{children}</div>
    </div>
  );
}
