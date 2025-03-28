import { HfInference } from '@huggingface/inference';

// Initialize Hugging Face SDK
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

/**
 * Generate topic content using Hugging Face's text generation models
 * @param topic Topic title to generate content for
 * @param prompt Custom prompt for content generation
 * @returns Generated content
 */
export async function generateTopicContent(
  topic: string,
  prompt?: string
): Promise<string> {
  try {
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error('HUGGINGFACE_API_KEY is not set');
    }

    const fullPrompt = prompt || 
      `You are an educational content expert. Create a concise educational introduction about "${topic}". 
      Include the following sections:
      1. Brief overview (1 paragraph)
      2. Why this topic is important (1 paragraph)
      3. Key concepts to understand (3-5 bullet points)
      4. Resources for learning more (2-3 recommendations)
      
      Format using markdown.`;

    const result = await hf.textGeneration({
      model: 'google/flan-t5-large',
      inputs: fullPrompt,
      parameters: {
        max_new_tokens: 250,
        temperature: 0.7,
        top_p: 0.95,
      }
    });

    return result.generated_text;
  } catch (error) {
    console.error("Error generating topic content:", error);
    return "Content generation failed. Please try again later.";
  }
}

/**
 * Generate learning path for a topic
 * @param topic Topic to generate learning path for
 * @returns Generated learning path
 */
export async function generateTopicLearningPath(topic: string): Promise<string> {
  try {
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error('HUGGINGFACE_API_KEY is not set');
    }

    const prompt = `You are an educational content expert. Create a structured learning path for "${topic}".
    The learning path should include:
    1. Prerequisites (what someone should know before starting)
    2. Beginner level concepts and skills (3-5 bullet points)
    3. Intermediate level concepts and skills (3-5 bullet points)
    4. Advanced level concepts and skills (3-5 bullet points)
    
    Format using markdown.`;

    const result = await hf.textGeneration({
      model: 'google/flan-t5-large',
      inputs: prompt,
      parameters: {
        max_new_tokens: 250,
        temperature: 0.7,
        top_p: 0.95,
      }
    });

    return result.generated_text;
  } catch (error) {
    console.error("Error generating learning path:", error);
    return "Learning path generation failed. Please try again later.";
  }
}

/**
 * Generate quiz questions for a topic
 * @param topic Topic to generate quiz for
 * @param numQuestions Number of questions to generate
 * @returns Generated quiz questions
 */
export async function generateTopicQuiz(topic: string, numQuestions: number = 5): Promise<string> {
  try {
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error('HUGGINGFACE_API_KEY is not set');
    }

    const prompt = `You are an educational content expert. Create ${numQuestions} quiz questions about "${topic}".
    For each question, provide:
    1. The question
    2. 4 multiple choice options (A, B, C, D)
    3. The correct answer
    
    Format using markdown.`;

    const result = await hf.textGeneration({
      model: 'google/flan-t5-large',
      inputs: prompt,
      parameters: {
        max_new_tokens: 250,
        temperature: 0.7,
        top_p: 0.95,
      }
    });

    return result.generated_text;
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    return "Quiz generation failed. Please try again later.";
  }
}