import React from "react";
import { motion } from "motion/react";

export const AnimatedFieldWrapper: React.FC<{ children: React.ReactNode; field: any }> = ({ children, field }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, delay: 0.1 }}
    className="space-y-2"
  >
    {children}
  </motion.div>
); 