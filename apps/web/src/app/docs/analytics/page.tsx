import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Form Analytics - Formedible",
  description: "Track user interactions, form completion rates, and performance metrics with Formedible's built-in analytics system.",
};

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Form Analytics</h1>
          <p className="text-lg text-muted-foreground">
            Track user behavior, measure form performance, and gain insights into how users interact 
            with your forms using Formedible's comprehensive analytics system.
          </p>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Overview</h2>
            <p className="mb-4">
              Formedible provides built-in analytics that track various user interactions and form events. 
              All analytics are optional and can be customized to fit your specific tracking needs.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Field Interactions</h3>
                <p className="text-sm text-muted-foreground">
                  Track focus, blur, and change events for individual fields with timing data.
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Form Completion</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor form start, completion, and abandonment with completion percentages.
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Page Navigation</h3>
                <p className="text-sm text-muted-foreground">
                  Track page changes in multi-step forms with time spent on each page.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Basic Setup</h2>
            <p className="mb-4">
              Enable analytics by adding an <code>analytics</code> configuration with event handlers:
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Basic Example</h3>
              <pre className="text-sm overflow-x-auto">
{`const { Form } = useFormedible({
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
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Available Events</h2>
            
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Complete Analytics Configuration</h3>
                <pre className="text-sm overflow-x-auto">
{`analytics: {
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
  
  onFormAbandon: (completionPercentage: number) => {
    // Called when user leaves without completing
    analytics.track('form_abandoned', { 
      completion: completionPercentage 
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
  
  // Multi-page form events
  onPageChange: (fromPage: number, toPage: number, timeSpent: number) => {
    // Called when navigating between pages
    analytics.track('page_changed', { 
      from: fromPage, 
      to: toPage, 
      duration: timeSpent 
    });
  }
}`}
                </pre>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Integration Examples</h2>
            
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Google Analytics 4</h3>
                <pre className="text-sm overflow-x-auto">
{`analytics: {
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
                </pre>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Custom Analytics Service</h3>
                <pre className="text-sm overflow-x-auto">
{`// Custom analytics service
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
                </pre>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Mixpanel Integration</h3>
                <pre className="text-sm overflow-x-auto">
{`import mixpanel from 'mixpanel-browser';

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
                </pre>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Performance Metrics</h2>
            <p className="mb-4">
              Use analytics data to calculate important form performance metrics:
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{`// Example metrics calculation
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
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Privacy Considerations</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold">Data Sensitivity</h3>
                <p className="text-sm text-muted-foreground">
                  Be careful not to track sensitive field values. Consider tracking field interactions without actual values.
                </p>
              </div>
              
              <div className="border-l-4 border-accent pl-4">
                <h3 className="font-semibold">User Consent</h3>
                <p className="text-sm text-muted-foreground">
                  Ensure you have proper user consent before tracking form interactions, especially in GDPR regions.
                </p>
              </div>
              
              <div className="border-l-4 border-secondary pl-4">
                <h3 className="font-semibold">Data Anonymization</h3>
                <p className="text-sm text-muted-foreground">
                  Consider anonymizing or hashing user data before sending to analytics services.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-muted pl-4">
                <h3 className="font-semibold">Selective Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Only implement the analytics events you actually need to avoid data overload.
                </p>
              </div>
              
              <div className="border-l-4 border-destructive pl-4">
                <h3 className="font-semibold">Error Handling</h3>
                <p className="text-sm text-muted-foreground">
                  Wrap analytics calls in try-catch blocks to prevent tracking errors from breaking your form.
                </p>
              </div>
              
              <div className="border-l-4 border-indigo-500 pl-4">
                <h3 className="font-semibold">Performance</h3>
                <p className="text-sm text-muted-foreground">
                  Use debouncing for high-frequency events like field changes to avoid overwhelming your analytics service.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}