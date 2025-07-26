"use client";

import React from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import { toast } from "sonner";

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
  birthDate: z.date(),
  resume: z.any().optional(),
  aboutMe: z
    .string()
    .min(50, "Please write at least 50 characters about yourself"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  workEmail: z.string().email("Valid work email required"),
  overallRating: z.number().min(1).max(5),
});

// Energy Rating Visualization Component
const EnergyRatingComponent: React.FC<{
  value: number;
  displayValue: string | number;
  label?: string;
  isActive: boolean;
}> = ({ value, displayValue, label, isActive }) => (
  <div
    className={`flex flex-col items-center p-2 rounded-lg transition-all ${
      isActive
        ? "bg-primary text-primary-foreground scale-110"
        : "bg-muted text-muted-foreground hover:bg-muted/80"
    }`}
  >
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
        value <= 2
          ? "bg-red-500"
          : value <= 3
          ? "bg-yellow-500"
          : "bg-green-500"
      }`}
    >
      {displayValue}
    </div>
    {label && <span className="text-xs mt-1">{label}</span>}
  </div>
);

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
        visualizationComponent: EnergyRatingComponent,
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
          visualizationComponent: EnergyRatingComponent,
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