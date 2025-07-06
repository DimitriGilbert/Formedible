"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "./mode-toggle";

export default function Header() {
  const pathname = usePathname();
  
  const links = [
    { to: "/", label: "Home" },
    { to: "/docs", label: "Documentation" },
    { to: "/builder", label: "Form Builder" },
  ];

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="font-bold text-xl">Formedible</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              {links.map(({ to, label }) => (
                <Link 
                  key={to} 
                  href={to}
                  className={`text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400 ${
                    pathname === to || (to !== "/" && pathname.startsWith(to))
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-muted-foreground"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
