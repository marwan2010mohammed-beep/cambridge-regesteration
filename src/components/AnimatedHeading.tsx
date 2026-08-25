import React from 'react';
import { motion, Variants } from 'motion/react';

interface AnimatedHeadingProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span';
  staggerDuration?: number;
  delay?: number;
  animationType?: 'clip-slide-down' | 'blur-slide-up';
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

export function AnimatedHeading({
  text,
  className = '',
  as = 'h3',
  staggerDuration = 0.025,
  delay = 0,
  animationType = 'clip-slide-down',
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
      className={`inline-flex flex-wrap items-center tracking-tight text-lg sm:text-xl md:text-2xl font-bold transition-colors duration-300 ${className}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
    >
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
    </Component>
  );
}

export default AnimatedHeading;

