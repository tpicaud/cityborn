'use client';
import Button from "@/components/ui/buttons/Button";
import { WordCarousel } from "./components/wordCarousel";
import { MenuViewSwitcher } from "./contexts/viewSwitcher";
import Image from 'next/image'

export const Menu = () => {
    return (
        <section
            className="h-full flex flex-col"
        >
            <MenuViewSwitcher
                homeView={
                    <div className="flex-1 flex flex-col items-center justify-center
                                            pb-24 md:pb-28 gap-8 md:gap-8 p-1"
                    >
                        <Image src={'/logo_white.webp'} alt={"logo"} width={112} height={112}></Image>

                        <MenuViewSwitcher.Trigger view="play">
                            <Button variant='primary' className="py-4 md:py-4 lg:py-4">
                                JOUE SANS COMPTE
                            </Button>
                        </MenuViewSwitcher.Trigger>


                        <div className="flex flex-col gap-5 md:gap-5 items-center">
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
                }

                playView={
                    <div>Play view</div>
                } />
        </section>
    );
}