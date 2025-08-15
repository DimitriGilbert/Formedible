"use client";

import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  BarChart3,
  Activity,
  Settings,
  Zap,
  Users,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocCard } from "@/components/doc-card";
import { CodeBlock } from "@/components/ui/code-block";
import Link from "next/link";
import { useTheme } from "next-themes";

export default function AnalyticsPage() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const darkMode = currentTheme === 'dark';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto">
          {/* Header */}
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
                <BarChart3 className="w-3 h-3 mr-1" />
                Form Analytics
              </Badge>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent">
                Track User Behavior & Performance
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Track user behavior, measure form performance, and gain insights
                into how users interact with your forms using Formedible's
                comprehensive analytics system.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">User Tracking</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Performance Metrics</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Event System</span>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <DocCard
              title="Overview"
              description="Comprehensive analytics that track user interactions and form performance."
              icon={BarChart3}
            >
              <p className="text-muted-foreground mb-6">
                Formedible provides built-in analytics that track various user
                interactions and form events. All analytics are optional and can
                be customized to fit your specific tracking needs.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 bg-gradient-to-br from-primary/3 to-transparent">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Field Interactions
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Track focus, blur, and change events for individual fields
                    with timing data.
                  </p>
                </div>

                <div className="border rounded-lg p-4 bg-gradient-to-br from-primary/3 to-transparent">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Form Completion
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor form start, completion, and abandonment with
                    completion percentages.
                  </p>
                </div>

                <div className="border rounded-lg p-4 bg-gradient-to-br from-primary/3 to-transparent">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Page Navigation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Track page changes in multi-step forms with time spent and
                    completion context.
                  </p>
                </div>

                <div className="border rounded-lg p-4 bg-gradient-to-br from-primary/3 to-transparent">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Performance Metrics
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor form rendering and submission performance with
                    detailed timing data.
                  </p>
                </div>

                <div className="border rounded-lg p-4 bg-gradient-to-br from-primary/3 to-transparent">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-primary" />
                    Enhanced Context
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    All events include rich metadata like validation errors and
                    completion states.
                  </p>
                </div>
              </div>
            </DocCard>

            <DocCard
              title="Basic Setup"
              description="Enable analytics by adding an analytics configuration with event handlers."
              icon={Settings}
            >
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  Enable analytics by adding an{" "}
                  <code className="bg-muted px-1 py-0.5 rounded text-sm">
                    analytics
                  </code>{" "}
                  configuration with event handlers:
                </p>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Basic Example</h3>
                  <CodeBlock
                    code={`const { Form } = useFormedible({
  fields: [
    { name: 'email', type: 'email', label: 'Email' },
    { name: 'name', type: 'text', label: 'Name' },
  ],
  analytics: {
    onFormStart: (timestamp) => {
      console.log('Form started at:', new Date(timestamp));
    },
    onFieldFocus: (fieldName, timestamp) => {
      console.log(\`Field \${fieldName} focused at:\`, new Date(timestamp));
    },
    onFieldBlur: (fieldName, timeSpent) => {
      console.log(\`User spent \${timeSpent}ms on \${fieldName}\`);
    },
    onFormComplete: (timeSpent, formData) => {
      console.log(\`Form completed in \${timeSpent}ms\`, formData);
    }
  }
});`}
                    language="tsx"
                    darkMode={darkMode}
                  />
                </div>
              </div>
            </DocCard>

            <DocCard
              title="Available Events"
              description="Complete reference of all analytics events available in Formedible."
              icon={Activity}
            >
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Complete Analytics Configuration
                  </h3>
                  <CodeBlock
                    code={`analytics: {
  // Form lifecycle events
  onFormStart: (timestamp: number) => {
    // Called when form is first rendered
    analytics.track('form_started', { timestamp });
  },
  
  onFormComplete: (timeSpent: number, formData: any) => {
    // Called when form is successfully submitted
    analytics.track('form_completed', { 
      duration: timeSpent,
      data: formData 
    });
  },
  
  onFormAbandon: (completionPercentage: number, context?: any) => {
    // FIXED: Only fires on actual page leave, not form navigation
    // Called when user leaves without completing
    analytics.track('form_abandoned', { 
      completion: completionPercentage,
      currentPage: context?.currentPage,
      currentTab: context?.currentTab,
      lastActiveField: context?.lastActiveField
    });
  },
  
  // Field interaction events
  onFieldFocus: (fieldName: string, timestamp: number) => {
    // Called when a field receives focus
    analytics.track('field_focused', { 
      field: fieldName, 
      timestamp 
    });
  },
  
  onFieldBlur: (fieldName: string, timeSpent: number) => {
    // Called when a field loses focus
    analytics.track('field_blurred', { 
      field: fieldName, 
      duration: timeSpent 
    });
  },
  
  onFieldChange: (fieldName: string, value: any, timestamp: number) => {
    // Called when field value changes
    analytics.track('field_changed', { 
      field: fieldName, 
      value, 
      timestamp 
    });
  },
  
  onFieldError: (fieldName: string, errors: string[], timestamp: number) => {
    // Called when field validation errors occur
    analytics.track('field_error', { 
      field: fieldName, 
      errorCount: errors.length,
      firstError: errors[0],
      timestamp 
    });
  },
  
  onFieldComplete: (fieldName: string, isValid: boolean, timeSpent: number) => {
    // Called when field is successfully completed
    analytics.track('field_complete', { 
      field: fieldName, 
      isValid, 
      timeSpent 
    });
  },
  
  // Multi-page form events
  onPageChange: (fromPage: number, toPage: number, timeSpent: number, pageContext?: any) => {
    // Called when navigating between pages with rich context
    analytics.track('page_changed', { 
      from: fromPage, 
      to: toPage, 
      duration: timeSpent,
      hasErrors: pageContext?.hasErrors,
      completionPercentage: pageContext?.completionPercentage
    });
  },
  
  // Tab-based form events
  onTabChange: (fromTab: string, toTab: string, timeSpent: number, tabContext?: any) => {
    // Called when navigating between tabs
    analytics.track('tab_changed', { 
      fromTab, 
      toTab, 
      duration: timeSpent,
      completionPercentage: tabContext?.completionPercentage,
      hasErrors: tabContext?.hasErrors
    });
  },
  
  onTabFirstVisit: (tabId: string, timestamp: number) => {
    // Called when a tab is visited for the first time
    analytics.track('tab_first_visit', { 
      tabId, 
      timestamp 
    });
  },
  
  // Performance tracking
  onSubmissionPerformance: (totalTime: number, validationTime: number, processingTime: number) => {
    // Called after form submission to track performance
    analytics.track('form_performance', {
      totalTime,
      validationTime,
      processingTime,
      efficiency: (processingTime / totalTime) * 100
    });
  }
}`}
                    language="tsx"
                    darkMode={darkMode}
                  />
                </div>
              </div>
            </DocCard>

            <DocCard
              title="Integration Examples"
              description="Real-world examples of integrating with popular analytics services."
              icon={Zap}
            >
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Google Analytics 4
                  </h3>
                  <CodeBlock
                    code={`analytics: {
  onFormStart: (timestamp) => {
    gtag('event', 'form_start', {
      form_name: 'contact_form',
      timestamp: timestamp
    });
  },
  
  onFormComplete: (timeSpent, formData) => {
    gtag('event', 'form_submit', {
      form_name: 'contact_form',
      engagement_time_msec: timeSpent,
      value: 1
    });
  },
  
  onFormAbandon: (completionPercentage) => {
    gtag('event', 'form_abandon', {
      form_name: 'contact_form',
      completion_percentage: completionPercentage
    });
  }
}`}
                    language="tsx"
                    darkMode={darkMode}
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Custom Analytics Service
                  </h3>
                  <CodeBlock
                    code={`// Custom analytics service
class FormAnalytics {
  static track(event: string, data: any) {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data, timestamp: Date.now() })
    });
  }
}

// Usage in form
analytics: {
  onFieldFocus: (fieldName, timestamp) => {
    FormAnalytics.track('field_focus', { 
      field: fieldName, 
      timestamp 
    });
  },
  
  onFieldBlur: (fieldName, timeSpent) => {
    FormAnalytics.track('field_blur', { 
      field: fieldName, 
      time_spent: timeSpent 
    });
  }
}`}
                    language="tsx"
                    darkMode={darkMode}
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Mixpanel Integration
                  </h3>
                  <CodeBlock
                    code={`import mixpanel from 'mixpanel-browser';

analytics: {
  onFormStart: (timestamp) => {
    mixpanel.track('Form Started', {
      form_id: 'registration_form',
      timestamp: timestamp
    });
  },
  
  onFieldChange: (fieldName, value, timestamp) => {
    mixpanel.track('Field Changed', {
      field_name: fieldName,
      field_value: typeof value === 'string' ? value.length : value,
      timestamp: timestamp
    });
  },
  
  onPageChange: (fromPage, toPage, timeSpent) => {
    mixpanel.track('Page Changed', {
      from_page: fromPage,
      to_page: toPage,
      time_on_page: timeSpent
    });
  }
}`}
                    language="tsx"
                    darkMode={darkMode}
                  />
                </div>
              </div>
            </DocCard>

            <DocCard
              title="Performance Metrics"
              description="Use analytics data to calculate important form performance metrics."
              icon={TrendingUp}
            >
              <CodeBlock
                code={`// Example metrics calculation
class FormMetrics {
  private startTime: number = 0;
  private fieldTimes: Record<string, number> = {};
  
  analytics = {
    onFormStart: (timestamp: number) => {
      this.startTime = timestamp;
    },
    
    onFieldBlur: (fieldName: string, timeSpent: number) => {
      this.fieldTimes[fieldName] = timeSpent;
      
      // Calculate average time per field
      const avgTime = Object.values(this.fieldTimes)
        .reduce((sum, time) => sum + time, 0) / Object.keys(this.fieldTimes).length;
      
      console.log(\`Average time per field: \${avgTime}ms\`);
    },
    
    onFormComplete: (timeSpent: number, formData: any) => {
      const completionRate = this.calculateCompletionRate();
      const fieldsCompleted = Object.keys(formData).length;
      
      console.log('Form Metrics:', {
        totalTime: timeSpent,
        completionRate,
        fieldsCompleted,
        avgTimePerField: timeSpent / fieldsCompleted
      });
    }
  };
  
  private calculateCompletionRate(): number {
    // Implementation depends on your tracking system
    return 0.85; // 85% completion rate
  }
}`}
                language="tsx"
                darkMode={darkMode}
              />
            </DocCard>

            <DocCard
              title="Recent Improvements"
              description="Latest enhancements to the analytics system for better insights."
              icon={Clock}
            >
              <div className="space-y-4">
                <div className="border-l-4 border-success pl-4 bg-success/10 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-success">
                    Fixed Abandonment Tracking
                  </h3>
                  <p className="text-sm text-success/80">
                    The{" "}
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                      onFormAbandon
                    </code>{" "}
                    event now only fires when users actually leave the page, not
                    when navigating between form pages or tabs. This provides
                    accurate abandonment metrics.
                  </p>
                </div>

                <div className="border-l-4 border-info pl-4 bg-info/10 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-info">
                    Enhanced Context Data
                  </h3>
                  <p className="text-sm text-info/80">
                    All analytics events now include rich contextual information
                    like validation errors, completion percentages, and
                    performance metrics for better insights.
                  </p>
                </div>

                <div className="border-l-4 border-accent pl-4 bg-accent/10 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-accent">
                    Performance Tracking
                  </h3>
                  <p className="text-sm text-accent/80">
                    New performance metrics track form rendering, validation,
                    and submission times to help optimize user experience.
                  </p>
                </div>
              </div>
            </DocCard>

            <DocCard
              title="Privacy Considerations"
              description="Important privacy guidelines when implementing form analytics."
              icon={Settings}
            >
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold">Data Sensitivity</h3>
                  <p className="text-sm text-muted-foreground">
                    Be careful not to track sensitive field values. Consider
                    tracking field interactions without actual values.
                  </p>
                </div>

                <div className="border-l-4 border-accent pl-4">
                  <h3 className="font-semibold">User Consent</h3>
                  <p className="text-sm text-muted-foreground">
                    Ensure you have proper user consent before tracking form
                    interactions, especially in GDPR regions.
                  </p>
                </div>

                <div className="border-l-4 border-secondary pl-4">
                  <h3 className="font-semibold">Data Anonymization</h3>
                  <p className="text-sm text-muted-foreground">
                    Consider anonymizing or hashing user data before sending to
                    analytics services.
                  </p>
                </div>
              </div>
            </DocCard>

            <DocCard
              title="Best Practices"
              description="Guidelines for effective form analytics implementation."
              icon={TrendingUp}
            >
              <div className="space-y-4">
                <div className="border-l-4 border-muted pl-4">
                  <h3 className="font-semibold">Selective Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Only implement the analytics events you actually need to
                    avoid data overload.
                  </p>
                </div>

                <div className="border-l-4 border-destructive pl-4">
                  <h3 className="font-semibold">Error Handling</h3>
                  <p className="text-sm text-muted-foreground">
                    Wrap analytics calls in try-catch blocks to prevent tracking
                    errors from breaking your form.
                  </p>
                </div>

                <div className="border-l-4 border-info pl-4">
                  <h3 className="font-semibold">Performance</h3>
                  <p className="text-sm text-muted-foreground">
                    Use debouncing for high-frequency events like field changes
                    to avoid overwhelming your analytics service.
                  </p>
                </div>
              </div>
            </DocCard>
          </div>
        </div>
      </div>
    </div>
  );
}
