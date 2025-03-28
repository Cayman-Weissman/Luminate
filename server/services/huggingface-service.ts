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
 * Generate interactive course module from text
 * @param whitePaperText The source white paper text to generate a course from
 * @param moduleTitle The title of the module to create
 * @returns Generated module content with lessons, quizzes, and exercises
 */
export async function generateInteractiveCourseModule(
  whitePaperText: string, 
  moduleTitle: string
): Promise<any> {
  try {
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error('HUGGINGFACE_API_KEY is not set');
    }
    
    // Create a prompt that extracts the most relevant information from the white paper
    // and formats it into an educational module structure
    const prompt = `You are an educational content expert. Based on this white paper content about "${moduleTitle}", 
    create a concise educational module with the following structure:
    
    1. Module overview (2-3 sentences)
    2. Learning objectives (3-5 bullet points)
    3. One short lesson with key concepts (up to 150 words)
    4. One quiz question with 4 multiple choice options (A, B, C, D) and the correct answer
    5. One hands-on exercise related to the module
    
    White paper text:
    "${whitePaperText.substring(0, 500)}"
    
    Format the response in JSON with the following structure:
    {
      "overview": "Module overview text",
      "learningObjectives": ["objective 1", "objective 2", "objective 3"],
      "lesson": "Lesson content",
      "quiz": {
        "question": "Question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "B"
      },
      "exercise": "Exercise instructions"
    }`;

    const result = await hf.textGeneration({
      model: 'google/flan-t5-large',
      inputs: prompt,
      parameters: {
        max_new_tokens: 250,
        temperature: 0.7,
        top_p: 0.95,
      }
    });

    // The model may not return properly formatted JSON
    // Try to parse it, but if it fails, return a structured object with the raw text
    try {
      // Try to extract JSON if it's wrapped in text
      const jsonMatch = result.generated_text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : result.generated_text;
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Error parsing JSON from model output:", parseError);
      return {
        overview: "Failed to generate structured content.",
        learningObjectives: ["Understand key concepts in the module"],
        lesson: result.generated_text,
        quiz: {
          question: "What is the main topic of this module?",
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: "A"
        },
        exercise: "Review the lesson content and identify 3 key points."
      };
    }
  } catch (error) {
    console.error("Error generating interactive course module:", error);
    throw new Error('Failed to generate interactive course module');
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

/**
 * Generate a complete interactive course from white paper content
 * @param title The course title
 * @param whitePaperText The content to use for course generation
 * @returns A structured interactive course with modules
 */
export async function generateInteractiveCourse(
  title: string,
  whitePaperText: string
): Promise<any> {
  try {
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error('HUGGINGFACE_API_KEY is not set');
    }

    // First, identify key topics from the white paper to create modules
    const topicsPrompt = `Extract 3-5 main educational topics from this white paper about "${title}". 
    For each topic, provide:
    1. A concise title (3-5 words)
    2. A brief 1-sentence description
    
    White paper text:
    "${whitePaperText.substring(0, 1000)}"
    
    Format the response as a numbered list.`;

    const topicsResult = await hf.textGeneration({
      model: 'google/flan-t5-large',
      inputs: topicsPrompt,
      parameters: {
        max_new_tokens: 250,
        temperature: 0.7,
        top_p: 0.95,
      }
    });

    // Parse the topics (this is a best effort - the format might vary)
    const topicsText = topicsResult.generated_text.trim();
    const topicLines = topicsText.split('\n').filter(line => line.trim().length > 0);
    
    // Extract topics from numbered list or any other format
    const moduleTopics = [];
    for (let i = 0; i < topicLines.length; i++) {
      const line = topicLines[i].trim();
      // Try to match "1. Title - Description" or "1. Title: Description" or similar formats
      const match = line.match(/^\d+\.\s+(.*?)(?:\s*[-:]\s*|\s*:\s*|\s*–\s*)(.*)$/);
      if (match) {
        moduleTopics.push({
          title: match[1].trim(),
          description: match[2].trim(),
        });
      } else if (line.match(/^\d+\.\s+/)) {
        // If it's just a numbered line without a clear separator, use the whole line as title
        moduleTopics.push({
          title: line.replace(/^\d+\.\s+/, '').trim(),
          description: 'Key topic from the course material',
        });
      }
    }

    // If we couldn't extract topics properly, create some default ones
    if (moduleTopics.length === 0) {
      moduleTopics.push(
        { title: 'Course Introduction', description: 'Overview of the course content' },
        { title: 'Core Concepts', description: 'Fundamental principles and ideas' },
        { title: 'Practical Applications', description: 'Real-world applications and examples' }
      );
    }

    // Create modules for each topic
    const modules = [];
    for (const topic of moduleTopics.slice(0, 5)) { // Limit to 5 modules
      try {
        const moduleContent = await generateInteractiveCourseModule(whitePaperText, topic.title);
        modules.push({
          title: topic.title,
          description: topic.description,
          content: moduleContent
        });
      } catch (error) {
        console.error(`Error generating module for ${topic.title}:`, error);
      }
    }

    // Generate the course overview
    const overviewPrompt = `Create a concise course description and learning objectives for a course titled "${title}" based on this content:
    "${whitePaperText.substring(0, 500)}"
    
    Include:
    1. A brief course description (2-3 sentences)
    2. The target audience (1 sentence)
    3. 3-5 overall learning objectives
    
    Format using plain text.`;

    const overviewResult = await hf.textGeneration({
      model: 'google/flan-t5-large',
      inputs: overviewPrompt,
      parameters: {
        max_new_tokens: 250,
        temperature: 0.7,
        top_p: 0.95,
      }
    });

    // Return the complete course structure
    return {
      title,
      description: overviewResult.generated_text.trim(),
      level: 'beginner', // Default level
      estimatedHours: modules.length * 2, // Rough estimate: 2 hours per module
      modules,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error("Error generating interactive course:", error);
    throw new Error('Failed to generate interactive course');
  }
}