// components/HomeHero.tsx
import React from "react";
import Image from "next/image";

type Props = {
    onPlay?: () => void;
    onSignIn?: () => void;
    onSignUp?: () => void;
};

export default function HomeHero({ onPlay, onSignIn, onSignUp }: Props) {
    return (
        <section className="relative isolate flex min-h-svh w-full items-center justify-center bg-[#F3F0EC] overflow-hidden px-5">
            {/* Bulles dégradées */}
            <div aria-hidden className="pointer-events-none absolute -right-24 -top-36 h-[55vh] w-[55vh] rounded-full blur-2xl" style={{
                background: "radial-gradient(closest-side, #27E0C5 0%, #1F6BD0 100%)"
            }} />
            <div aria-hidden className="pointer-events-none absolute -left-40 -bottom-56 h-[70vh] w-[70vh] rounded-full blur-2xl" style={{
                background: "radial-gradient(closest-side, #2DE2C2 0%, #08AEEA 100%)"
            }} />

            {/* Contenu */}
            <div className="relative z-10 flex w-full max-w-[420px] flex-col items-center gap-6 text-center">
                {/* Logo (inchangé) */}
                <div className="rounded-[30px] shadow-[0_12px_30px_rgba(0,0,0,.15)] overflow-hidden">
                    <Image
                        src="/assets/cityborn-logo.png" // met ton logo ici
                        alt="CityBorn"
                        width={180}
                        height={180}
                        priority
                    />
                </div>

                {/* Tagline */}
                <p className="text-[#136C8A] text-xl leading-7 font-semibold tracking-wide">
                    Saurez-vous trouver<br />leurs origines&nbsp;?
                </p>

                {/* Titre JOUER (cliquable) */}
                <button
                    onClick={onPlay}
                    className="text-[#0A6AA0] text-5xl font-black tracking-[0.12em] uppercase drop-shadow-sm transition-transform active:scale-95"
                >
                    JOUER
                </button>

                {/* Boutons */}
                <div className="mt-1 flex w-full flex-col gap-4">
                    {/* SE CONNECTER (plein) */}
                    <button
                        onClick={onSignIn}
                        className="w-full rounded-[26px] py-4 font-extrabold tracking-widest text-white shadow-md transition-transform active:scale-95"
                        style={{ background: "linear-gradient(135deg,#A6D3DA 0%,#A6D3DA 100%)" }}
                    >
                        SE CONNECTER
                    </button>

                    {/* S’INSCRIRE (outline) */}
                    <button
                        onClick={onSignUp}
                        className="w-full rounded-[26px] border-2 border-[rgba(19,108,138,0.65)] bg-transparent py-3.5 font-extrabold tracking-widest text-[#136C8A] transition-transform active:scale-95"
                    >
                        S’INSCRIRE
                    </button>
                </div>
            </div>
        </section>
    );
}