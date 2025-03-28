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
   * Responds to user questions (AI assistant)
   */
  async getAIAssistantResponse(question: string, context: string = ''): Promise<string> {
    try {
      const prompt = `As an educational AI assistant, answer the following question:
      
Question: ${question}

${context ? `Context: ${context}` : ''}

Provide a thorough, helpful, and accurate response.`;
      
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
      console.error('Error in getAIAssistantResponse:', error);
      throw new Error('Failed to generate AI assistant response');
    }
  },

  /**
   * Generates course recommendations based on user profile
   */
  async getCourseRecommendations(userProfile: any, courses: any[]): Promise<any[]> {
    try {
      // Format user profile and courses into a string for the AI
      const userProfileStr = JSON.stringify(userProfile);
      const coursesStr = JSON.stringify(courses.slice(0, 10)); // Limit to 10 for prompt size
      
      const prompt = `You are an AI course recommendation system. Based on the user profile and available courses, recommend 3-5 courses that would be most relevant.

User Profile:
${userProfileStr}

Available Courses:
${coursesStr}

Provide your recommendations as a JSON array with these properties for each course:
* id: number (use the id from the available courses)
* title: string (use the title from the available courses)
* description: string (use the description from the available courses)
* reasonForRecommendation: string explaining why this course is recommended based on user profile

JSON:`;

      const response = await hf.textGeneration({
        model: 'HuggingFaceH4/zephyr-7b-beta',
        inputs: prompt,
        parameters: {
          max_new_tokens: 1000,
          temperature: 0.7,
          return_full_text: false,
        },
      });

      // Extract JSON from the response
      const jsonMatch = response.generated_text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        // If no valid JSON is found, create a default response
        return courses.slice(0, 5).map(course => ({
          ...course,
          reasonForRecommendation: "This course aligns with your learning goals."
        }));
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error in getCourseRecommendations:', error);
      // Return some default recommendations on error
      return courses.slice(0, 5).map(course => ({
        ...course,
        reasonForRecommendation: "This course aligns with your learning goals."
      }));
    }
  },

  /**
   * Analyzes trending topics and provides insights
   */
  async analyzeTrendingTopics(topics: any[]): Promise<string> {
    try {
      const topicsStr = JSON.stringify(topics);
      
      const prompt = `Analyze the following trending educational topics and provide insights:

Trending Topics:
${topicsStr}

Provide an analysis that includes:
1. Key patterns or themes across trending topics
2. Possible reasons for these trends
3. How these trends relate to industry or technological developments
4. What these trends might mean for learners and educators
5. Predictions for future educational trends based on this data`;

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
      console.error('Error in analyzeTrendingTopics:', error);
      throw new Error('Failed to analyze trending topics');
    }
  },

  /**
   * Generates a career path based on user interests and goals
   */
  async generateCareerPath(field: string, currentSkills: string[], careerGoals: string): Promise<any> {
    try {
      const skillsStr = currentSkills.join(", ");
      
      const prompt = `Generate a detailed career path for someone in the ${field} field.

Current Skills: ${skillsStr}
Career Goals: ${careerGoals}

Create a structured career progression path that includes:
1. A series of 5-7 career stages or roles (from entry-level to advanced)
2. Key skills to develop at each stage
3. Recommended learning resources or certifications
4. Approximate time frame for each stage
5. Potential challenges and how to overcome them

Respond in JSON format with these fields:
* title: string with an appropriate title for this career path
* description: string with an overview of this career journey
* stages: array of objects, each with:
  * level: string indicating the career level (e.g., "Entry-Level", "Mid-Level")
  * role: string with the job title
  * description: string describing the role
  * skills: array of strings listing key skills to develop
  * resources: array of strings with recommended learning resources
  * timeframe: string with the typical time spent in this role
  * challenges: string describing common challenges
  * tips: string with advice for success

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
      console.error('Error in generateCareerPath:', error);
      throw new Error('Failed to generate career path');
    }
  },

  /**
   * Verifies user certification completions
   */
  async verifyCertification(courseTitle: string, courseContent: string, userSubmission: string): Promise<any> {
    try {
      const prompt = `Evaluate whether the user has sufficiently completed the requirements for certification in the course.

Course Title: ${courseTitle}
Course Content/Requirements: ${courseContent}
User Submission: ${userSubmission}

Assess whether the user's submission demonstrates:
1. Understanding of core course concepts
2. Ability to apply the learned material
3. Completion of all required elements
4. Sufficient quality and depth

Respond in JSON format with these fields:
* passed: boolean indicating if certification requirements are met
* score: number from 0-100 indicating the assessment score
* feedback: string with detailed feedback
* strengths: array of strings listing submission strengths
* improvements: array of strings suggesting areas for improvement

JSON:`;

      const response = await hf.textGeneration({
        model: 'HuggingFaceH4/zephyr-7b-beta',
        inputs: prompt,
        parameters: {
          max_new_tokens: 800,
          temperature: 0.5,
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
      console.error('Error in verifyCertification:', error);
      throw new Error('Failed to verify certification');
    }
  },
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