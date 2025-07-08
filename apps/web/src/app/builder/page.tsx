"use client";

import React from "react";
import { motion } from "motion/react";
import { FormBuilder } from "@/components/formedible/builder/form-builder";

export default function BuilderPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Builder Content */}
      <motion.div 
        className="w-full"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="min-h-[800px] p-2">
          <div className="w-full p-2 mx-auto">
            <div className="bg-card border rounded-lg shadow-sm">
              <FormBuilder />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}