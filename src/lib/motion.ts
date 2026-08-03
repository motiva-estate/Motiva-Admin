/**
 * Shared Framer Motion variants and helpers.
 *
 * Usage in a page root:
 *   <motion.div {...pageProps}>   ← fades + slides the whole page in
 *     <motion.div variants={slideUp}>…</motion.div>
 *     <motion.div variants={stagger}>
 *       <motion.div variants={staggerItem}>…</motion.div>
 *     </motion.div>
 *   </motion.div>
 */

import type { HTMLMotionProps } from "framer-motion";

// ── Timing constants ──────────────────────────────────────────────────────────
const EASE_OUT = [0.16, 1, 0.3, 1] as const; // smooth deceleration
const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;

// ── Page-level fade + slide ───────────────────────────────────────────────────
export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: EASE_OUT, staggerChildren: 0.07 },
  },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15, ease: EASE_IN_OUT } },
};

/** Spread onto the root <motion.div> of every page. */
export const pageProps: HTMLMotionProps<"div"> = {
  variants: pageVariants,
  initial: "initial",
  animate: "animate",
  exit: "exit",
};

// ── Child variants (used inside a stagger parent) ────────────────────────────
/** Slides up and fades in — for headings, banners, individual cards. */
export const slideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } },
};

/** Stagger container — apply to the direct parent of a list of items. */
export const stagger = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

/** Stagger child — apply to each item inside a stagger container. */
export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } },
};

/** Scale-pop — for modals, cards, login boxes. */
export const scalePop = {
  initial: { opacity: 0, scale: 0.96 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.22, ease: EASE_OUT },
  },
  exit: { opacity: 0, transition: { duration: 0.15, ease: EASE_OUT } },
};

/** Fade only — for overlays, subtle reveals. */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** Horizontal slide — for tab panels, side drawers. */
export const slideInRight = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: EASE_OUT } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.15 } },
};

/** KPI counter card pop — staggers with a slight spring. */
export const kpiCard = {
  initial: { opacity: 0, y: 20, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 22 },
  },
};
