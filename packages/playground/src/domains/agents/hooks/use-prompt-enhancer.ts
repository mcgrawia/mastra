import { useState } from 'react';

import type { PromptVersion } from '../types';

interface UsePromptEnhancerProps {
  agentId: string;
  instructions?: string;
  versions: PromptVersion[];
  onVersionCreate: (version: PromptVersion) => void;
  onVersionUpdate: (index: number, updates: Partial<PromptVersion>) => void;
}

interface UsePromptEnhancerResult {
  enhancedPrompt: string;
  explanation: string;
  isEnhancing: boolean;
  userComment: string;
  enhancePrompt: () => Promise<void>;
  setUserComment: (comment: string) => void;
  clearEnhancement: () => void;
  applyChanges: () => void;
}

export function usePromptEnhancer({
  agentId,
  instructions,
  versions,
  onVersionCreate,
  onVersionUpdate,
}: UsePromptEnhancerProps): UsePromptEnhancerResult {
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [userComment, setUserComment] = useState('');

  const enhancePrompt = async () => {
    if (!instructions) return;

    setIsEnhancing(true);
    try {
      const response = await fetch(`/api/agents/${agentId}/instructions/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mastra-dev-playground': 'true',
        },
        body: JSON.stringify({
          instructions,
          comment: userComment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to enhance prompt');
      }

      const data = await response.json();
      setEnhancedPrompt(data.new_prompt);
      setExplanation(data.explanation);

      // Clear the comment
      setUserComment('');
    } catch (error) {
      console.error('Failed to enhance prompt:', error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const clearEnhancement = () => {
    setEnhancedPrompt('');
    setExplanation('');
  };

  const applyChanges = () => {
    if (!enhancedPrompt) return;

    // Find the draft version index
    const draftIndex = versions.findIndex(v => v.status === 'draft');
    if (draftIndex !== -1) {
      // Update the draft version
      onVersionUpdate(draftIndex, {
        content: enhancedPrompt,
        analysis: explanation,
        status: 'published' as const,
        timestamp: new Date(),
      });
    } else {
      // Create a new published version
      const newVersion = {
        content: enhancedPrompt,
        timestamp: new Date(),
        analysis: explanation,
        status: 'published' as const,
      };
      onVersionCreate(newVersion);
    }

    clearEnhancement();
  };

  return {
    enhancedPrompt,
    explanation,
    isEnhancing,
    userComment,
    enhancePrompt,
    setUserComment,
    clearEnhancement,
    applyChanges,
  };
}
