// src/components/contact/client-form/fields/SiteListField.tsx
import React from "react";
import type { AnyFieldApi } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlusCircleIcon, Trash2Icon, LinkIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

// Define the SiteInfoItem type
interface SiteInfoItem {
  id: string;
  url: string;
  description: string;
}

interface SiteListFieldProps {
  fieldApi: AnyFieldApi;
  fieldKey: "inspirationalSites" | "competitorSites";
  label: string;
  urlPlaceholder: string;
  descriptionPlaceholder: string;
}

export const SiteListField: React.FC<SiteListFieldProps> = ({
  fieldApi,
  fieldKey,
  label,
  urlPlaceholder,
  descriptionPlaceholder,
}) => {
  const sites = (fieldApi.state.value || []) as SiteInfoItem[];

  const addItem = () => {
    fieldApi.pushValue({
      id: Date.now().toString(),
      url: "",
      description: "",
    } as SiteInfoItem);
    fieldApi.handleBlur();
  };

  const removeItem = (index: number) => {
    fieldApi.removeValue(index);
    fieldApi.handleBlur();
  };

  const handleChange = (
    index: number,
    field: "url" | "description",
    value: string,
  ) => {
    fieldApi.handleChange((prev: SiteInfoItem[] | undefined) => {
      const newItems = [...(prev || [])];
      if (newItems[index]) {
        newItems[index] = { ...newItems[index], [field]: value };
      }
      return newItems;
    });
  };

  return (
    <motion.div
      className="space-y-3 p-4 border rounded-lg bg-card shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center">
          <LinkIcon className="h-4 w-4 mr-2 text-primary" />
          {label}
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <PlusCircleIcon className="h-4 w-4 mr-2" /> Ajouter un site
        </Button>
      </div>
      <AnimatePresence>
        {sites.map((site: SiteInfoItem, index: number) => (
          <motion.div
            key={site.id}
            className="p-3 border rounded-md bg-muted/30 space-y-2 shadow-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <div className="flex items-center gap-2">
              <Input
                type="url"
                value={site.url}
                onChange={(e) => handleChange(index, "url", e.target.value)}
                onBlur={() => fieldApi.handleBlur()}
                placeholder={urlPlaceholder}
                className={cn(
                  "h-9",
                  fieldApi.form.getFieldMeta(`${fieldKey}[${index}].url`)
                    ?.errors?.length
                    ? "border-destructive"
                    : "",
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
                className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10 h-9 w-9 shrink-0"
                aria-label={`Supprimer site ${index + 1}`}
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              value={site.description}
              onChange={(e) =>
                handleChange(index, "description", e.target.value)
              }
              onBlur={() => fieldApi.handleBlur()}
              placeholder={descriptionPlaceholder}
              rows={2}
              className={cn(
                fieldApi.form.getFieldMeta(`${fieldKey}[${index}].description`)
                  ?.errors?.length
                  ? "border-destructive"
                  : "",
              )}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      {sites.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No sites added.
        </p>
      )}
      {fieldApi.state.meta.isTouched && fieldApi.state.meta.errors.length > 0 && (
        <div className="text-xs text-destructive pt-1">
          {fieldApi.state.meta.errors.map((err: any, index: number) => (
            <p key={index}>{typeof err === 'string' ? err : (err as Error)?.message || 'Invalid'}</p>
          ))}
        </div>
      )}
    </motion.div>
  );
};
