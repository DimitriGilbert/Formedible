"use client";

import { useFormedible } from "@/hooks/use-formedible";
import React from "react";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";

const MySchema = z.object({
  roomDetails: z
    .array(
      z.object({
        typeRoom: z.enum([
          "hall",
          "livingroom",
          "eatroom",
          "kitchen",
          "bathroom",
          "watterroom",
          "wc",
          "bedroom",
          "office",
          "dressing",
          "laundry",
          "playroom",
          "library",
          "sportroom",
          "cinemaroom",
          "other",
        ]),
        surfaceRoom: z
          .number()
          .min(1, "La surface doit être d'au moins 1 m²")
          .optional(),
        equipementRoom: z.boolean(),
        // equipementRoom: z.enum(['yes', 'no']),
        equipementListRoom: z.string().min(10).optional(),
        descriptionRoom: z
          .string()
          .min(10, "La description doit contenir au moins 10 caractères")
          .max(500, "La description ne peut pas dépasser 500 caractères")
          .optional(),
      })
    )
    .min(1, "Vous devez ajouter au moins une pièce")
    .max(20, "Vous ne pouvez pas ajouter plus de 20 pièces")
    .optional(),
});

export type MyFormValues = z.infer<typeof MySchema>;

export default function MyForm() {
  const { Form } = useFormedible<MyFormValues>({
    schema: MySchema,

    fields: [
      {
        section: {
          title: "🛋️ Pièces du logement",
        },
        name: "roomDetails",
        type: "array",
        label: "Ajouter une pièce",
        description: "Ajoutez les différentes pièces du logement",
        arrayConfig: {
          itemType: "object",
          itemLabel: "Pièce",
          minItems: 1,
          maxItems: 20,
          sortable: true,
          addButtonLabel: "Ajouter une pièce",
          removeButtonLabel: "Supprimer une pièce",
          // Define the structure of each array item
          objectConfig: {
            collapseLabel: "Réduire",
            expandLabel: "Développer",
            title: "Configuration de la pièce",
            description: "Définissez les caractéristiques de cette pièce",
            collapsible: true,
            defaultExpanded: true,
            showCard: false,
            fields: [
              {
                name: "typeRoom",
                type: "select",
                label: "Type de pièce *",
                placeholder: "Sélectionner un type",
                description: "Choisissez le type de pièce",
                options: [
                  { value: "hall", label: "Entrée" },
                  { value: "livingroom", label: "Salon" },
                  { value: "eatroom", label: "Salle à manger" },
                  { value: "kitchen", label: "Cuisine" },
                  { value: "bathroom", label: "Salle de bains" },
                  { value: "watterroom", label: "Salle d’eau" },
                  { value: "wc", label: "WC" },
                  { value: "bedroom", label: "Chambre" },
                  { value: "office", label: "Bureau" },
                  { value: "dressing", label: "Dressing" },
                  { value: "laundry", label: "Buanderie" },
                  { value: "playroom", label: "Salle de jeux / multimédia" },
                  { value: "library", label: "Bibliothèque" },
                  { value: "sportroom", label: "Salle de sport" },
                  { value: "cinemaroom", label: "Salle de cinéma" },
                  { value: "other", label: "Autre" },
                ],
              },
              {
                name: "surfaceRoom",
                type: "number",
                label: "Surface (m²)",
                placeholder: "Ex: 25.5",
                description: "Surface de la pièce en mètres carrés",
                min: 0.1,
                step: 0.1,
              },
              {
                name: "equipementRoom",
                type: "switch",
                // type: "select",
                label: "Équipement spécifique *",
                placeholder: "Activez pour ajouter des équipements",
                description:
                  "Cette pièce dispose-t-elle d'équipements particuliers ?",
                // options: [
                //   { value: "yes", label: "Oui" },
                //   { value: "no", label: "Non" }
                // ],
              },
              {
                name: "equipementListRoom",
                type: "textarea",
                label: "Liste des équipements",
                placeholder: "Ex: Meubles, électroménager, rangements.",
                description:
                  "Décrivez les équipements spécifiques de cette pièce",
                // conditional: (values : any) => values.equipementRoom === "oui",
                conditional: (values: any) => values.equipementRoom === true,
                validation: z
                  .string()
                  .max(
                    1000,
                    "Les descriptions ne peuvent pas dépasser 1000 caractères"
                  ),
              },
              {
                name: "descriptionRoom",
                type: "textarea",
                label: "Description",
                placeholder: "Description générale de la pièce...",
                description: "Informations complémentaires sur la pièce",
                validation: z
                  .string()
                  .max(
                    1000,
                    "Les descriptions ne peuvent pas dépasser 1000 caractères"
                  ),
              },
            ],
          },
        },
      },
    ],

    formOptions: {
      defaultValues: {
        roomDetails: [
          {
            typeRoom: "hall" as const,
            surfaceRoom: 0,
            equipementRoom: false,
            // equipementRoom: "no" as const,
            equipementListRoom: "",
            descriptionRoom: "",
          },
        ],
      },

      onSubmit: async ({ value }) => {
        console.log("Données du formulaire soumises:", value);

        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Success notification
          alert(
            "Formulaire soumis avec succès ! Vos informations ont été enregistrées."
          );

          // Clear stored form data on success
          localStorage.removeItem("real-estate-form-draft");
        } catch (error) {
          console.error("Erreur lors de la soumission:", error);
          alert("Une erreur s'est produite. Veuillez réessayer.");
        }
      },
    },
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Formulaire</h1>
        <Card className="bg-gradient-to-br from-chart-2 to-chart-3 border-0 shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 p-4">
          <CardContent className="">
            <Form className="max-w-6xl mx-auto" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
