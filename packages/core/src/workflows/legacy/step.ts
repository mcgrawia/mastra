import type { z } from 'zod';
import type { Mastra } from '../../mastra';
import type { RetryConfig, StepAction, StepExecutionContext } from './types';

export class LegacyStep<
  TStepId extends string = any,
  TSchemaIn extends z.ZodSchema | undefined = undefined,
  TSchemaOut extends z.ZodSchema | undefined = undefined,
  TContext extends StepExecutionContext<TSchemaIn> = StepExecutionContext<TSchemaIn>,
> implements StepAction<TStepId, TSchemaIn, TSchemaOut, TContext>
{
  id: TStepId;
  description?: string;
  inputSchema?: TSchemaIn;
  outputSchema?: TSchemaOut;
  payload?: TSchemaIn extends z.ZodSchema ? Partial<z.infer<TSchemaIn>> : unknown;
  execute: (context: TContext) => Promise<TSchemaOut extends z.ZodSchema ? z.infer<TSchemaOut> : unknown>;
  retryConfig?: RetryConfig;
  mastra?: Mastra;

  constructor({
    id,
    description,
    execute,
    payload,
    outputSchema,
    inputSchema,
    retryConfig,
  }: StepAction<TStepId, TSchemaIn, TSchemaOut, TContext>) {
    this.id = id;
    this.description = description ?? '';
    this.inputSchema = inputSchema;
    this.payload = payload;
    this.outputSchema = outputSchema;
    this.execute = execute;
    this.retryConfig = retryConfig;
  }
}
