"use client";

import { ArrowLeft, Zap, Code2, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { DocCard } from "@/components/doc-card";
import Link from "next/link";

export default function DynamicTextPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/docs">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Docs
                </Link>
              </Button>
            </div>

            <div className="text-center mb-8">
              <Badge variant="secondary" className="mb-4">
                <Sparkles className="w-3 h-3 mr-1" />
                Dynamic Text System
              </Badge>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent">
                Template Strings & Dynamic Text
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Create personalized form experiences with dynamic text that updates in real-time based on user input using simple template syntax.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Real-time Updates</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Code2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Simple Syntax</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Star className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Performance Optimized</span>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            {/* Basic Template Strings */}
            <DocCard
              title="Template String Syntax"
              description="Use {{fieldName}} syntax to reference form values in any text field."
              icon={Code2}
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Basic Usage</h3>
                  <CodeBlock
                    code={`const personalizedForm = useFormedible({
  fields: [
    // Collect user information
    { name: "firstName", type: "text", label: "First Name", page: 1 },
    { name: "lastName", type: "text", label: "Last Name", page: 1 },
    { name: "company", type: "text", label: "Company Name", page: 1 },
    
    // Use dynamic text for personalization
    { 
      name: "email", 
      type: "email", 
      label: "Email Address",
      description: "We'll send updates to this address, {{firstName}}",
      placeholder: "{{firstName}}.{{lastName}}@{{company}}.com",
      page: 2 
    },
  ],
  
  // Dynamic page titles and descriptions
  pages: [
    { page: 1, title: "Personal Information", description: "Tell us about yourself" },
    { page: 2, title: "Contact Details", description: "How can we reach you {{firstName}}?" }
  ]
});`}
                    language="tsx"
                  />
                </div>

                <div className="bg-gradient-to-r from-info/10 to-info/20 p-4 rounded-lg border border-info/30">
                  <h4 className="font-semibold text-info-foreground mb-2">✨ What happens:</h4>
                  <ul className="space-y-1 text-sm text-info-foreground/80">
                    <li>• When user types "John" in firstName, all {{"{"}firstName{"}"}} references update to "John"</li>
                    <li>• Description becomes: "We'll send updates to this address, John"</li>
                    <li>• Page 2 description becomes: "How can we reach you John?"</li>
                    <li>• Updates happen instantly as the user types</li>
                  </ul>
                </div>
              </div>
            </DocCard>

            {/* Supported Locations */}
            <DocCard
              title="Where Dynamic Text Works"
              description="Dynamic text can be used in all user-facing text throughout your forms."
              icon={Sparkles}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-primary">Field Properties</h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-medium">Labels</h4>
                      <code className="text-xs text-muted-foreground">label: "Welcome {{firstName}}"</code>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-medium">Descriptions</h4>
                      <code className="text-xs text-muted-foreground">description: "We'll contact {{firstName}} at {{email}}"</code>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-medium">Placeholders</h4>
                      <code className="text-xs text-muted-foreground">placeholder: "{{company}} department"</code>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-accent">Layout Elements</h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-accent pl-4">
                      <h4 className="font-medium">Page Titles</h4>
                      <code className="text-xs text-muted-foreground">title: "Settings for {{firstName}}"</code>
                    </div>
                    <div className="border-l-4 border-accent pl-4">
                      <h4 className="font-medium">Section Titles</h4>
                      <code className="text-xs text-muted-foreground">section: {"{"} title: "{{company}} Details" {"}"}</code>
                    </div>
                    <div className="border-l-4 border-accent pl-4">
                      <h4 className="font-medium">Object Field Titles</h4>
                      <code className="text-xs text-muted-foreground">objectConfig: {"{"} title: "{{firstName}}'s Address" {"}"}</code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <CodeBlock
                  code={`// All of these support dynamic text:
const comprehensiveForm = useFormedible({
  fields: [
    { name: "name", type: "text", label: "Full Name" },
    { 
      name: "preferences", 
      type: "checkbox", 
      label: "Marketing Preferences",
      description: "Customize your experience, {{name}}",
      section: {
        title: "Preferences for {{name}}",
        description: "These settings will be applied to {{name}}'s account"
      }
    },
    {
      name: "address",
      type: "object",
      objectConfig: {
        title: "{{name}}'s Address",
        description: "Where should we send {{name}}'s orders?",
        collapseLabel: "Hide {{name}}'s address",
        expandLabel: "Show {{name}}'s address"
      }
    }
  ],
  pages: [
    { 
      page: 1, 
      title: "Welcome {{name}}", 
      description: "Let's get {{name}} set up" 
    }
  ]
});`}
                  language="tsx"
                />
              </div>
            </DocCard>

            {/* Function-Based Dynamic Text */}
            <DocCard
              title="Function-Based Dynamic Text"
              description="For complex logic, use functions instead of template strings."
              icon={Zap}
            >
              <div className="space-y-6">
                <CodeBlock
                  code={`const advancedDynamicForm = useFormedible({
  fields: [
    { name: "userType", type: "select", options: ["individual", "business"] },
    { name: "firstName", type: "text", label: "First Name" },
    { name: "lastName", type: "text", label: "Last Name" },
    { name: "companyName", type: "text", label: "Company Name" },
    {
      name: "contactMethod",
      type: "select",
      
      // Function-based label with conditional logic
      label: (values) => {
        if (values.userType === "business") {
          const company = values.companyName || "your company";
          return \`How should we contact \${company}?\`;
        } else {
          const name = values.firstName || "you";
          return \`How should we contact \${name}?\`;
        }
      },
      
      // Function-based description
      description: (values) => {
        const entity = values.userType === "business" 
          ? (values.companyName || "your company")
          : (values.firstName || "you");
        
        return \`Choose the best way to reach \${entity}.\`;
      },
      
      options: ["email", "phone", "mail"]
    }
  ]
});`}
                  language="tsx"
                />

                <div className="bg-gradient-to-r from-success/10 to-success/20 p-4 rounded-lg border border-success/30">
                  <h4 className="font-semibold text-success-foreground mb-2">🎯 When to use functions:</h4>
                  <ul className="space-y-1 text-sm text-success-foreground/80">
                    <li>• Complex conditional logic based on multiple fields</li>
                    <li>• String formatting or transformations</li>
                    <li>• Pluralization or language variations</li>
                    <li>• When template strings aren't flexible enough</li>
                  </ul>
                </div>
              </div>
            </DocCard>

            {/* Performance & Best Practices */}
            <DocCard
              title="Performance & Best Practices"
              description="Understanding how dynamic text works under the hood and optimization tips."
              icon={Star}
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold text-primary">✅ Optimized Performance</h3>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• Uses TanStack Form subscriptions</li>
                      <li>• Only updates when referenced fields change</li>
                      <li>• Minimal re-renders with targeted subscriptions</li>
                      <li>• Efficient template parsing and caching</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-accent pl-4">
                    <h3 className="font-semibold text-accent">🛡️ Fallback Behavior</h3>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• Shows literal text when values are empty</li>
                      <li>• Gracefully handles missing field references</li>
                      <li>• Never breaks form functionality</li>
                      <li>• Works with conditional fields</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Best Practices</h3>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-success/5 to-success/10 p-4 rounded-lg border border-success/20">
                      <h4 className="font-medium text-success-foreground mb-2">✅ Do:</h4>
                      <ul className="text-sm text-success-foreground/80 space-y-1">
                        <li>• Keep template references simple: {{"{"}fieldName{"}"}} </li>
                        <li>• Use meaningful fallback text</li>
                        <li>• Test with empty and populated forms</li>
                        <li>• Consider mobile screen space with dynamic text</li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-r from-destructive/5 to-destructive/10 p-4 rounded-lg border border-destructive/20">
                      <h4 className="font-medium text-destructive-foreground mb-2">❌ Avoid:</h4>
                      <ul className="text-sm text-destructive-foreground/80 space-y-1">
                        <li>• Referencing fields that might not exist</li>
                        <li>• Very long dynamic text that breaks layouts</li>
                        <li>• Complex nested object references</li>
                        <li>• Sensitive information in template strings</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </DocCard>

            {/* Real-World Examples */}
            <DocCard
              title="Real-World Examples"
              description="Common use cases and patterns for dynamic text in forms."
              icon={Code2}
            >
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Multi-Step Registration</h3>
                  <CodeBlock
                    code={`const registrationForm = useFormedible({
  fields: [
    // Step 1: Basic Info
    { name: "firstName", type: "text", label: "First Name", page: 1 },
    { name: "email", type: "email", label: "Email Address", page: 1 },
    
    // Step 2: Personalized Experience
    { 
      name: "preferences", 
      type: "multiSelect", 
      label: "Preferences",
      description: "What would {{firstName}} like to receive?",
      page: 2 
    },
    { 
      name: "notifications", 
      type: "switch", 
      label: "Email Notifications",
      description: "Send updates to {{email}}?",
      page: 2 
    }
  ],
  
  pages: [
    { page: 1, title: "Join Us", description: "Create your account" },
    { 
      page: 2, 
      title: "Welcome {{firstName}}!", 
      description: "Let's personalize your experience" 
    }
  ]
});`}
                    language="tsx"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">E-commerce Checkout</h3>
                  <CodeBlock
                    code={`const checkoutForm = useFormedible({
  fields: [
    { name: "customerName", type: "text", label: "Full Name" },
    { name: "shippingAddress", type: "textarea", label: "Shipping Address" },
    { 
      name: "billingAddress", 
      type: "textarea", 
      label: "Billing Address",
      description: "Where should we send {{customerName}}'s invoice?"
    },
    {
      name: "deliveryInstructions",
      type: "textarea",
      label: "Delivery Instructions",
      placeholder: "Special instructions for delivering to {{customerName}}...",
      section: {
        title: "Delivery Details for {{customerName}}",
        description: "Help us deliver {{customerName}}'s order successfully"
      }
    }
  ]
});`}
                    language="tsx"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Customer Support Form</h3>
                  <CodeBlock
                    code={`const supportForm = useFormedible({
  fields: [
    { name: "customerName", type: "text", label: "Your Name" },
    { name: "issueType", type: "select", 
      options: ["Technical", "Billing", "General"] },
    {
      name: "description",
      type: "textarea",
      label: (values) => {
        const type = values.issueType || "issue";
        return \`Describe your \${type.toLowerCase()} concern\`;
      },
      description: (values) => {
        const name = values.customerName || "you";
        const type = values.issueType || "issue";
        return \`Help us understand \${name}'s \${type.toLowerCase()} so we can assist better.\`;
      }
    }
  ]
});`}
                    language="tsx"
                  />
                </div>
              </div>
            </DocCard>
          </div>
        </div>
      </div>
    </div>
  );
}