"use client";

import React from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import { toast } from "sonner";

export const vacationCarRentalSchema = z.object({
  name: z.string().min(1, "Please tell us your name"),
  destination: z.enum(["beach", "mountains", "city"]),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().min(1, "End date required"),
  passengers: z.number().min(1, "At least 1 passenger"),
  carType: z.enum(["convertible", "suv", "compact", "luxury"]),
  extras: z.array(z.string()).optional(),
  contactEmail: z.string().email("Please enter a valid email"),
});

export const vacationCarRentalFormCode = `
export function VacationCarRentalFormExample() {
  const { Form } = useFormedible({
    schema: vacationCarRentalSchema,
    fields: [
      {
        name: "name",
        type: "text",
        label: "What's your name?",
        placeholder: "John Doe",
        page: 1,
      },
      {
        name: "destination",
        type: "radio",
        label: "Hi {{name}}! Where are you headed for vacation?",
        page: 2,
        options: [
          { value: "beach", label: "Beach" },
          { value: "mountains", label: "Mountains" },
          { value: "city", label: "City" },
        ],
      },
      {
        name: "startDate",
        type: "date",
        label: "When does your trip to the {{destination}} start?",
        page: 3,
      },
      {
        name: "endDate",
        type: "date",
        label: "And when will you return from your {{destination}} trip?",
        page: 4,
      },
      {
        name: "passengers",
        type: "number",
        label: "How many people are traveling with you, {{name}}?",
        min: 1,
        page: 5,
      },
      {
        name: "carType",
        type: "select",
        label: "Choose the perfect car for your {{destination}} adventure",
        options: [
          { value: "convertible", label: "Convertible" },
          { value: "suv", label: "SUV" },
          { value: "compact", label: "Compact" },
          { value: "luxury", label: "Luxury" },
        ],
        page: 6,
        conditional: (values) =>
          values.destination === "beach" ||
          values.destination === "mountains" ||
          values.destination === "city",
      },
      {
        name: "extras",
        type: "multiSelect",
        label: "Any extras for your {{carType}}?",
        options: [
          { value: "gps", label: "GPS Navigation" },
          { value: "child_seat", label: "Child Seat" },
          { value: "roof_rack", label: "Roof Rack" },
          { value: "wifi", label: "In-Car WiFi" },
        ],
        multiSelectConfig: { searchable: true },
        page: 7,
      },
      {
        name: "contactEmail",
        type: "email",
        label: "Where should we send your booking confirmation, {{name}}?",
        placeholder: "you@example.com",
        page: 8,
      },
    ],
    pages: [
      { page: 1, title: "Let's get started", description: "What's your name?" },
      {
        page: 2,
        title: "Destination",
        description: "Hi {{name}}! Where are you going?",
      },
      {
        page: 3,
        title: "Trip Start Date",
        description: "When does your adventure to the {{destination}} begin?",
      },
      {
        page: 4,
        title: "Trip End Date",
        description: "When will you return from {{destination}}?",
      },
      {
        page: 5,
        title: "Passengers",
        description: "How many people are traveling with you, {{name}}?",
      },
      {
        page: 6,
        title: "Choose Your Car",
        description: "Pick the perfect ride for {{destination}}",
      },
      {
        page: 7,
        title: "Extras",
        description: "Add any extras to make your {{carType}} more comfortable",
      },
      {
        page: 8,
        title: "Contact Info",
        description: "Where should we send your booking details, {{name}}?",
      },
    ],
    progress: { showSteps: true, showPercentage: true },
    formOptions: {
      defaultValues: {
        name: "",
        destination: "beach",
        startDate: "",
        endDate: "",
        passengers: 1,
        carType: "compact",
        extras: [],
        contactEmail: "",
      },
      onSubmit: async ({ value }) => {
        toast.success("Booking confirmed!", {
          description: \`Your \${value.carType} is reserved for \${value.destination} from \${value.startDate} to \${value.endDate}.\`,
        });
      },
    },
  });

  return <Form className="space-y-4" />;
}

`;

export function VacationCarRentalFormExample() {
  const { Form } = useFormedible({
    schema: vacationCarRentalSchema,
    fields: [
      {
        name: "name",
        type: "text",
        label: "What's your name?",
        placeholder: "John Doe",
        page: 1,
      },
      {
        name: "destination",
        type: "radio",
        label: "Hi {{name}}! Where are you headed for vacation?",
        page: 2,
        options: [
          { value: "beach", label: "Beach" },
          { value: "mountains", label: "Mountains" },
          { value: "city", label: "City" },
        ],
      },
      {
        name: "startDate",
        type: "date",
        label: "When does your trip to the {{destination}} start?",
        page: 3,
      },
      {
        name: "endDate",
        type: "date",
        label: "And when will you return from your {{destination}} trip?",
        page: 4,
      },
      {
        name: "passengers",
        type: "number",
        label: "How many people are traveling with you, {{name}}?",
        min: 1,
        page: 5,
      },
      {
        name: "carType",
        type: "select",
        label: "Choose the perfect car for your {{destination}} adventure",
        options: [
          { value: "convertible", label: "Convertible" },
          { value: "suv", label: "SUV" },
          { value: "compact", label: "Compact" },
          { value: "luxury", label: "Luxury" },
        ],
        page: 6,
        conditional: (values) =>
          values.destination === "beach" ||
          values.destination === "mountains" ||
          values.destination === "city",
      },
      {
        name: "extras",
        type: "multiSelect",
        label: "Any extras for your {{carType}}?",
        options: [
          { value: "gps", label: "GPS Navigation" },
          { value: "child_seat", label: "Child Seat" },
          { value: "roof_rack", label: "Roof Rack" },
          { value: "wifi", label: "In-Car WiFi" },
        ],
        multiSelectConfig: { searchable: true },
        page: 7,
      },
      {
        name: "contactEmail",
        type: "email",
        label: "Where should we send your booking confirmation, {{name}}?",
        placeholder: "you@example.com",
        page: 8,
      },
    ],
    pages: [
      { page: 1, title: "Let's get started", description: "What's your name?" },
      {
        page: 2,
        title: "Destination",
        description: "Hi {{name}}! Where are you going?",
      },
      {
        page: 3,
        title: "Trip Start Date",
        description: "When does your adventure to the {{destination}} begin?",
      },
      {
        page: 4,
        title: "Trip End Date",
        description: "When will you return from {{destination}}?",
      },
      {
        page: 5,
        title: "Passengers",
        description: "How many people are traveling with you, {{name}}?",
      },
      {
        page: 6,
        title: "Choose Your Car",
        description: "Pick the perfect ride for {{destination}}",
      },
      {
        page: 7,
        title: "Extras",
        description: "Add any extras to make your {{carType}} more comfortable",
      },
      {
        page: 8,
        title: "Contact Info",
        description: "Where should we send your booking details, {{name}}?",
      },
    ],
    progress: { showSteps: true, showPercentage: true },
    formOptions: {
      defaultValues: {
        name: "",
        destination: "beach",
        startDate: "",
        endDate: "",
        passengers: 1,
        carType: "compact",
        extras: [],
        contactEmail: "",
      },
      onSubmit: async ({ value }) => {
        toast.success("Booking confirmed!", {
          description: `Your ${value.carType} is reserved for ${value.destination} from ${value.startDate} to ${value.endDate}.`,
        });
      },
    },
  });

  return <Form className="space-y-4" />;
}
