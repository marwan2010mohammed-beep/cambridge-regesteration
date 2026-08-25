import React from 'react';
import { motion, Variants } from 'motion/react';

export interface OversizedClippedHeadingProps {
  text: string;
  subtext?: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
  accentColor?: string;
}

export function OversizedClippedHeading({
  text,
  subtext,
  className = '',
  as = 'h1',
  accentColor = '#60a5fa',
}: OversizedClippedHeadingProps) {
  const words = text.split(' ');

  // Outer container stagger controller
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  // Clipping Mask Slide-In + Fade variants (Power4.out easing: fast start, dramatic slow down)
  const wordClipVariants: Variants = {
    hidden: {
      y: '120%',
      opacity: 0,
      filter: 'blur(4px)',
    },
    visible: {
      y: '0%',
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.9,
        ease: [0.1, 1, 0.1, 1], // Exact Power4.out / Quintic deceleration curve
      },
    },
  };

  const Component = motion[as] as typeof motion.h1;

  return (
    <div className={`relative w-full overflow-hidden my-4 ${className}`}>
      {/* Background Subtle Gradient Mask Layer for Fade Effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 blur-3xl z-0"
        style={{
          background: `radial-gradient(circle at 30% 50%, ${accentColor}, transparent 70%)`
        }}
      />

      <Component
        className="relative z-10 font-extrabold tracking-tighter leading-[0.95] text-[clamp(2.5rem,7vw,5.5rem)] text-white select-none"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
      >
        <div className="flex flex-wrap items-baseline gap-x-[0.25em] gap-y-[0.1em]">
          {words.map((word, wordIdx) => (
            <div
              key={wordIdx}
              className="inline-block overflow-hidden py-[0.05em] px-[0.02em]"
              style={{
                /* Clipping mask container */
                clipPath: 'inset(0 0 0 0)',
              }}
            >
              <motion.span
                variants={wordClipVariants}
                className="inline-block bg-gradient-to-b from-white via-white/95 to-white/70 bg-clip-text text-transparent"
                style={{
                  willChange: 'transform, opacity, clip-path, filter',
                }}
              >
                {word}
              </motion.span>
            </div>
          ))}
        </div>
      </Component>

      {subtext && (
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mt-3 text-sm sm:text-base md:text-lg text-slate-400 font-medium max-w-2xl leading-relaxed"
        >
          {subtext}
        </motion.p>
      )}
    </div>
  );
}

export default OversizedClippedHeading;
