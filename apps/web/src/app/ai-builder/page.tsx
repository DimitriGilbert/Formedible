"use client";

import React from "react";
import { motion } from "motion/react";
import { AIBuilder } from "@/components/formedible/ai/ai-builder";

export default function AiBuilderPage() {
  return (
    <div className="h-[calc(100vh-4rem)] bg-background">
      <motion.div 
        className="h-full p-2"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-card border rounded-lg shadow-sm h-full p-2">
          <AIBuilder className="h-full w-full" />
        </div>
      </motion.div>
    </div>
  );
}