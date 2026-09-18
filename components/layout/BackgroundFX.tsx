'use client';

import { motion } from 'framer-motion';

export function BackgroundFX() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="lv-grid absolute inset-0 opacity-50" />
      <motion.div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" animate={{ x: [0, 40, -10, 0], y: [0, 30, 60, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute right-[-7rem] top-[18%] h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" animate={{ x: [0, -35, 10, 0], y: [0, 40, 10, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute bottom-[-8rem] left-[30%] h-80 w-80 rounded-full bg-pink-500/10 blur-3xl" animate={{ x: [0, 50, -25, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
    </div>
  );
}
