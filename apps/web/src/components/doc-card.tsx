import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export function DocCard({
  title,
  description,
  icon: Icon,
  children,
  className,
}: DocCardProps) {
  return (
    <Card className={cn("overflow-hidden border-0 shadow-md pt-0", className)}>
      <div className="bg-gradient-to-r from-primary/5 to-muted-foreground/5 px-6 pt-6 pb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/8 to-muted-foreground/8 border">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">{title}</h3>
            <p className="text-base text-muted-foreground mt-1">
              {description}
            </p>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </Card>
  );
}
