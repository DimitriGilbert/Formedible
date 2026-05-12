import { Link } from '@tanstack/react-router';

export default function Header() {
  const links = [{ to: '/', label: 'Docs' }] as const;

  return (
    <div className="border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-row items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <nav className="flex gap-4 text-sm font-medium">
          {links.map(({ to, label }) => {
            return (
              <Link key={to} to={to}>
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
