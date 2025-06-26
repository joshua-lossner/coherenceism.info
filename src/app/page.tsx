'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import quotes from '../data/quotes.json';
import { motion } from 'framer-motion';

const QUOTE_INTERVAL = 30000; // 30s
const FADE_DELAY = 5000; // 5s

export default function Home() {
  const [quote, setQuote] = useState('');

  useEffect(() => {
    function pickQuote() {
      const q = quotes[Math.floor(Math.random() * quotes.length)];
      setQuote(q);
    }
    pickQuote();
    const interval = setInterval(pickQuote, QUOTE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="relative h-full w-full overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        src="/coherence-background.mp4"
        poster="/background.jpg"
      />
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="pointer-events-none absolute bottom-4 right-4 sm:bottom-8 sm:right-8"
      >
        <Image
          src="/tv-static.png"
          alt="TV static"
          width={300}
          height={250}
          className="w-48 sm:w-72"
        />
      </motion.div>
      {quote && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: FADE_DELAY / 1000, duration: 1 }}
          className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 text-xl sm:text-2xl max-w-md"
        >
          {quote}
        </motion.div>
      )}
    </main>
  );
}
