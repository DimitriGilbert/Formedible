"use client";

import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Users, Car, Star, CreditCard, CheckCircle } from "lucide-react";

const rentalCarSchema = z.object({
  // Personal Info
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  
  // Trip Details
  destination: z.string().min(1, "Please tell us where you're going"),
  tripPurpose: z.enum(["business", "vacation", "weekend_getaway", "family_visit", "other"]),
  
  // Dates
  pickupDate: z.string().min(1, "Please select a pickup date"),
  returnDate: z.string().min(1, "Please select a return date"),
  
  // Group Size
  passengerCount: z.number().min(1).max(8),
  luggageAmount: z.enum(["minimal", "moderate", "heavy"]),
  
  // Preferences
  carCategory: z.enum(["economy", "compact", "midsize", "full_size", "luxury", "suv", "convertible"]),
  fuelPreference: z.enum(["gas", "hybrid", "electric"]),
  
  // Special Requirements
  hasSpecialNeeds: z.boolean(),
  specialRequirements: z.string().optional(),
  
  // Budget
  budgetRange: z.enum(["under_50", "50_100", "100_150", "150_plus"]),
  
  // Insurance
  needsInsurance: z.boolean(),
  insuranceType: z.enum(["basic", "premium", "comprehensive"]).optional(),
  
  // Additional Services
  wantsGPS: z.boolean(),
  wantsChildSeat: z.boolean(),
  childSeatCount: z.number().min(0).max(4).optional(),
  
  // Contact
  phone: z.string().min(10, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email address"),
});

type RentalCarFormValues = z.infer<typeof rentalCarSchema>;

const tripPurposeLabels = {
  business: "Business Trip",
  vacation: "Vacation",
  weekend_getaway: "Weekend Getaway", 
  family_visit: "Family Visit",
  other: "Other"
};

const carCategoryLabels = {
  economy: "Economy",
  compact: "Compact", 
  midsize: "Mid-size",
  full_size: "Full-size",
  luxury: "Luxury",
  suv: "SUV",
  convertible: "Convertible"
};

export function RentalCarFlowForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { Form } = useFormedible<RentalCarFormValues>({
    schema: rentalCarSchema,
    
    fields: [
      // Page 1: Welcome & Name
      {
        name: "firstName",
        type: "text",
        label: "What's your first name?",
        placeholder: "Enter your first name",
        page: 1,
        help: {
          tooltip: "We'll use this to personalize your rental experience"
        }
      },
      
      // Page 2: Destination
      {
        name: "destination", 
        type: "text",
        label: "Where are you headed, {{firstName}}?",
        placeholder: "Enter your destination city",
        description: "Tell us where {{firstName}} is planning to go",
        page: 2
      },
      
      // Page 3: Trip Purpose
      {
        name: "tripPurpose",
        type: "radio",
        label: "What brings {{firstName}} to {{destination}}?", 
        description: "This helps us recommend the perfect car for {{firstName}}'s {{destination}} trip",
        page: 3,
        options: [
          { value: "business", label: "Business Trip" },
          { value: "vacation", label: "Vacation" },
          { value: "weekend_getaway", label: "Weekend Getaway" },
          { value: "family_visit", label: "Family Visit" },
          { value: "other", label: "Other" }
        ]
      },
      
      // Page 4: Pickup Date
      {
        name: "pickupDate",
        type: "date",
        label: "When does {{firstName}}'s trip to {{destination}} begin?",
        description: "Pick your rental start date",
        page: 4
      },
      
      // Page 5: Return Date  
      {
        name: "returnDate",
        type: "date", 
        label: "When will {{firstName}} return from {{destination}}?",
        description: "Select your rental return date",
        page: 5
      },
      
      // Page 6: Passenger Count
      {
        name: "passengerCount",
        type: "slider",
        label: "How many people will join {{firstName}} in {{destination}}?",
        description: "Including {{firstName}}, how many passengers for this trip?",
        page: 6,
        sliderConfig: {
          min: 1,
          max: 8,
          step: 1,
          showValue: true,
          valueMapping: [
            { sliderValue: 1, displayValue: "Just me", label: "Solo traveler" },
            { sliderValue: 2, displayValue: "2 people", label: "Duo" },
            { sliderValue: 3, displayValue: "3 people", label: "Small group" },
            { sliderValue: 4, displayValue: "4 people", label: "Family/Friends" },
            { sliderValue: 5, displayValue: "5 people", label: "Large group" },
            { sliderValue: 6, displayValue: "6 people", label: "Big family" },
            { sliderValue: 7, displayValue: "7 people", label: "Very large group" },
            { sliderValue: 8, displayValue: "8 people", label: "Maximum capacity" }
          ]
        }
      },
      
      // Page 7: Luggage
      {
        name: "luggageAmount",
        type: "radio",
        label: "How much luggage will {{firstName}} and friends bring to {{destination}}?",
        page: 7,
        options: [
          { value: "minimal", label: "Light packing - just essentials" },
          { value: "moderate", label: "Normal amount - a few bags" },
          { value: "heavy", label: "Lots of luggage - we're packing everything!" }
        ]
      },
      
      // Page 8: Car Category
      {
        name: "carCategory",
        type: "select",
        label: "What type of car would make {{firstName}}'s trip perfect?",
        description: "Perfect for your {{destination}} adventure",
        page: 8,
        options: [
          { value: "economy", label: "Economy - Budget-friendly and efficient" },
          { value: "compact", label: "Compact - Perfect for city driving" },
          { value: "midsize", label: "Mid-size - Great balance of space and efficiency" },
          { value: "full_size", label: "Full-size - Maximum comfort and space" },
          { value: "luxury", label: "Luxury - Premium experience" },
          { value: "suv", label: "SUV - Adventure-ready with extra space" },
          { value: "convertible", label: "Convertible - Open-air driving experience" }
        ]
      },
      
      // Page 9: Fuel Preference
      {
        name: "fuelPreference", 
        type: "radio",
        label: "What fuel type does {{firstName}} prefer for the {{destination}} adventure?",
        description: "Choose the best fuel option for {{firstName}}'s rental car",
        page: 9,
        options: [
          { value: "gas", label: "Gasoline - Traditional and widely available" },
          { value: "hybrid", label: "Hybrid - Eco-friendly with great fuel economy" },
          { value: "electric", label: "Electric - Zero emissions and whisper quiet" }
        ]
      },
      
      // Page 10: Special Needs
      {
        name: "hasSpecialNeeds",
        type: "switch",
        label: "Does {{firstName}} have any special accessibility requirements?",
        description: "We want to ensure {{firstName}}'s {{destination}} trip is comfortable and accessible",
        page: 10
      },
      
      // Page 11: Special Requirements (Conditional)
      {
        name: "specialRequirements",
        type: "textarea", 
        label: "What special accommodations does {{firstName}} need?",
        description: "Help us make {{firstName}}'s {{destination}} experience perfect",
        placeholder: "Describe any accessibility needs, mobility requirements, or special accommodations...",
        page: 11,
        conditional: (values) => values.hasSpecialNeeds === true,
        textareaConfig: {
          rows: 4,
          maxLength: 500
        }
      },
      
      // Page 12: Budget
      {
        name: "budgetRange",
        type: "radio",
        label: "What's {{firstName}}'s budget for this {{destination}} rental?",
        description: "Per day budget for {{firstName}}'s trip",
        page: 12,
        options: [
          { value: "under_50", label: "Under $50/day - Budget-conscious" },
          { value: "50_100", label: "$50-100/day - Good value" },
          { value: "100_150", label: "$100-150/day - Premium comfort" },
          { value: "150_plus", label: "$150+/day - Luxury experience" }
        ]
      },
      
      // Page 13: Insurance
      {
        name: "needsInsurance",
        type: "switch",
        label: "Would {{firstName}} like rental insurance for the {{destination}} trip?",
        description: "Protect {{firstName}} and the rental car during the journey",
        page: 13
      },
      
      // Page 14: Insurance Type (Conditional)
      {
        name: "insuranceType",
        type: "radio",
        label: "What level of coverage does {{firstName}} want for {{destination}}?",
        description: "Choose the protection level that gives {{firstName}} peace of mind",
        page: 14,
        conditional: (values) => values.needsInsurance === true,
        options: [
          { value: "basic", label: "Basic - Essential coverage" },
          { value: "premium", label: "Premium - Enhanced protection" },
          { value: "comprehensive", label: "Comprehensive - Complete peace of mind" }
        ]
      },
      
      // Page 15: GPS
      {
        name: "wantsGPS",
        type: "switch",
        label: "Should we include GPS navigation for {{firstName}}'s {{destination}} adventure?",
        description: "Never get lost exploring {{destination}}",
        page: 15
      },
      
      // Page 16: Child Seats
      {
        name: "wantsChildSeat",
        type: "switch", 
        label: "Will {{firstName}}'s group need any child car seats for {{destination}}?",
        description: "Safety first for the little travelers",
        page: 16
      },
      
      // Page 17: Child Seat Count (Conditional)
      {
        name: "childSeatCount",
        type: "slider",
        label: "How many child seats does {{firstName}} need for {{destination}}?",
        description: "We'll have them ready for pickup",
        page: 17,
        conditional: (values) => values.wantsChildSeat === true,
        sliderConfig: {
          min: 1,
          max: 4,
          step: 1,
          showValue: true
        }
      },
      
      // Page 18: Phone
      {
        name: "phone",
        type: "phone",
        label: "What's the best number to reach {{firstName}}?",
        description: "We'll use this for pickup updates and any trip-related communication",
        page: 18,
        phoneConfig: {
          format: "national",
          defaultCountry: "US"
        }
      },
      
      // Page 19: Email  
      {
        name: "email",
        type: "email",
        label: "Where should we send {{firstName}}'s {{destination}} rental confirmation?",
        description: "Your booking details and trip information will be sent here",
        placeholder: "{{firstName}}.doe@email.com",
        page: 19,
        help: {
          tooltip: "We'll also send helpful tips for driving in {{destination}}"
        }
      }
    ],
    
    pages: [
      { 
        page: 1, 
        title: "Welcome to Your Perfect Rental Experience!", 
        description: "Let's find you the ideal car for your upcoming adventure" 
      },
      { 
        page: 2, 
        title: "Hello {{firstName}}!", 
        description: "Great to meet you! Now, where is this exciting journey taking you?" 
      },
      { 
        page: 3, 
        title: "{{destination}} Sounds Amazing!", 
        description: "{{firstName}}, we're excited to help make your {{destination}} trip unforgettable" 
      },
      { 
        page: 4, 
        title: "Trip Planning",
        description: "When does the adventure begin?" 
      },
      { 
        page: 5, 
        title: "Perfect Timing!", 
        description: "When will {{firstName}} be returning from {{destination}}?" 
      },
      { 
        page: 6, 
        title: "Travel Companions", 
        description: "Who's joining {{firstName}} on this {{destination}} adventure?" 
      },
      { 
        page: 7, 
        title: "Packing Plans", 
        description: "Let's make sure we have enough space for everything" 
      },
      { 
        page: 8, 
        title: "Choose Your Ride", 
        description: "Time to pick the perfect vehicle for {{firstName}}'s {{destination}} journey" 
      },
      { 
        page: 9, 
        title: "Fuel Your Adventure", 
        description: "What powers {{firstName}}'s perfect drive?" 
      },
      { 
        page: 10, 
        title: "Accessibility & Comfort", 
        description: "Ensuring {{firstName}} has the most comfortable experience possible" 
      },
      { 
        page: 11, 
        title: "Special Accommodations", 
        description: "Tell us how we can make this perfect for {{firstName}}" 
      },
      { 
        page: 12, 
        title: "Budget Considerations", 
        description: "Let's find the best value for {{firstName}}'s {{destination}} trip" 
      },
      { 
        page: 13, 
        title: "Protection & Peace of Mind", 
        description: "Rental insurance keeps {{firstName}} covered and worry-free" 
      },
      { 
        page: 14, 
        title: "Coverage Level", 
        description: "Choose the protection that's right for {{firstName}}" 
      },
      { 
        page: 15, 
        title: "Navigation & Convenience", 
        description: "Never get lost exploring {{destination}}" 
      },
      { 
        page: 16, 
        title: "Family Safety", 
        description: "Child safety is our top priority" 
      },
      { 
        page: 17, 
        title: "Child Seat Setup", 
        description: "We'll have everything ready for the little ones" 
      },
      { 
        page: 18, 
        title: "Stay Connected", 
        description: "How can we reach {{firstName}} about the rental?" 
      },
      { 
        page: 19, 
        title: "Almost Done!", 
        description: "Last step - where should we send {{firstName}}'s confirmation?" 
      }
    ],
    
    // Show dynamic progress with personalized messages
    progress: {
      showSteps: true,
      showPercentage: true,
      className: "mb-8"
    },
    
    formOptions: {
      defaultValues: {
        firstName: "",
        destination: "",
        tripPurpose: "vacation",
        pickupDate: "",
        returnDate: "",
        passengerCount: 1,
        luggageAmount: "moderate",
        carCategory: "midsize",
        fuelPreference: "gas",
        hasSpecialNeeds: false,
        specialRequirements: "",
        budgetRange: "50_100",
        needsInsurance: true,
        insuranceType: "basic",
        wantsGPS: true,
        wantsChildSeat: false,
        childSeatCount: 1,
        phone: "",
        email: ""
      },
      
      onSubmit: async ({ value }) => {
        // Simulate API submission
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log("Rental car booking submitted:", value);
        setIsSubmitted(true);
      }
    },
    
    nextLabel: "Continue →",
    previousLabel: "← Back", 
    submitLabel: "Book My Perfect Car!",
    formClassName: "max-w-2xl mx-auto"
  });

  if (isSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-700">
            Booking Confirmed!
          </CardTitle>
          <CardDescription className="text-lg">
            Your perfect rental car is reserved and waiting for you!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Check your email for confirmation details and pickup instructions.
          </p>
          <Button onClick={() => setIsSubmitted(false)} variant="outline">
            Book Another Car
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Car className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Rental Car Finder</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Answer a few questions and we'll find the perfect car for your trip. 
          This form demonstrates dynamic text that personalizes based on your responses.
        </p>
        
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="outline" className="gap-1">
            <MapPin className="w-3 h-3" />
            Dynamic Text
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Users className="w-3 h-3" />
            One Field Per Page
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Star className="w-3 h-3" />
            Conditional Logic
          </Badge>
          <Badge variant="outline" className="gap-1">
            <CalendarDays className="w-3 h-3" />
            Flow Form
          </Badge>
        </div>
      </div>
      
      <Form />
    </div>
  );
}