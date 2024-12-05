import { createAnthropic } from '@ai-sdk/anthropic';
import { createAzure } from '@ai-sdk/azure';


export function getAnthropicModel(apiKey: string) {
  const anthropic = createAnthropic({
    apiKey: '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',
  });

  return anthropic('claude-3-5-sonnet-20240620');
}

export function getAzureOpenAIModel(apiKey: string) {
  const azureOpenAI = createAzure({
    resourceName: 'ai-mathtutorhub605901471011',
    apiKey: '8640e8877dee4372a1d96b90b0069b80',
    apiVersion: '2024-08-01-preview',
  });

  return azureOpenAI('gpt-4o');
}