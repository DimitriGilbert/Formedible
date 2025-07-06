"use client";

import React from "react";
import { motion } from "motion/react";
import { ArrowLeft, Book, Code, Zap, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function DocsPage() {
  const docSections = [
    {
      title: "Getting Started",
      description: "Installation, setup, and your first form",
      icon: Zap,
      href: "/docs/getting-started",
      color: "text-green-500"
    },
    {
      title: "API Reference",
      description: "Complete API documentation and examples",
      icon: Code,
      href: "/docs/api",
      color: "text-blue-500"
    },
    {
      title: "Field Types",
      description: "All available field types and configurations",
      icon: FileText,
      href: "/docs/fields",
      color: "text-purple-500"
    },
    {
      title: "Examples",
      description: "Real-world examples and use cases",
      icon: Book,
      href: "/docs/examples",
      color: "text-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
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
              <h1 className="text-xl font-bold">Documentation</h1>
              <p className="text-sm text-muted-foreground">
                Learn how to use Formedible in your projects
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-center mb-12">
            <motion.h2 
              className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              Documentation
            </motion.h2>
            <motion.p 
              className="text-xl text-muted-foreground"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Everything you need to know about building forms with Formedible
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {docSections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Link href={section.href}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <section.icon className={`w-8 h-8 ${section.color} mb-2`} />
                      <CardTitle>{section.title}</CardTitle>
                      <CardDescription>
                        {section.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="mt-16 text-center"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-8 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-2xl font-bold mb-4 text-blue-800 dark:text-blue-200">
                Quick Start
              </h3>
              <p className="text-blue-700 dark:text-blue-300 mb-6">
                Get up and running with Formedible in minutes
              </p>
              <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4 text-left">
                <code className="text-green-400 font-mono text-sm block">
                  npx shadcn@latest add formedible.com/r/use-formedible.json
                </code>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}