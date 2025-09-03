import { Mastra } from '@mastra/core/mastra';
import { innerAgent } from '@/agents';
import { testRoute } from '@/api/route/test';
import { allRoute } from '@/api/route/all';
import { streamingRoute } from '@/api/route/streaming';

export const mastra = new Mastra({
  agents: { innerAgent },
  server: {
    port: process.env.MASTRA_PORT ? parseInt(process.env.MASTRA_PORT) : 3000,
    apiRoutes: [testRoute, allRoute, streamingRoute],
  },
  bundler: {
    transpilePackages: ['@inner/hello-world'],
  },
});
