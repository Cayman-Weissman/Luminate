import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
// Initialize the client with the API key from environment variables
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const AnthropicService = {
  /**
   * Generate a text response using Anthropic's Claude model
   */
  async generateTextResponse(prompt: string, maxTokens: number = 1000): Promise<string> {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY environment variable is not set');
      }

      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      });

      // Handle the content properly checking if it's text
      if (response.content[0].type === 'text') {
        return response.content[0].text;
      } else {
        return 'No text response was generated.';
      }
    } catch (error) {
      console.error('Error in AnthropicService.generateTextResponse:', error);
      throw new Error('Failed to generate text with Claude AI');
    }
  },

  /**
   * Generate interactive course content based on a topic
   */
  async generateInteractiveCourse(topic: string, level: string = 'beginner'): Promise<any> {
    try {
      const prompt = `Create an interactive learning course on "${topic}" for ${level} level students.

The course should include:
1. An engaging title for the course
2. A brief overview of what will be covered
3. 5-7 modules, each containing:
   - A module title
   - Learning objectives
   - Key concepts explained clearly
   - 2-3 interactive elements (quiz questions, reflections, or activities)
   - A brief summary

Format the response as a JSON object with the following structure:
{
  "title": "Course title",
  "description": "Course overview",
  "level": "${level}",
  "estimatedHours": number (total estimated hours to complete),
  "modules": [
    {
      "id": 1,
      "title": "Module title",
      "description": "Module description",
      "learningObjectives": ["objective 1", "objective 2", ...],
      "content": "Main content explaining key concepts in detail",
      "interactiveElements": [
        {
          "type": "quiz"|"reflection"|"activity",
          "title": "Element title",
          "description": "Element description",
          "questions": [
            {
              "question": "Question text",
              "options": ["option 1", "option 2", ...],
              "correctAnswer": "correct option" // for quiz questions
            }
          ]
        }
      ],
      "summary": "Brief module summary"
    }
  ]
}

Ensure the content is educational, engaging, and appropriate for the specified level.`;

      const response = await this.generateTextResponse(prompt, 2000);
      
      try {
        // Extract JSON from the response (in case there's any additional text)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Failed to parse course content from AI response');
        }
        
        return JSON.parse(jsonMatch[0]);
      } catch (jsonError) {
        console.error('Error parsing course JSON:', jsonError);
        throw new Error('Failed to parse course content structure');
      }
    } catch (error) {
      console.error('Error generating interactive course:', error);
      throw new Error('Failed to generate interactive course content');
    }
  },

  /**
   * Chat with an AI assistant about the platform or learning in general
   */
  async chatWithAssistant(message: string, chatHistory: Array<{role: 'user' | 'assistant', content: string}> = []): Promise<string> {
    try {
      // Add system message with context about Luminate
      const systemMessage = `You are Luminate's AI learning assistant. Luminate is an educational platform that makes high-quality, practical learning accessible to everyone through AI-driven personalized content. 

Key features include:
- AI-generated educational content across thousands of topics
- Adaptive learning that adjusts to each user's pace and style
- Real-time trending topics showing what skills are in demand
- Flexible learning paths for different schedules and goals
- Free courses with optional certifications
- A community section for sharing and discussion

Your role is to be helpful, encouraging, and knowledgeable. You can assist with explaining concepts, suggesting learning paths, or guiding users around the platform. Always be supportive and never critical of a user's learning journey.`;

      // Combine history with new message - ensure roles are properly typed
      const typedHistory = chatHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      const response = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 1000,
        system: systemMessage,
        messages: [
          ...typedHistory,
          { role: 'user', content: message }
        ],
      });

      // Handle the content properly checking if it's text
      if (response.content[0].type === 'text') {
        return response.content[0].text;
      } else {
        return 'No text response was generated.';
      }
    } catch (error) {
      console.error('Error in chatWithAssistant:', error);
      throw new Error('Failed to generate assistant response');
    }
  },

  /**
   * Generate a guided tutorial for platform features
   */
  async generateTutorial(feature: string): Promise<any> {
    try {
      const prompt = `Create a step-by-step tutorial for the "${feature}" feature on the Luminate learning platform.

The tutorial should include:
1. A brief introduction explaining what the feature is and its benefits
2. A sequence of 4-7 clear steps to use the feature effectively
3. Tips for getting the most out of the feature
4. Common questions or issues users might encounter

Format the response as a JSON object with the following structure:
{
  "featureName": "${feature}",
  "introduction": "Introduction text",
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step title",
      "description": "Detailed step description",
      "tip": "Optional tip for this step"
    }
  ],
  "bestPractices": ["best practice 1", "best practice 2", ...],
  "faq": [
    {
      "question": "Common question",
      "answer": "Helpful answer"
    }
  ]
}`;

      const response = await this.generateTextResponse(prompt, 1500);
      
      try {
        // Extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Failed to parse tutorial content from AI response');
        }
        
        return JSON.parse(jsonMatch[0]);
      } catch (jsonError) {
        console.error('Error parsing tutorial JSON:', jsonError);
        throw new Error('Failed to parse tutorial content structure');
      }
    } catch (error) {
      console.error('Error generating tutorial:', error);
      throw new Error('Failed to generate tutorial content');
    }
  }
};