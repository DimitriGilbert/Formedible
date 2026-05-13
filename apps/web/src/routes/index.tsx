import { createFileRoute } from '@tanstack/react-router';

import { HomeLanding } from '@/components/docs/home-landing';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/');

export const Route = createFileRoute('/')({
  head: () => routeHead,
  component: HomeLanding,
});
