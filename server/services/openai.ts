import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * AI Learning Assistant - Answers questions about course material
 */
export async function getAIAssistantResponse(
  question: string, 
  courseContext: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI learning assistant for the Luminate platform. 
          You help students understand complex concepts and answer their questions about course material.
          Be concise, accurate, and helpful. Use the provided course context to tailor your response.
          If you don't know an answer, admit it and suggest where the student might find more information.`
        },
        {
          role: "user",
          content: `Course Context: ${courseContext}\n\nQuestion: ${question}`
        }
      ],
      max_tokens: 500,
    });

    return response.choices[0].message.content || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error getting AI assistant response:", error);
    throw new Error("Failed to get AI assistant response");
  }
}

/**
 * AI Course Recommendations - Suggests courses based on user interests and profile
 */
export async function getCourseRecommendations(
  userProfile: {
    completedCourses: string[];
    interests: string[];
    learningStyle: string;
    skillLevel: string;
  },
  availableCourses: any[]
): Promise<any[]> {
  try {
    const formattedUserProfile = JSON.stringify(userProfile);
    const formattedCourses = JSON.stringify(availableCourses);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI course recommendation system for the Luminate learning platform.
          Your task is to recommend the most relevant courses for a user based on their profile, 
          interests, learning style, and skill level. Return exactly 5 course recommendations as a JSON array.`
        },
        {
          role: "user",
          content: `User Profile: ${formattedUserProfile}\n\nAvailable Courses: ${formattedCourses}\n\nProvide 5 course recommendations as a JSON array of objects with course_id, title, and reason_for_recommendation fields.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    // Handle null content safely with type assertion
    const content = response.choices[0].message.content ?? '{"recommendations": []}';
    const recommendations = JSON.parse(content as string);
    return recommendations.recommendations || [];
  } catch (error) {
    console.error("Error getting course recommendations:", error);
    throw new Error("Failed to get course recommendations");
  }
}

/**
 * AI Content Summarization - Generates summaries of course materials
 */
export async function generateContentSummary(
  courseContent: string,
  summaryType: 'brief' | 'detailed' | 'key_points' = 'brief'
): Promise<string> {
  try {
    let promptInstruction = '';
    
    switch (summaryType) {
      case 'brief':
        promptInstruction = 'Create a concise summary in 3-5 sentences.';
        break;
      case 'detailed':
        promptInstruction = 'Create a comprehensive summary covering all major points and subpoints.';
        break;
      case 'key_points':
        promptInstruction = 'Extract and list the 5-7 most important key points as bullet points.';
        break;
      default:
        promptInstruction = 'Create a concise summary in 3-5 sentences.';
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI content summarizer for the Luminate learning platform. 
          Your task is to summarize course content in a way that helps students quickly understand the material.
          ${promptInstruction}`
        },
        {
          role: "user",
          content: `Course Content to Summarize: ${courseContent}`
        }
      ],
      max_tokens: 800,
    });

    // Handle null content safely with type assertion
    return response.choices[0].message.content ?? "I couldn't generate a summary. Please try again.";
  } catch (error) {
    console.error("Error generating content summary:", error);
    throw new Error("Failed to generate content summary");
  }
}

/**
 * AI Personalized Learning Path - Generates a custom learning path based on goals
 */
export async function generateLearningPath(
  userGoal: string,
  userSkillLevel: string,
  availableCourses: any[]
): Promise<any> {
  try {
    const formattedCourses = JSON.stringify(availableCourses);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI learning path generator for Luminate. 
          Create a personalized sequential learning path that will help the user achieve their learning goal.
          The path should include specific courses from the available list and a timeline.`
        },
        {
          role: "user",
          content: `User Goal: ${userGoal}\nUser Skill Level: ${userSkillLevel}\n\nAvailable Courses: ${formattedCourses}\n\nGenerate a structured learning path as a JSON object with title, description, estimated_completion_time, and steps array (each step having course_id, title, and description).`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    // Handle null content safely with type assertion
    const content = response.choices[0].message.content ?? '{}';
    return JSON.parse(content as string);
  } catch (error) {
    console.error("Error generating learning path:", error);
    throw new Error("Failed to generate learning path");
  }
}