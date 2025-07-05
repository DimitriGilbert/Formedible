"use client";

import React from "react";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function BuilderPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">Form Builder</h1>
              <p className="text-sm text-muted-foreground">
                Build forms visually with our interactive form builder
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Builder Content */}
      <motion.div 
        className="w-full"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-white dark:bg-slate-900 border-t border-b min-h-[800px]">
          <div className="flex items-center justify-center h-[800px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Form Builder Coming Soon</h2>
              <p className="text-muted-foreground mb-6">
                The interactive form builder is being migrated from the demo package.
                <br />
                Check back soon for the full builder experience!
              </p>
              <Button asChild>
                <Link href="/">
                  Return to Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}