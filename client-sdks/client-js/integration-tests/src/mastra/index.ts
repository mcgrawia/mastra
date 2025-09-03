import { Agent } from '@mastra/core/agent';
import { Mastra } from '@mastra/core/mastra';
import { simulateReadableStream } from 'ai';
import { MockLanguageModelV1 } from 'ai/test';

const mockModel = new MockLanguageModelV1({
  doStream: async () => ({
    stream: simulateReadableStream({
      chunks: [
        { type: 'text-delta', textDelta: 'Hello' },
        { type: 'text-delta', textDelta: ' from' },
        { type: 'text-delta', textDelta: ' agent' },
        {
          type: 'finish',
          finishReason: 'stop',
          logprobs: undefined,
          usage: { completionTokens: 3, promptTokens: 10 },
        },
      ],
    }),
    rawCall: { rawPrompt: null, rawSettings: {} },
  }),
});

const testAgent = new Agent({
  name: 'test',
  instructions: 'You are a test agent',
  model: mockModel,
});

export const mastra = new Mastra({
  agents: {
    test: testAgent,
  },
});
