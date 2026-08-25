import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface RolodexTextProps {
  words: string[];
  interval?: number;
  className?: string;
  textClassName?: string;
  autoPlay?: boolean;
}

export function RolodexText({
  words,
  interval = 2600,
  className = '',
  textClassName = '',
  autoPlay = true,
}: RolodexTextProps) {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState<number | 'auto'>('auto');
  const measureRef = useRef<HTMLSpanElement>(null);

  // Cycle through word list at regular intervals
  useEffect(() => {
    if (!autoPlay || words.length <= 1) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, interval);

    return () => clearInterval(timer);
  }, [words, interval, autoPlay]);

  // Dynamically measure active word width for smooth left-aligned inline flow
  useEffect(() => {
    if (measureRef.current) {
      setWidth(measureRef.current.offsetWidth);
    }
  }, [index, words]);

  const currentWord = words[index] || '';

  return (
    <span
      className={`inline-block relative text-left align-baseline transition-[width] duration-300 ease-out ${className}`}
      style={{
        perspective: '1200px',
        transformStyle: 'preserve-3d',
        width: typeof width === 'number' ? `${width}px` : 'auto',
        overflow: 'visible', // CRITICAL: preserve 3D rotation visibility without strict box clipping
        textAlign: 'left',
      }}
    >
      {/* Offscreen invisible measurement element to compute precise pixel width */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className={`inline-block opacity-0 pointer-events-none whitespace-pre ${textClassName}`}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          top: 0,
          left: 0,
        }}
      >
        {currentWord}
      </span>

      {/* 3D Rolodex Slot Machine Word Flip */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={currentWord}
          initial={{
            rotateX: 90,
            opacity: 0,
            y: '50%',
          }}
          animate={{
            rotateX: 0,
            opacity: 1,
            y: '0%',
          }}
          exit={{
            rotateX: -90,
            opacity: 0,
            y: '-50%',
          }}
          transition={{
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1], // Smooth Rolodex physical flip curve
          }}
          className={`inline-block whitespace-nowrap origin-left ${textClassName}`}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transformOrigin: 'left center -10px',
            backfaceVisibility: 'hidden',
            willChange: 'transform, opacity',
          }}
        >
          {currentWord}
        </motion.span>
      </AnimatePresence>

      {/* Invisible baseline spacer element to maintain height and line flow */}
      <span
        className={`inline-block opacity-0 select-none pointer-events-none whitespace-pre ${textClassName}`}
        aria-hidden="true"
      >
        {currentWord}
      </span>
    </span>
  );
}

export default RolodexText;
