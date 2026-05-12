import { createFileRoute } from '@tanstack/react-router';

import { HomeLanding } from '@/docs/home-landing';

export const Route = createFileRoute('/')({
  component: HomeLanding,
});
