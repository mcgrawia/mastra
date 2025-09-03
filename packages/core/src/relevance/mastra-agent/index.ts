import { Agent } from '../../agent';
import type { MastraLanguageModel } from '../../llm/model/shared.types';
import { createSimilarityPrompt } from '../relevance-score-provider';
import type { RelevanceScoreProvider } from '../relevance-score-provider';

// Mastra Agent implementation
export class MastraAgentRelevanceScorer implements RelevanceScoreProvider {
  private agent: Agent;

  constructor(name: string, model: MastraLanguageModel) {
    this.agent = new Agent({
      name: `Relevance Scorer ${name}`,
      instructions: `You are a specialized agent for evaluating the relevance of text to queries.
Your task is to rate how well a text passage answers a given query.
Output only a number between 0 and 1, where:
1.0 = Perfectly relevant, directly answers the query
0.0 = Completely irrelevant
Consider:
- Direct relevance to the question
- Completeness of information
- Quality and specificity
Always return just the number, no explanation.`,
      model,
    });
  }

  async getRelevanceScore(query: string, text: string): Promise<number> {
    const prompt = createSimilarityPrompt(query, text);

    const model = await this.agent.getModel();

    let response: string;
    if (model.specificationVersion === 'v2') {
      const responseText = await this.agent.generateVNext(prompt);
      response = responseText.text;
    } else {
      const responseText = await this.agent.generate(prompt);
      response = responseText.text;
    }
    return parseFloat(response);
  }
}
