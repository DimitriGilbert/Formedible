"use client";

import { useFormedible } from "@/hooks/use-formedible";
import React from "react";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";

const MySchema = z.object({
  roomDetails: z
    .array(
      z.object({
        equipementRoom: z.boolean(),
        equipementListRoom: z.string().min(10).optional(),
      })
    )
    .min(1, "Vous devez ajouter au moins une pièce")
    .max(20, "Vous ne pouvez pas ajouter plus de 20 pièces")
    .optional(),
});

type MyFormValues = z.infer<typeof MySchema>;

export default function MyForm() {
  const { Form } = useFormedible<MyFormValues>({
    schema: MySchema,

    fields: [
      // Pièces du logement
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
          defaultValue: {
            equipementRoom: false,
            equipementListRoom: "",
          },
          // Define the structure of each array item
          objectConfig: {
            collapseLabel: "Réduire",
            expandLabel: "Développer",
            title: "Configuration de la pièce",
            description: "Définissez les caractéristiques de cette pièce",
            collapsible: true,
            defaultExpanded: true,
            showCard: false,
            columns: 2,
            layout: "grid",
            fields: [
              {
                name: "equipementRoom",
                type: "switch",
                label: "Équipement spécifique *",
                placeholder: "Activez pour ajouter des équipements",
                description:
                  "Cette pièce dispose-t-elle d'équipements particuliers ?",
              },
              {
                name: "equipementListRoom",
                type: "textarea",
                label: "Liste des équipements",
                placeholder: "Ex: Meubles, électroménager, rangements.",
                description:
                  "Décrivez les équipements spécifiques de cette pièce",
                conditional: (values: any): any =>
                  values &&
                  values.equipementRoom &&
                  values.equipementRoom === true,
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
            equipementRoom: false,
            equipementListRoom: "",
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
