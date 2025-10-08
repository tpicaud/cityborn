import Button from "@/components/ui/buttons/Button"
import Link from "next/link";
import Image from "next/image";
import { WordCarousel } from "./components/wordCarousel";

export const Menu = () => {
    return (
        <section
            className="h-full flex flex-col"
        >
            {/* Background */}
            <div
                className="absolute inset-0 bg-cover bg-center z-[-1]"
                style={{ backgroundImage: `url('./background_worldmap.png')` }}
            />
            <div className="absolute inset-0 bg-black/50 z-[-1]" />

            {/* Header */}
            <header className="h-20 md:h-24
                        flex flex-row items-center justify-between
                        bg-transparent p-1 z-10">

                {/* Logo */}
                <div className="flex items-center h-full">
                    <Link href="/" className="h-full transition-transform duration-200 ease-in-out transform hover:scale-105 active:scale-95">
                        <img
                            src={'./logo.svg'}
                            alt="Logo"
                            className="h-full w-auto"
                        />
                    </Link>
                </div>

                {/* Connection buttons */}
                <div className="flex flex-row items-center justify-between gap-2 md:gap-3 h-full">
                    <Button variant="secondary">
                        CONNEXION
                    </Button>
                    <Button variant="primary">
                        INSCRIPTION
                    </Button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center
                            pb-24 gap-8 md:gap-6 p-1"
            >
                <Image src={'/logo_white.webp'} alt={"logo"} width={112} height={112}></Image>

                <Button variant='primary' className="py-4 md:py-4 lg:py-4">
                    JOUE SANS COMPTE
                </Button>

                <div className="flex flex-col gap-3 items-center">
                    <p className="text-center text-shadow-lg font-bold
                            text-sm md:text-base
                            w-[90%] md:w-[60%] lg-[50%]">
                        Cityborn, c'est le jeu quiz géo-culture où tu découvres où sont nés les célebrités en t'amusant, seul ou avec tes potes&nbsp;!
                    </p>

                    <div className="flex flex-col gap-0 items-center">
                        <p className="text-center text-shadow-lg text-shadow-black/40 text-heading font-bold
                            text-sm md:text-xl">
                            TROUVE LE LIEU DE NAISSANCE&nbsp;DE
                        </p>
                        <WordCarousel />
                    </div>
                </div>
            </div>
        </section>
    );
}