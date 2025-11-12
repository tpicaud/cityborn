'use client';

import Button from '@/components/ui/buttons/NewButton';
import { useState } from 'react';
import { WordCarousel } from './WordCarousel';
import Image from 'next/image';
import Card from '@/components/ui/cards/Card';
import Input from '@/components/ui/inputs/TextInput';
import { motion, AnimatePresence } from 'motion/react';

export const MenuView = () => {
  const [view, setView] = useState<'home' | 'play'>('home');

  return (
    <div className="relative flex-1 overflow-hidden">
      <AnimatePresence mode="sync" initial={false}>
        {view === 'home' ? (
          <motion.div
            key="home"
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center pb-24 md:pb-28 gap-8 md:gap-8 p-1"
          >
            <Image
              src={'/logo_white.webp'}
              alt={'logo'}
              width={112}
              height={112}
            />

            <Button
              onClick={() => setView('play')}
              variant="primary"
              className="py-4 md:py-4 lg:py-4"
            >
              JOUE SANS COMPTE
            </Button>

            <div className="flex flex-col gap-5 items-center">
              <p className="text-center text-shadow-lg font-bold text-sm md:text-base w-[90%] md:w-[60%] lg:w-[50%]">
                Cityborn, c'est le jeu quiz géo-culture où tu découvres où sont
                nés les célébrités en t'amusant, seul ou avec tes potes&nbsp;!
              </p>

              <div className="flex flex-col gap-0 items-center">
                <p className="text-center text-shadow-lg text-shadow-black/40 text-heading font-bold text-sm md:text-xl">
                  TROUVE LE LIEU DE NAISSANCE&nbsp;DE
                </p>
                <WordCarousel />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="play"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            className="absolute top-0 left-0 w-full h-full flex flex-col gap-5 items-center justify-center p-4"
          >
            {/* Join */}
            <Card
              size="lg"
              variant="accent"
              className="w-64 h-28 flex flex-col items-center justify-center p-2"
            >
              <div className="w-full flex flex-col gap-2 justify-center items-center">
                <h2 className="text-base md:text-lg">REJOINDRE</h2>
                <div className="flex flex-row gap-2">
                  <Input
                    className="w-full bg-neutral rounded-xl pl-2"
                    placeholder="Code"
                  ></Input>
                  <Button size="sm">GO</Button>
                </div>
              </div>
            </Card>

            {/* Create */}
            <div
              className="grid grid-cols-1 gap-4 w-full place-items-center
                                        md:grid-cols-2 md:gap-6 md:w-auto"
            >
              <div
                className="w-full h-32 max-w-96 
                                            sm:w-90 sm:h-42 
                                            md:w-72 md:h-90 
                                            lg:w-80 lg:h-96"
              >
                <Card
                  size="lg"
                  variant="primary"
                  className="flex flex-row gap-5 justify-center items-center h-full w-full 
                                               md:flex-col"
                >
                  <div className="flex-1 flex flex-col gap-2 items-center">
                    <h2 className="flex-1 flex place-items-end text-2xl lg:text-4xl">
                      SOLO
                    </h2>
                    <p className="flex-1 text-xs text-center md:text-sm">
                      Joue en solo et prouve que tu es le boss de la culture géo
                      !
                    </p>
                  </div>
                  <div
                    className="flex w-[30%] h-auto justify-center
                                                    md:w-auto md:h-[40%]"
                  >
                    <div>
                      <Button className="">Créer</Button>
                    </div>
                  </div>
                </Card>
              </div>
              <div className="w-full h-32 max-w-96 sm:w-90 sm:h-42 md:w-72 md:h-90 lg:w-80 lg:h-96">
                <Card
                  size="lg"
                  variant="primary"
                  className="flex flex-row gap-5 justify-center items-center h-full w-full 
                                               md:flex-col"
                >
                  <div className="flex-1 flex flex-col gap-2 items-center">
                    <h2 className="flex-1 flex place-items-end text-2xl lg:text-4xl">
                      MULTI
                    </h2>
                    <p className="flex-1 text-xs text-center md:text-sm">
                      Crée ta partie et défie tes potes !
                    </p>
                  </div>
                  <div
                    className="flex w-[30%] h-auto justify-center
                                                    md:w-auto md:h-[40%]"
                  >
                    <div>
                      <Button className="">Créer</Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <Button onClick={() => setView('home')}>Retour</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
