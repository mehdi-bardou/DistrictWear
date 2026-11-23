"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";

type PageTransitionProps = {
  children: React.ReactNode;
};

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const transitionKey = `${locale}:${pathname}`;

  return (
    <motion.div
      key={transitionKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
