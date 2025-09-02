"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { ModeToggle } from "./mode-toggle";

export default function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  const links = [
    { to: "/", label: "Home" },
    { to: "/docs", label: "Documentation" },
    { to: "/builder", label: "Form Builder" },
    { to: "/ai-builder", label: "AI Builder" },
    {
      to: "https://github.com/DimitriGilbert/FormEdible",
      label: "Github",
      target: "_blank",
    },
  ];

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-6 mt-6">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-muted-foreground rounded-lg flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-sm">
                        F
                      </span>
                    </div>
                    <span className="font-bold text-xl">Formedible</span>
                  </div>
                  <nav className="flex flex-col space-y-4">
                    {links.map(({ to, label, target }) => (
                      <SheetClose asChild key={to}>
                        <Link
                          href={to}
                          className={`text-lg font-medium transition-colors hover:text-primary p-2 rounded-md ${
                            pathname === to ||
                            (to !== "/" && pathname.startsWith(to))
                              ? "text-primary bg-primary/10"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                          target={target}
                          onClick={() => setIsOpen(false)}
                        >
                          {label}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                  <div className="pt-6 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Theme:</span>
                      <ModeToggle />
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-muted-foreground rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  F
                </span>
              </div>
              <span className="font-bold text-xl">Formedible</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-6 ml-8">
              {links.map(({ to, label, target }) => (
                <Link
                  key={to}
                  href={to}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === to || (to !== "/" && pathname.startsWith(to))
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                  target={target}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Desktop Mode Toggle */}
          <div className="hidden md:flex items-center gap-4">
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
