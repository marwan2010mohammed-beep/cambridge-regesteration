import React from 'react';
import { motion, Variants } from 'motion/react';

interface AnimatedHeadingProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span';
  staggerDuration?: number;
  delay?: number;
  animationType?: 'clip-slide-down' | 'blur-slide-up';
  showUnderline?: boolean;
  underlineColor?: string;
}

const slideDownLetterVariants: Variants = {
  hidden: {
    y: '-115%',
    opacity: 0,
  },
  visible: {
    y: '0%',
    opacity: 1,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1], // Smooth custom cubic bezier curve
    },
  },
};

const blurUpLetterVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
    filter: 'blur(10px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.45,
      ease: [0.25, 0.4, 0.25, 1],
    },
  },
};

const mainUnderlineVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.75, ease: [0.33, 1, 0.68, 1], delay: 0.35 },
      opacity: { duration: 0.15, delay: 0.35 },
    },
  },
};

const accentUnderlineVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 0.65,
    transition: {
      pathLength: { duration: 0.65, ease: [0.33, 1, 0.68, 1], delay: 0.55 },
      opacity: { duration: 0.15, delay: 0.55 },
    },
  },
};

export function AnimatedHeading({
  text,
  className = '',
  as = 'h3',
  staggerDuration = 0.025,
  delay = 0,
  animationType = 'clip-slide-down',
  showUnderline = false,
  underlineColor = '#60a5fa',
}: AnimatedHeadingProps) {
  const words = text.split(' ');

  const containerVariants: Variants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDuration,
        delayChildren: delay,
      },
    },
  };

  const Component = motion[as] as typeof motion.h3;
  const activeVariants = animationType === 'clip-slide-down' ? slideDownLetterVariants : blurUpLetterVariants;

  return (
    <Component
      className={`relative inline-flex flex-col tracking-tight text-lg sm:text-xl md:text-2xl font-bold transition-colors duration-300 ${className}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
    >
      <span className="inline-flex flex-wrap items-center">
        {words.map((word, wordIdx) => (
          <span key={wordIdx} className="inline-block whitespace-nowrap mr-[0.25em]">
            {Array.from(word).map((char, charIdx) => (
              <span
                key={charIdx}
                className="inline-block overflow-hidden vertical-align-bottom leading-none py-[0.1em] -my-[0.1em]"
                style={{ verticalAlign: 'bottom' }}
              >
                <motion.span
                  variants={activeVariants}
                  className="inline-block"
                  style={{ willChange: 'transform, opacity' }}
                >
                  {char}
                </motion.span>
              </span>
            ))}
          </span>
        ))}
      </span>

      {showUnderline && (
        <span className="block w-full relative mt-0.5 overflow-visible">
          <svg
            className="w-full h-3 overflow-visible pointer-events-none"
            viewBox="0 0 300 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <motion.path
              d="M 3,11 C 50,3 120,15 180,7 C 230,2 270,12 297,7"
              stroke={underlineColor}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              variants={mainUnderlineVariants}
            />
            <motion.path
              d="M 15,14 C 75,7 145,14 215,9 C 255,7 285,12 292,10"
              stroke={underlineColor}
              strokeWidth="1.6"
              strokeLinecap="round"
              variants={accentUnderlineVariants}
            />
          </svg>
        </span>
      )}
    </Component>
  );
}

export default AnimatedHeading;

