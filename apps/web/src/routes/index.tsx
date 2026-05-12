import { createFileRoute } from '@tanstack/react-router';

import { HomeLanding } from '@/docs/home-landing';
import { createRouteSeoHead } from '@/docs/seo';

const routeHead = createRouteSeoHead('/');

export const Route = createFileRoute('/')({
  head: () => routeHead,
  component: HomeLanding,
});
