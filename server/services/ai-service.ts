import { HfInference } from '@huggingface/inference';

// Initialize Hugging Face client
// Note: You can use the Hugging Face client without an API key for certain free models,
// but for access to all models and higher rate limits, we'll support adding an API key
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

interface VerifyAnswerResponse {
  isCorrect: boolean;
  explanation: string;
  score: number;
}

interface QuizGenerationResponse {
  questions: {
    id: number;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
}

interface SummaryResponse {
  summary: string;
}

interface LearningPathResponse {
  title: string;
  description: string;
  steps: {
    id: number;
    title: string;
    description: string;
    resources: string[];
    estimatedTime: string;
  }[];
}

export const AiService = {
  /**
   * Generates a summary of provided text
   */
  async summarizeText(text: string): Promise<SummaryResponse> {
    try {
      const prompt = `Summarize the following text concisely while preserving key points and maintaining clarity:

${text}

Provide a summary that captures the essential information in a well-structured format.`;
      
      const response = await hf.textGeneration({
        model: 'HuggingFaceH4/zephyr-7b-beta',
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.95,
          return_full_text: false,
        },
      });

      return {
        summary: response.generated_text.trim(),
      };
    } catch (error) {
      console.error('Error in summarizeText:', error);
      throw new Error('Failed to generate summary');
    }
  },

  /**
   * Verifies a user's answer to a question
   */
  async verifyAnswer(question: string, correctAnswer: string, userAnswer: string): Promise<VerifyAnswerResponse> {
    try {
      const prompt = `Question: ${question}
Correct answer: ${correctAnswer}
User's answer: ${userAnswer}

Evaluate whether the user's answer is correct. Consider:
1. Semantic equivalence (meaning is the same even if wording differs)
2. Key concepts that must be included
3. Factual accuracy

Respond in JSON format with these fields:
* isCorrect: boolean indicating if the answer is correct
* explanation: brief explanation of why the answer is correct or incorrect
* score: a score from 0 to 100 indicating how close the answer is to being correct

JSON:`;

      const response = await hf.textGeneration({
        model: 'HuggingFaceH4/zephyr-7b-beta',
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.3,
          return_full_text: false,
        },
      });

      // Extract JSON from the response
      const jsonMatch = response.generated_text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const result = JSON.parse(jsonMatch[0]);
      return {
        isCorrect: result.isCorrect,
        explanation: result.explanation,
        score: result.score,
      };
    } catch (error) {
      console.error('Error in verifyAnswer:', error);
      throw new Error('Failed to verify answer');
    }
  },

  /**
   * Generates a personalized learning path
   */
  async generateLearningPath(topic: string, userSkillLevel: string, goals: string): Promise<LearningPathResponse> {
    try {
      const prompt = `Create a personalized learning path for a student with the following parameters:

Topic: ${topic}
Current skill level: ${userSkillLevel}
Learning goals: ${goals}

Create a structured learning path that includes:
1. An overarching title for the learning path
2. A brief description of what will be learned
3. A series of 5-7 concrete steps to follow, each with:
   - A clear title
   - A detailed description
   - Suggested resources (books, courses, websites)
   - Estimated time to complete

Respond in JSON format with these fields:
* title: string with the learning path title
* description: string with the learning path overview
* steps: array of objects, each with:
  * id: number (1-indexed)
  * title: string with step title
  * description: string with detailed step description
  * resources: array of strings with recommended resources
  * estimatedTime: string with time estimate (e.g., "2 weeks")

JSON:`;

      const response = await hf.textGeneration({
        model: 'HuggingFaceH4/zephyr-7b-beta',
        inputs: prompt,
        parameters: {
          max_new_tokens: 1200,
          temperature: 0.7,
          return_full_text: false,
        },
      });

      // Extract JSON from the response
      const jsonMatch = response.generated_text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error in generateLearningPath:', error);
      throw new Error('Failed to generate learning path');
    }
  },

  /**
   * Generates a quiz on a specific topic
   */
  async generateQuiz(topic: string, difficulty: string, numberOfQuestions: number): Promise<QuizGenerationResponse> {
    try {
      const prompt = `Create a ${difficulty} level quiz on the topic of "${topic}" with ${numberOfQuestions} multiple-choice questions.

For each question:
1. Provide a clear question
2. Include 4 possible answer options
3. Mark the correct answer
4. Add a brief explanation of why the answer is correct

Respond in JSON format with these fields:
* questions: array of objects, each with:
  * id: number (1-indexed)
  * question: string with the question text
  * options: array of 4 strings with possible answers
  * correctAnswer: string matching one of the options exactly
  * explanation: string explaining the correct answer

JSON:`;

      const response = await hf.textGeneration({
        model: 'HuggingFaceH4/zephyr-7b-beta',
        inputs: prompt,
        parameters: {
          max_new_tokens: 1500,
          temperature: 0.7,
          return_full_text: false,
        },
      });

      // Extract JSON from the response
      const jsonMatch = response.generated_text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error in generateQuiz:', error);
      throw new Error('Failed to generate quiz');
    }
  },

  /**
   * Analyzes learning progress and provides recommendations
   */
  async analyzeProgress(
    topics: string[],
    strengths: string[],
    weaknesses: string[],
    goals: string
  ): Promise<string> {
    try {
      const prompt = `Analyze a student's learning progress with the following information:

Topics studying: ${topics.join(', ')}
Strengths: ${strengths.join(', ')}
Areas needing improvement: ${weaknesses.join(', ')}
Learning goals: ${goals}

Provide a detailed analysis that includes:
1. An assessment of their current progress
2. Specific strengths to leverage
3. Targeted recommendations for areas needing improvement
4. Concrete next steps to help them reach their goals
5. Suggested resources or approaches that might help

Ensure the analysis is encouraging, specific, and actionable.`;

      const response = await hf.textGeneration({
        model: 'HuggingFaceH4/zephyr-7b-beta',
        inputs: prompt,
        parameters: {
          max_new_tokens: 800,
          temperature: 0.7,
          return_full_text: false,
        },
      });

      return response.generated_text.trim();
    } catch (error) {
      console.error('Error in analyzeProgress:', error);
      throw new Error('Failed to analyze progress');
    }
  },

  /**
   * Generates course content for a given topic
   */
  async generateCourseContent(topic: string, targetAudience: string, format: string): Promise<string> {
    try {
      const prompt = `Create educational content on ${topic} for ${targetAudience} in the format of ${format}.

The content should:
1. Be comprehensive and accurate
2. Be structured in a logical, progressive order
3. Include examples, analogies, or case studies where appropriate
4. Use clear, accessible language appropriate for the target audience
5. Address common misconceptions or challenges
6. Include thought-provoking questions or activities

Make the content engaging, informative, and valuable for learners.`;

      const response = await hf.textGeneration({
        model: 'HuggingFaceH4/zephyr-7b-beta',
        inputs: prompt,
        parameters: {
          max_new_tokens: 1000,
          temperature: 0.7,
          return_full_text: false,
        },
      });

      return response.generated_text.trim();
    } catch (error) {
      console.error('Error in generateCourseContent:', error);
      throw new Error('Failed to generate course content');
    }
  }
};