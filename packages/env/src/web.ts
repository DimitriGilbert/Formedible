import { createEnv } from '@t3-oss/env-core';

export const env = createEnv({
  client: {},
  clientPrefix: 'VITE_',
  emptyStringAsUndefined: true,
  runtimeEnvStrict: {},
});
