"use client";

import React from "react";
import { motion } from "motion/react";
import { Book, Code, Zap, FileText, Sparkles, Rocket, Shield, Layers } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function DocsPage() {
  const docSections = [
    {
      title: "Getting Started",
      description: "Install Formedible and create your first form in under 5 minutes",
      icon: Rocket,
      href: "/docs/getting-started",
      color: "text-green-500",
      badge: "Start Here"
    },
    {
      title: "Field Types",
      description: "Explore 15+ pre-built field components with validation and styling",
      icon: Layers,
      href: "/docs/fields",
      color: "text-purple-500",
      badge: "Popular"
    },
    {
      title: "API Reference",
      description: "Complete documentation of hooks, props, and configuration options",
      icon: Code,
      href: "/docs/api",
      color: "text-blue-500",
      badge: null
    },
    {
      title: "Examples",
      description: "Real-world form implementations from simple to complex use cases",
      icon: Book,
      href: "/docs/examples",
      color: "text-orange-500",
      badge: null
    }
  ];

  const features = [
    {
      icon: Shield,
      title: "Type-Safe",
      description: "Built with TypeScript and Zod for complete type safety"
    },
    {
      icon: Zap,
      title: "Zero Config",
      description: "Works out of the box with sensible defaults"
    },
    {
      icon: Sparkles,
      title: "Beautiful UI",
      description: "Powered by shadcn/ui components"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <motion.div 
          className="max-w-6xl mx-auto"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* Hero Section */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mb-6"
            >
              <Badge variant="secondary" className="mb-4">
                Documentation
              </Badge>
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-slate-100 dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                Build Forms That Just Work
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Formedible combines the power of TanStack Form with beautiful shadcn/ui components. 
                Create schema-driven forms with validation, multi-step flows, and custom styling in minutes.
              </p>
            </motion.div>

            {/* Feature Pills */}
            <motion.div 
              className="flex flex-wrap justify-center gap-4 mb-12"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {features.map((feature, index) => (
                <div key={feature.title} className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full border shadow-sm">
                  <feature.icon className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">{feature.title}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{feature.description}</span>
                </div>
              ))}
            </motion.div>

            {/* Quick Install */}
            <motion.div 
              className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800 mb-16"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                  Quick Install
                </h3>
              </div>
              <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4 max-w-2xl mx-auto">
                <code className="text-green-400 font-mono text-sm block text-center">
                  npx shadcn@latest add formedible.com/r/use-formedible.json
                </code>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-3">
                One command installs everything you need to get started
              </p>
            </motion.div>
          </div>

          {/* Documentation Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {docSections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Link href={section.href}>
                  <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-200 dark:hover:border-blue-800 relative overflow-hidden">
                    {section.badge && (
                      <Badge className="absolute top-4 right-4 bg-blue-500 hover:bg-blue-600">
                        {section.badge}
                      </Badge>
                    )}
                    <CardHeader className="pb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 border`}>
                          <section.icon className={`w-6 h-6 ${section.color}`} />
                        </div>
                        <CardTitle className="text-xl group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {section.title}
                        </CardTitle>
                      </div>
                      <CardDescription className="text-base leading-relaxed">
                        {section.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Additional Resources */}
          <motion.div 
            className="text-center"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 p-8 rounded-xl border">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Build Amazing Forms?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join developers who are already using Formedible to create beautiful, 
                type-safe forms with minimal effort. Start with our getting started guide 
                and have your first form running in minutes.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link 
                  href="/docs/getting-started"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <Rocket className="w-4 h-4" />
                  Get Started
                </Link>
                <Link 
                  href="/docs/examples"
                  className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 px-6 py-3 rounded-lg font-medium border transition-colors"
                >
                  <Book className="w-4 h-4" />
                  View Examples
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}