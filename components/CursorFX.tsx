'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';

type Particle = { id: number; x: number; y: number; dx: number; dy: number };

// Custom amber cursor + particle trail. Home/landing only (the brand surface).
// Disabled on touch devices and when the user prefers reduced motion.
export default function CursorFX() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 350, damping: 28, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 350, damping: 28, mass: 0.6 });
  const [enabled, setEnabled] = useState(false);
  const [hot, setHot] = useState(false); // hovering an interactive element
  const [particles, setParticles] = useState<Particle[]>([]);
  const idRef = useRef(0);
  const lastSpawn = useRef(0);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;

    // Enable only after mount + capability check (client-only), so SSR/touch/reduced-motion render nothing.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(true);
    document.documentElement.classList.add('cursor-none');

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setHot(!!(e.target as Element)?.closest('button, a, input, select, [role="button"]'));

      if (e.timeStamp - lastSpawn.current > 45) {
        lastSpawn.current = e.timeStamp;
        const id = idRef.current++;
        const a = Math.random() * Math.PI * 2;
        const d = 10 + Math.random() * 18;
        setParticles((p) => [...p.slice(-16), { id, x: e.clientX, y: e.clientY, dx: Math.cos(a) * d, dy: Math.sin(a) * d }]);
        setTimeout(() => setParticles((p) => p.filter((q) => q.id !== id)), 650);
      }
    };

    window.addEventListener('mousemove', move);
    return () => {
      window.removeEventListener('mousemove', move);
      document.documentElement.classList.remove('cursor-none');
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]" aria-hidden>
      {/* dot */}
      <motion.div
        className="absolute top-0 left-0 -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-accent"
        style={{ x, y }}
      />
      {/* lagging ring, grows over interactive targets */}
      <motion.div
        className="absolute top-0 left-0 rounded-full border border-accent/60"
        style={{ x: ringX, y: ringY }}
        animate={{ width: hot ? 48 : 30, height: hot ? 48 : 30, marginLeft: hot ? -24 : -15, marginTop: hot ? -24 : -15, opacity: hot ? 1 : 0.7 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      />
      {/* particle trail */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute top-0 left-0 -ml-0.5 -mt-0.5 h-1 w-1 rounded-full bg-accent"
            initial={{ x: p.x, y: p.y, opacity: 0.8, scale: 1 }}
            animate={{ x: p.x + p.dx, y: p.y + p.dy, opacity: 0, scale: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
