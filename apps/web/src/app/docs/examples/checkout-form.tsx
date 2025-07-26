"use client";

import React from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import { toast } from "sonner";

export const checkoutSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  address: z.string().min(5),
  city: z.string().min(1),
  zipCode: z.string().min(5),
  paymentMethod: z.enum(["card", "paypal", "apple_pay"]),
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  shippingMethod: z.enum(["standard", "express", "overnight"]),
  giftMessage: z.string().optional(),
});

export const checkoutFormCode = `const checkoutSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  address: z.string().min(5),
  city: z.string().min(1),
  zipCode: z.string().min(5),
  paymentMethod: z.enum(["card", "paypal", "apple_pay"]),
  cardNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  shippingMethod: z.enum(["standard", "express", "overnight"]),
  giftMessage: z.string().optional(),
});

const checkoutForm = useFormedible({
  schema: checkoutSchema,
  fields: [
    // Page 1 - Shipping
    { name: "firstName", type: "text", label: "First Name", page: 1 },
    { name: "lastName", type: "text", label: "Last Name", page: 1 },
    { name: "email", type: "email", label: "Email", page: 1 },
    { name: "address", type: "text", label: "Address", page: 1 },
    { name: "city", type: "text", label: "City", page: 1 },
    { name: "zipCode", type: "text", label: "ZIP Code", page: 1 },

    // Page 2 - Payment
    {
      name: "paymentMethod",
      type: "radio",
      label: "Payment Method",
      page: 2,
      options: [
        { value: "card", label: "Credit/Debit Card" },
        { value: "paypal", label: "PayPal" },
        { value: "apple_pay", label: "Apple Pay" },
      ],
    },
    {
      name: "cardNumber",
      type: "text",
      label: "Card Number",
      page: 2,
      conditional: (values: any) => values.paymentMethod === "card",
      placeholder: "1234 5678 9012 3456",
    },
    {
      name: "expiryDate",
      type: "text",
      label: "Expiry Date",
      page: 2,
      conditional: (values: any) => values.paymentMethod === "card",
      placeholder: "MM/YY",
    },

    // Page 3 - Shipping Options
    {
      name: "shippingMethod",
      type: "radio",
      label: "Shipping Method",
      page: 3,
      options: [
        { value: "standard", label: "Standard (5-7 days) - Free" },
        { value: "express", label: "Express (2-3 days) - $9.99" },
        { value: "overnight", label: "Overnight - $24.99" },
      ],
    },
    {
      name: "giftMessage",
      type: "textarea",
      label: "Gift Message (Optional)",
      page: 3,
    },
  ],
  pages: [
    {
      page: 1,
      title: "Shipping Address",
      description: "Where should we send your order?",
    },
    { page: 2, title: "Payment", description: "How would you like to pay?" },
    { page: 3, title: "Review & Submit", description: "Review your order" },
  ],
  progress: { showSteps: true },
  formOptions: {
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      address: "",
      city: "",
      zipCode: "",
      paymentMethod: "card" as const,
      cardNumber: "",
      expiryDate: "",
      shippingMethod: "standard" as const,
      giftMessage: "",
    },
    onSubmit: async ({ value }) => {
      console.log("Order submitted:", value);
      toast.success("Order placed successfully!", {
        description: "You'll receive a confirmation email shortly.",
      });
    },
  },
});`;

export function CheckoutFormExample() {
  const checkoutForm = useFormedible({
    schema: checkoutSchema,
    fields: [
      // Page 1 - Shipping
      { name: "firstName", type: "text", label: "First Name", page: 1 },
      { name: "lastName", type: "text", label: "Last Name", page: 1 },
      { name: "email", type: "email", label: "Email", page: 1 },
      { name: "address", type: "text", label: "Address", page: 1 },
      { name: "city", type: "text", label: "City", page: 1 },
      { name: "zipCode", type: "text", label: "ZIP Code", page: 1 },

      // Page 2 - Payment
      {
        name: "paymentMethod",
        type: "radio",
        label: "Payment Method",
        page: 2,
        options: [
          { value: "card", label: "Credit/Debit Card" },
          { value: "paypal", label: "PayPal" },
          { value: "apple_pay", label: "Apple Pay" },
        ],
      },
      {
        name: "cardNumber",
        type: "text",
        label: "Card Number",
        page: 2,
        conditional: (values: any) => values.paymentMethod === "card",
        placeholder: "1234 5678 9012 3456",
      },
      {
        name: "expiryDate",
        type: "text",
        label: "Expiry Date",
        page: 2,
        conditional: (values: any) => values.paymentMethod === "card",
        placeholder: "MM/YY",
      },

      // Page 3 - Shipping Options
      {
        name: "shippingMethod",
        type: "radio",
        label: "Shipping Method",
        page: 3,
        options: [
          { value: "standard", label: "Standard (5-7 days) - Free" },
          { value: "express", label: "Express (2-3 days) - $9.99" },
          { value: "overnight", label: "Overnight - $24.99" },
        ],
      },
      {
        name: "giftMessage",
        type: "textarea",
        label: "Gift Message (Optional)",
        page: 3,
      },
    ],
    pages: [
      {
        page: 1,
        title: "Shipping Address",
        description: "Where should we send your order?",
      },
      { page: 2, title: "Payment", description: "How would you like to pay?" },
      { page: 3, title: "Review & Submit", description: "Review your order" },
    ],
    progress: { showSteps: true },
    formOptions: {
      defaultValues: {
        firstName: "",
        lastName: "",
        email: "",
        address: "",
        city: "",
        zipCode: "",
        paymentMethod: "card" as const,
        cardNumber: "",
        expiryDate: "",
        shippingMethod: "standard" as const,
        giftMessage: "",
      },
      onSubmit: async ({ value }) => {
        console.log("Order submitted:", value);
        toast.success("Order placed successfully!", {
          description: "You'll receive a confirmation email shortly.",
        });
      },
    },
  });

  return <checkoutForm.Form className="space-y-4" />;
}