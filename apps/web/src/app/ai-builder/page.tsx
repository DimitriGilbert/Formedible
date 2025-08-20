"use client";

import React from "react";
import { motion } from "motion/react";
import { AIBuilder } from "@/components/formedible/ai/ai-builder";

export default function AiBuilderPage() {
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <motion.div 
        className="flex-1 flex flex-col overflow-hidden"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex-1 p-2 overflow-hidden">
          <div className="h-full w-full overflow-hidden">
            <div className="bg-card border rounded-lg shadow-sm h-full p-2 overflow-hidden">
              <AIBuilder className="h-full w-full overflow-hidden" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}