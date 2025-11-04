'use client';

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from 'motion/react';

const words = ["Roger Federer", "Tom Hanks", "Céline Dion", "Nelson Mandela", "Marie Curie"];


export const WordCarousel = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        setIndex(0);
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length);
        }, 1700);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative overflow-hidden h-8 w-full">
            <AnimatePresence
                mode="sync"
            >
                <motion.div
                    key={index}
                    initial={{ y: 50, opacity: 1 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute w-full text-center"
                >
                    <p className="font-heading font-bold text-yellow-400 whitespace-nowrap
                                text-base md:text-xl text-shadow-lg text-shadow-black/40"
                    >
                        {words[index]}
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}