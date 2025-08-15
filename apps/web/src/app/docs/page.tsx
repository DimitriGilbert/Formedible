"use client";

import React from "react";
import { motion } from "motion/react";
import {
  Book,
  Code,
  Zap,
  Sparkles,
  Rocket,
  Shield,
  Layers,
  Database,
  CheckCircle,
  BarChart3,
  Wrench,
  Settings,
} from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CodeBlock } from "@/components/ui/code-block";

export default function DocsPage() {
  const [origin, setOrigin] = React.useState("");

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const installCommand = `npx shadcn@latest add ${
    origin || "https://formedible.dev"
  }/r/use-formedible.json`;
  
  const docSections = [
    {
      title: "Getting Started",
      description:
        "Install Formedible and create your first form in under 5 minutes",
      icon: Rocket,
      href: "/docs/getting-started",
      color: "text-primary",
      badge: "Start Here",
    },
    {
      title: "Field Types",
      description:
        "Explore 20+ pre-built field components with advanced features like custom visualizations",
      icon: Layers,
      href: "/docs/fields",
      color: "text-accent",
      badge: "Popular",
    },
    {
      title: "Advanced Fields",
      description:
        "Specialized field types including location picker, duration input, and masked fields",
      icon: Settings,
      href: "/docs/advanced-fields",
      color: "text-info",
      badge: "Pro",
    },
    {
      title: "Validation",
      description:
        "Cross-field validation, async validation, and advanced validation patterns",
      icon: CheckCircle,
      href: "/docs/validation",
      color: "text-success",
      badge: null,
    },
    {
      title: "Dynamic Text",
      description:
        "Template strings with {{fieldName}} syntax for personalized form experiences",
      icon: Sparkles,
      href: "/docs/dynamic-text",
      color: "text-primary",
      badge: "New",
    },
    {
      title: "Analytics",
      description:
        "Track user interactions, form completion rates, and performance metrics",
      icon: BarChart3,
      href: "/docs/analytics",
      color: "text-accent",
      badge: "Enhanced",
    },
    {
      title: "Persistence",
      description:
        "Auto-save form data to browser storage with configurable options",
      icon: Database,
      href: "/docs/persistence",
      color: "text-info",
      badge: null,
    },
    {
      title: "Builder",
      description:
        "Visual form builder with modular tab system for creating forms interactively",
      icon: Wrench,
      href: "/docs/builder",
      color: "text-secondary",
      badge: "Interactive",
    },
    {
      title: "Advanced Features",
      description:
        "Multi-page forms, conditional logic, and complex form scenarios",
      icon: Sparkles,
      href: "/docs/advanced-features",
      color: "text-accent",
      badge: "Overview",
    },
    {
      title: "API Reference",
      description:
        "Complete documentation of hooks, props, and configuration options",
      icon: Code,
      href: "/docs/api",
      color: "text-muted-foreground",
      badge: null,
    },
    {
      title: "Examples",
      description:
        "Real-world form implementations from simple to complex use cases",
      icon: Book,
      href: "/docs/examples",
      color: "text-warning",
      badge: null,
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "Type-Safe",
      description: "Built with TypeScript and Zod for complete type safety",
    },
    {
      icon: Zap,
      title: "Zero Config",
      description: "Works out of the box with sensible defaults",
    },
    {
      icon: Sparkles,
      title: "Beautiful UI",
      description: "Powered by shadcn/ui components",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
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
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent">
                Forms cooked just "A Point" for you to use
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Formedible combines the power of TanStack Form v1 with beautiful
                shadcn/ui components. Create schema-driven forms with
                validation, multi-step flows, analytics tracking, form persistence,
                and advanced custom visualizations in minutes.
              </p>
            </motion.div>

            {/* Feature Pills */}
            <motion.div
              className="flex flex-wrap justify-center gap-4 mb-12"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-center gap-2 bg-card px-4 py-2 rounded-full border shadow-sm"
                >
                  <feature.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{feature.title}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {feature.description}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Quick Install */}
            <motion.div
              className="bg-gradient-to-r from-primary/5 to-muted-foreground/5 p-6 rounded-xl border mb-16"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-primary">
                  Quick Install
                </h3>
              </div>
              <div className="bg-muted rounded-lg p-4 max-w-2xl mx-auto">
                <CodeBlock
                  code={installCommand}
                  language="bash"
                  showPackageManagerTabs={true}
                />
              </div>
              <p className="text-sm text-foreground mt-3">
                One command installs everything you need to get started
              </p>
            </motion.div>
          </div>

          {/* Documentation Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
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
                    <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/20 relative overflow-hidden">                    {section.badge && (
                      <Badge className="absolute top-4 right-4 bg-primary hover:bg-primary/80">
                        {section.badge}
                      </Badge>
                    )}
                    <CardHeader className="pb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`p-2 rounded-lg bg-gradient-to-br from-primary/8 to-muted-foreground/8 border`}
                        >
                          <section.icon
                            className={`w-6 h-6 ${section.color}`}
                          />
                        </div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
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
            <div className="bg-gradient-to-r from-primary/5 to-muted-foreground/5 p-8 rounded-xl border">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Build Amazing Forms?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join developers who are already using Formedible to create
                beautiful, type-safe forms with minimal effort. Start with our
                getting started guide and have your first form running in
                minutes.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/docs/getting-started"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <Rocket className="w-4 h-4" />
                  Get Started
                </Link>
                <Link
                  href="/docs/examples"
                  className="inline-flex items-center gap-2 bg-card hover:bg-card/80 text-card-foreground px-6 py-3 rounded-lg font-medium border transition-colors"
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
