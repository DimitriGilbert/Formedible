"use client";

import React from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import { toast } from "sonner";
import { EnergyRatingComponent } from "@/components/examples/energy-rating-component";

export const advancedFieldTypesSchema = z.object({
  satisfaction: z.number().min(1).max(5),
  phoneNumber: z.string().min(1, "Phone number is required"),
  favoriteColor: z.string().min(1, "Please select a color"),
  workLocation: z
    .object({
      lat: z.number(),
      lng: z.number(),
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  workDuration: z
    .object({
      hours: z.number().min(0),
      minutes: z.number().min(0),
    })
    .optional(),
  skills: z.array(z.string()).min(1, "Select at least one skill"),
  experienceLevel: z.number().min(1).max(10),
  energyRating: z.number().min(1).max(5),
  performanceLevel: z.number().min(0).max(100),
  speedometer: z.number().min(0).max(200),
  birthDate: z.date(),
  resume: z.any().optional(),
  aboutMe: z
    .string()
    .min(50, "Please write at least 50 characters about yourself"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  workEmail: z.string().email("Valid work email required"),
  overallRating: z.number().min(1).max(5),
});

// Beautiful Speedometer Visualization Component
const SpeedometerComponent: React.FC<{
  value: number;
  displayValue: string | number;
  label?: string;
  isActive: boolean;
}> = ({ value, displayValue, isActive }) => {
  // Calculate the rotation angle (0-200 range mapped to -90 to +90 degrees)
  const angle = ((value / 200) * 180) - 90;
  
  // Get color based on speed
  const getColor = (speed: number) => {
    if (speed < 60) return "#22c55e"; // Green
    if (speed < 120) return "#eab308"; // Yellow
    return "#ef4444"; // Red
  };

  return (
    <div className={`relative w-16 h-12 transition-all duration-300 ${isActive ? 'scale-110' : ''}`}>
      {/* Speedometer Arc */}
      <div className="absolute inset-0">
        <svg viewBox="0 0 64 32" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 8 24 A 24 24 0 0 1 56 24"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="3"
            className="opacity-30"
          />
          {/* Active arc */}
          <path
            d="M 8 24 A 24 24 0 0 1 56 24"
            fill="none"
            stroke={getColor(value)}
            strokeWidth="3"
            strokeDasharray={`${(value / 200) * 75.4} 75.4`}
            className="transition-all duration-300"
          />
          {/* Needle */}
          <line
            x1="32"
            y1="24"
            x2="32"
            y2="8"
            stroke={getColor(value)}
            strokeWidth="2"
            transform={`rotate(${angle} 32 24)`}
            className="transition-transform duration-300"
          />
          {/* Center dot */}
          <circle cx="32" cy="24" r="2" fill={getColor(value)} />
        </svg>
      </div>
      
      {/* Speed value */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
        <span className="text-xs font-bold" style={{ color: getColor(value) }}>
          {displayValue}
        </span>
      </div>
      
      {/* Glow effect when active */}
      {isActive && (
        <div 
          className="absolute inset-0 -m-1 rounded-lg opacity-20 animate-pulse" 
          style={{ backgroundColor: getColor(value) }} 
        />
      )}
    </div>
  );
};

// Enhanced Energy Rating Visualization Component (using imported component)
const LocalEnergyRatingComponent: React.FC<{
  value: number;
  displayValue: string | number;
  label?: string;
  isActive: boolean;
}> = ({ value, displayValue, label, isActive }) => {
  // Map numeric values to letter ratings for the DPE component
  const mapValueToRating = (numValue: number): string => {
    switch (numValue) {
      case 1: return 'G';
      case 2: return 'F';
      case 3: return 'D';
      case 4: return 'B';
      case 5: return 'A';
      default: return 'D';
    }
  };

  return (
    <EnergyRatingComponent
      displayValue={mapValueToRating(value)}
      isActive={isActive}
      colorScheme="dpe"
    />
  );
};

export const advancedFieldTypesFormCode = `const advancedFieldTypesSchema = z.object({
  satisfaction: z.number().min(1).max(5),
  phoneNumber: z.string().min(1, "Phone number is required"),
  favoriteColor: z.string().min(1, "Please select a color"),
  workLocation: z
    .object({
      lat: z.number(),
      lng: z.number(),
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  workDuration: z
    .object({
      hours: z.number().min(0),
      minutes: z.number().min(0),
    })
    .optional(),
  skills: z.array(z.string()).min(1, "Select at least one skill"),
  experienceLevel: z.number().min(1).max(10),
  energyRating: z.number().min(1).max(5),
  performanceLevel: z.number().min(0).max(100),
  birthDate: z.date(),
  resume: z.any().optional(),
  aboutMe: z
    .string()
    .min(50, "Please write at least 50 characters about yourself"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  workEmail: z.string().email("Valid work email required"),
  overallRating: z.number().min(1).max(5),
});

// Memoized search callback for location
const locationSearchCallback = React.useCallback(
  async (query: string, options: any = {}) => {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: String(options.limit || 5),
      addressdetails: "1",
    });

    try {
      const response = await fetch(
        \`https://nominatim.openstreetmap.org/search?\${params}\`
      );
      const data = await response.json();

      return data.map((item: any, index: number) => ({
        id: item.place_id || index,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        address: item.display_name,
        city:
          item.address?.city || item.address?.town || item.address?.village,
        state: item.address?.state,
        country: item.address?.country,
        postalCode: item.address?.postcode,
        relevance: parseFloat(item.importance || 0),
      }));
    } catch (error) {
      console.error("Location search error:", error);
      return [];
    }
  },
  []
);

// Memoized location config
const locationConfig = React.useMemo(
  () => ({
    defaultLocation: { lat: 51.5074, lng: -0.1278 },
    zoom: 12,
    enableSearch: true,
    enableGeolocation: true,
    enableManualEntry: true,
    showMap: true,
    mapProvider: "openstreetmap" as const,
    searchPlaceholder: "Search for your work location...",
    searchOptions: {
      debounceMs: 300,
      minQueryLength: 3,
      maxResults: 5,
    },
    ui: {
      showCoordinates: true,
      showAddress: true,
      mapHeight: 400,
      coordinatesFormat: "decimal" as const,
    },
    searchCallback: locationSearchCallback,
  }),
  [locationSearchCallback]
);

const advancedFieldTypesForm = useFormedible({
  schema: advancedFieldTypesSchema,
  fields: [
    {
      name: "satisfaction",
      type: "rating",
      label: "How satisfied are you with our service?",
      section: {
        title: "Feedback & Ratings",
        description: "Rate your experience",
      },
      ratingConfig: {
        max: 5,
        allowHalf: true,
        icon: "star",
        size: "lg",
        showValue: true,
      },
    },
    {
      name: "overallRating",
      type: "rating",
      label: "Overall Experience",
      ratingConfig: {
        max: 5,
        allowHalf: false,
        icon: "heart",
        size: "md",
        showValue: true,
      },
    },
    {
      name: "phoneNumber",
      type: "phone",
      label: "Phone Number",
      section: {
        title: "Contact Information",
        description: "How can we reach you?",
      },
      phoneConfig: {
        defaultCountry: "US",
        format: "international",
      },
    },
    {
      name: "favoriteColor",
      type: "colorPicker",
      label: "Brand Color",
      colorConfig: {
        format: "hex",
        showPreview: true,
        presetColors: [
          "#ff0000",
          "#00ff00",
          "#0000ff",
          "#ffff00",
          "#ff00ff",
          "#00ffff",
          "#000000",
          "#ffffff",
          "#808080",
          "#800000",
          "#008000",
          "#000080",
        ],
        allowCustom: true,
      },
    },
    {
      name: "workLocation",
      type: "location",
      label: "Work Location",
      section: {
        title: "Location & Preferences",
        description: "Where do you work and your preferences",
      },
      locationConfig: locationConfig,
    },
    {
      name: "workDuration",
      type: "duration",
      label: "Daily Work Hours",
      durationConfig: {
        format: "hm",
        maxHours: 24,
        showLabels: true,
        allowNegative: false,
      },
    },
    {
      name: "skills",
      type: "multiSelect",
      label: "Technical Skills",
      options: [
        { value: "javascript", label: "JavaScript" },
        { value: "typescript", label: "TypeScript" },
        { value: "react", label: "React" },
        { value: "vue", label: "Vue.js" },
        { value: "angular", label: "Angular" },
        { value: "nodejs", label: "Node.js" },
        { value: "python", label: "Python" },
        { value: "java", label: "Java" },
      ],
      multiSelectConfig: {
        searchable: true,
        creatable: true,
        maxSelections: 8,
        placeholder: "Select or type your skills...",
      },
    },
    {
      name: "experienceLevel",
      type: "slider",
      label: "Experience Level (1-10)",
      section: {
        title: "Professional Background",
        description: "Your experience and background",
      },
      sliderConfig: {
        min: 1,
        max: 10,
        step: 1,
        marks: [
          { value: 1, label: "Beginner" },
          { value: 5, label: "Intermediate" },
          { value: 10, label: "Expert" },
        ],
        showTooltip: true,
        showValue: true,
        orientation: "horizontal",
      },
    },
    {
      name: "energyRating",
      type: "slider",
      label: "Energy Efficiency Rating",
      section: {
        title: "Advanced Sliders",
        description: "Enhanced slider examples with custom visualizations",
      },
      sliderConfig: {
        min: 1,
        max: 5,
        step: 1,
        valueMapping: [
          { sliderValue: 1, displayValue: "E", label: "Poor" },
          { sliderValue: 2, displayValue: "D", label: "Fair" },
          { sliderValue: 3, displayValue: "C", label: "Good" },
          { sliderValue: 4, displayValue: "B", label: "Very Good" },
          { sliderValue: 5, displayValue: "A", label: "Excellent" },
        ],
        visualizationComponent: LocalEnergyRatingComponent,
        showValue: true,
      },
    },
    {
      name: "performanceLevel",
      type: "slider",
      label: "Performance Level",
      sliderConfig: {
        min: 0,
        max: 100,
        step: 10,
        gradientColors: {
          start: "#ef4444",
          end: "#22c55e",
          direction: "horizontal",
        },
        valueLabelSuffix: "%",
        showValue: true,
        marks: [
          { value: 0, label: "Low" },
          { value: 50, label: "Medium" },
          { value: 100, label: "High" },
        ],
      },
    },
    {
      name: "speedometer",
      type: "slider", 
      label: "Speed Test",
      description: "Interactive speedometer with custom visualization",
      section: {
        title: "Advanced Sliders",
        description: "Enhanced slider examples with custom visualizations",
      },
      sliderConfig: {
        min: 0,
        max: 200,
        step: 10,
        valueMapping: [
          { sliderValue: 0, displayValue: "0", label: "Idle" },
          { sliderValue: 40, displayValue: "40", label: "Slow" },
          { sliderValue: 80, displayValue: "80", label: "Cruise" },
          { sliderValue: 120, displayValue: "120", label: "Fast" },
          { sliderValue: 160, displayValue: "160", label: "Speed" },
          { sliderValue: 200, displayValue: "200", label: "MAX!" },
        ],
        visualizationComponent: SpeedometerComponent,
        valueLabelSuffix: " km/h",
        showValue: true,
      },
    },
    {
      name: "birthDate",
      type: "date",
      label: "Date of Birth",
      dateConfig: {
        format: "MM/dd/yyyy",
        maxDate: new Date(),
        minDate: new Date(1900, 0, 1),
        showTime: false,
      },
    },
    {
      name: "resume",
      type: "file",
      label: "Upload Resume",
      fileConfig: {
        accept: ".pdf,.doc,.docx",
        multiple: false,
        maxSize: 5 * 1024 * 1024,
        maxFiles: 1,
      },
    },
    {
      name: "aboutMe",
      type: "textarea",
      label: "About Me",
      textareaConfig: {
        rows: 6,
        resize: "vertical",
        maxLength: 1000,
        showWordCount: true,
      },
    },
    {
      name: "password",
      type: "password",
      label: "Password",
      section: {
        title: "Security",
        description: "Account security settings",
      },
      passwordConfig: {
        showToggle: true,
        strengthMeter: true,
        minStrength: 3,
      },
    },
    {
      name: "workEmail",
      type: "email",
      label: "Work Email",
    },
  ],
  formOptions: {
    defaultValues: {
      satisfaction: 5,
      phoneNumber: "",
      favoriteColor: "",
      workLocation: undefined,
      workDuration: { hours: 8, minutes: 0 },
      skills: [],
      experienceLevel: 5,
      energyRating: 3,
      performanceLevel: 50,
      speedometer: 80,
      birthDate: new Date(),
      resume: null,
      aboutMe: "",
      password: "",
      workEmail: "",
      overallRating: 4,
    },
    onSubmit: async ({ value }) => {
      console.log("Advanced field types form submitted:", value);
      toast.success("Profile completed!", {
        description: "All advanced field types captured!",
      });
    },
  },
});`;

export function AdvancedFieldTypesFormExample() {
  // Memoized search callback to prevent re-renders
  const locationSearchCallback = React.useCallback(
    async (query: string, options: any = {}) => {
      const params = new URLSearchParams({
        q: query,
        format: "json",
        limit: String(options.limit || 5),
        addressdetails: "1",
      });

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`
        );
        const data = await response.json();

        return data.map((item: any, index: number) => ({
          id: item.place_id || index,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          address: item.display_name,
          city:
            item.address?.city || item.address?.town || item.address?.village,
          state: item.address?.state,
          country: item.address?.country,
          postalCode: item.address?.postcode,
          relevance: parseFloat(item.importance || 0),
        }));
      } catch (error) {
        console.error("Location search error:", error);
        return [];
      }
    },
    []
  );

  // Memoized location config to prevent re-renders
  const locationConfig = React.useMemo(
    () => ({
      defaultLocation: { lat: 51.5074, lng: -0.1278 },
      zoom: 12,
      enableSearch: true,
      enableGeolocation: true,
      enableManualEntry: true,
      showMap: true,
      mapProvider: "openstreetmap" as const,
      searchPlaceholder: "Search for your work location...",
      searchOptions: {
        debounceMs: 300,
        minQueryLength: 3,
        maxResults: 5,
      },
      ui: {
        showCoordinates: true,
        showAddress: true,
        mapHeight: 400,
        coordinatesFormat: "decimal" as const,
      },
      searchCallback: locationSearchCallback,
    }),
    [locationSearchCallback]
  );

  const advancedFieldTypesForm = useFormedible({
    schema: advancedFieldTypesSchema,
    fields: [
      {
        name: "satisfaction",
        type: "rating",
        label: "How satisfied are you with our service?",
        section: {
          title: "Feedback & Ratings",
          description: "Rate your experience",
        },
        ratingConfig: {
          max: 5,
          allowHalf: true,
          icon: "star",
          size: "lg",
          showValue: true,
        },
      },
      {
        name: "overallRating",
        type: "rating",
        label: "Overall Experience",
        ratingConfig: {
          max: 5,
          allowHalf: false,
          icon: "heart",
          size: "md",
          showValue: true,
        },
      },
      {
        name: "phoneNumber",
        type: "phone",
        label: "Phone Number",
        section: {
          title: "Contact Information",
          description: "How can we reach you?",
        },
        phoneConfig: {
          defaultCountry: "US",
          format: "international",
        },
      },
      {
        name: "favoriteColor",
        type: "colorPicker",
        label: "Brand Color",
        colorConfig: {
          format: "hex",
          showPreview: true,
          presetColors: [
            "#ff0000",
            "#00ff00",
            "#0000ff",
            "#ffff00",
            "#ff00ff",
            "#00ffff",
            "#000000",
            "#ffffff",
            "#808080",
            "#800000",
            "#008000",
            "#000080",
          ],
          allowCustom: true,
        },
      },
      {
        name: "workLocation",
        type: "location",
        label: "Work Location",
        section: {
          title: "Location & Preferences",
          description: "Where do you work and your preferences",
        },
        locationConfig: locationConfig,
      },
      {
        name: "workDuration",
        type: "duration",
        label: "Daily Work Hours",
        durationConfig: {
          format: "hm",
          maxHours: 24,
          showLabels: true,
          allowNegative: false,
        },
      },
      {
        name: "skills",
        type: "multiSelect",
        label: "Technical Skills",
        options: [
          { value: "javascript", label: "JavaScript" },
          { value: "typescript", label: "TypeScript" },
          { value: "react", label: "React" },
          { value: "vue", label: "Vue.js" },
          { value: "angular", label: "Angular" },
          { value: "nodejs", label: "Node.js" },
          { value: "python", label: "Python" },
          { value: "java", label: "Java" },
        ],
        multiSelectConfig: {
          searchable: true,
          creatable: true,
          maxSelections: 8,
          placeholder: "Select or type your skills...",
        },
      },
      {
        name: "experienceLevel",
        type: "slider",
        label: "Experience Level (1-10)",
        section: {
          title: "Professional Background",
          description: "Your experience and background",
        },
        sliderConfig: {
          min: 1,
          max: 10,
          step: 1,
          marks: [
            { value: 1, label: "Beginner" },
            { value: 5, label: "Intermediate" },
            { value: 10, label: "Expert" },
          ],
          showTooltip: true,
          showValue: true,
          orientation: "horizontal",
        },
      },
      {
        name: "energyRating",
        type: "slider",
        label: "Energy Efficiency Rating",
        section: {
          title: "Advanced Sliders",
          description: "Enhanced slider examples with custom visualizations",
        },
        sliderConfig: {
          min: 1,
          max: 5,
          step: 1,
          valueMapping: [
            { sliderValue: 1, displayValue: "E", label: "Poor" },
            { sliderValue: 2, displayValue: "D", label: "Fair" },
            { sliderValue: 3, displayValue: "C", label: "Good" },
            { sliderValue: 4, displayValue: "B", label: "Very Good" },
            { sliderValue: 5, displayValue: "A", label: "Excellent" },
          ],
          visualizationComponent: LocalEnergyRatingComponent,
          showValue: true,
        },
      },
      {
        name: "performanceLevel",
        type: "slider",
        label: "Performance Level",
        sliderConfig: {
          min: 0,
          max: 100,
          step: 10,
          gradientColors: {
            start: "#ef4444",
            end: "#22c55e",
            direction: "horizontal",
          },
          valueLabelSuffix: "%",
          showValue: true,
          marks: [
            { value: 0, label: "Low" },
            { value: 50, label: "Medium" },
            { value: 100, label: "High" },
          ],
        },
      },
      {
        name: "speedometer",
        type: "slider", 
        label: "Speed Test",
        description: "Interactive speedometer with custom visualization",
        section: {
          title: "Advanced Sliders",
          description: "Enhanced slider examples with custom visualizations",
        },
        sliderConfig: {
          min: 0,
          max: 200,
          step: 10,
          valueMapping: [
            { sliderValue: 0, displayValue: "0", label: "Idle" },
            { sliderValue: 40, displayValue: "40", label: "Slow" },
            { sliderValue: 80, displayValue: "80", label: "Cruise" },
            { sliderValue: 120, displayValue: "120", label: "Fast" },
            { sliderValue: 160, displayValue: "160", label: "Speed" },
            { sliderValue: 200, displayValue: "200", label: "MAX!" },
          ],
          visualizationComponent: SpeedometerComponent,
          valueLabelSuffix: " km/h",
          showValue: true,
        },
      },
      {
        name: "birthDate",
        type: "date",
        label: "Date of Birth",
        dateConfig: {
          format: "MM/dd/yyyy",
          maxDate: new Date(),
          minDate: new Date(1900, 0, 1),
          showTime: false,
        },
      },
      {
        name: "resume",
        type: "file",
        label: "Upload Resume",
        fileConfig: {
          accept: ".pdf,.doc,.docx",
          multiple: false,
          maxSize: 5 * 1024 * 1024,
          maxFiles: 1,
        },
      },
      {
        name: "aboutMe",
        type: "textarea",
        label: "About Me",
        textareaConfig: {
          rows: 6,
          resize: "vertical",
          maxLength: 1000,
          showWordCount: true,
        },
      },
      {
        name: "password",
        type: "password",
        label: "Password",
        section: {
          title: "Security",
          description: "Account security settings",
        },
        passwordConfig: {
          showToggle: true,
          strengthMeter: true,
          minStrength: 3,
        },
      },
      {
        name: "workEmail",
        type: "email",
        label: "Work Email",
      },
    ],
    formOptions: {
      defaultValues: {
        satisfaction: 5,
        phoneNumber: "",
        favoriteColor: "",
        workLocation: undefined,
        workDuration: { hours: 8, minutes: 0 },
        skills: [],
        experienceLevel: 5,
        energyRating: 3,
        performanceLevel: 50,
        speedometer: 80,
        birthDate: new Date(),
        resume: null,
        aboutMe: "",
        password: "",
        workEmail: "",
        overallRating: 4,
      },
      onSubmit: async ({ value }) => {
        console.log("Advanced field types form submitted:", value);
        toast.success("Profile completed!", {
          description: "All advanced field types captured!",
        });
      },
    },
  });

  return <advancedFieldTypesForm.Form className="space-y-4" />;
}