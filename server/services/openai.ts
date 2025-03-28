import OpenAI from "openai";
import type { Course, User } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Default model for text generation
const TEXT_MODEL = "gpt-4o";

/**
 * AI Learning Assistant - Answers questions about course material
 */
export async function getAIAssistantResponse(
  question: string, 
  courseContext: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: TEXT_MODEL,
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
      model: TEXT_MODEL,
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
      model: TEXT_MODEL,
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
      model: TEXT_MODEL,
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

/**
 * AI Verified Community Answers - Validates and enhances community answers
 */
export async function verifyAnswer(
  question: string,
  userAnswer: string,
  courseContext: string = ""
): Promise<{
  isAccurate: boolean;
  confidence: number;
  enhancedAnswer?: string;
  correction?: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an AI answer verification system for the Luminate learning platform.
          Your task is to assess the accuracy of user-provided answers to questions.
          Rate the answer's accuracy, provide a confidence score, and offer enhancements or corrections.`
        },
        {
          role: "user",
          content: `Question: ${question}\n\nUser Answer: ${userAnswer}\n\nCourse Context: ${courseContext}\n\nVerify this answer and provide assessment as a JSON object with isAccurate (boolean), confidence (number between 0-1), enhancedAnswer (string, only if generally correct), and correction (string, only if incorrect).`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    // Handle null content safely
    const content = response.choices[0].message.content ?? '{"isAccurate": false, "confidence": 0}';
    return JSON.parse(content as string);
  } catch (error) {
    console.error("Error verifying answer:", error);
    throw new Error("Failed to verify answer");
  }
}

/**
 * AI Trending Topic Analysis - Identifies and ranks trending educational topics
 */
export async function analyzeTrendingTopics(
  recentUserActivities: string[], // Array of recent user searches, course enrollments, etc.
  globalTrends: string[] = [] // Optional external trending topics
): Promise<{
  trendingTopics: Array<{
    topic: string;
    score: number;
    category: string;
    description: string;
    relatedSkills: string[];
    changeDirection: 'up' | 'down' | 'stable';
  }>;
}> {
  try {
    const userActivitiesStr = JSON.stringify(recentUserActivities);
    const globalTrendsStr = JSON.stringify(globalTrends);

    const response = await openai.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an AI trending topic analyzer for the Luminate learning platform.
          Your task is to identify educational topics that are currently trending based on user activities.
          Rank topics by relevance, categorize them, and provide insights.`
        },
        {
          role: "user",
          content: `Recent User Activities: ${userActivitiesStr}\n\nGlobal Trends: ${globalTrendsStr}\n\nIdentify the top trending topics as a JSON object containing a trendingTopics array with each topic having: topic, score (0-100), category, description, relatedSkills array, and changeDirection ('up', 'down', or 'stable').`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    // Handle null content safely with type assertion
    const content = response.choices[0].message.content ?? '{"trendingTopics": []}';
    return JSON.parse(content as string);
  } catch (error) {
    console.error("Error analyzing trending topics:", error);
    throw new Error("Failed to analyze trending topics");
  }
}

/**
 * AI Career Path Generator - Creates career roadmaps based on skills and goals
 */
export async function generateCareerPath(
  userSkills: string[],
  careerGoal: string,
  timeframe: string,
  currentPosition: string = ""
): Promise<{
  roadmap: Array<{
    stage: number;
    title: string;
    description: string;
    requiredSkills: string[];
    learningResources: Array<{ type: string; name: string; description: string; }>;
    estimatedTimeToComplete: string;
  }>;
  totalEstimatedTime: string;
  potentialRoles: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an AI career path generator for the Luminate learning platform.
          Your task is to create a personalized career roadmap to help users achieve their professional goals.
          Provide a step-by-step roadmap with required skills, resources, and timeline.`
        },
        {
          role: "user",
          content: `User Skills: ${JSON.stringify(userSkills)}\nCareer Goal: ${careerGoal}\nTimeframe: ${timeframe}\nCurrent Position: ${currentPosition}\n\nGenerate a career roadmap as a JSON object with roadmap array (each having stage, title, description, requiredSkills array, learningResources array, estimatedTimeToComplete), totalEstimatedTime, and potentialRoles array.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
    });

    // Handle null content safely with type assertion
    const content = response.choices[0].message.content ?? '{"roadmap": [], "totalEstimatedTime": "Unknown", "potentialRoles": []}';
    return JSON.parse(content as string);
  } catch (error) {
    console.error("Error generating career path:", error);
    throw new Error("Failed to generate career path");
  }
}

/**
 * AI Quiz Generator - Creates adaptive assessment questions based on course content
 */
export async function generateQuiz(
  courseContent: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  questionCount: number = 5,
  focusTopics: string[] = []
): Promise<{
  quiz: Array<{
    id: number;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    difficulty: string;
    topic: string;
  }>;
}> {
  try {
    const focusTopicsStr = focusTopics.length > 0 ? JSON.stringify(focusTopics) : "all topics";

    const response = await openai.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an AI quiz generator for the Luminate learning platform.
          Your task is to create challenging and educational quiz questions based on course content.
          Generate questions that test understanding, not just memorization.`
        },
        {
          role: "user",
          content: `Course Content: ${courseContent}\nDifficulty: ${difficulty}\nQuestion Count: ${questionCount}\nFocus Topics: ${focusTopicsStr}\n\nGenerate a quiz as a JSON object with a quiz array containing ${questionCount} questions (each with id, question, options array, correctAnswer, explanation, difficulty, and topic).`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    // Handle null content safely with type assertion
    const content = response.choices[0].message.content ?? '{"quiz": []}';
    return JSON.parse(content as string);
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz");
  }
}

/**
 * AI Progress Analyzer - Evaluates user learning progress and provides insights
 */
export async function analyzeProgress(
  user: {
    completedCourses: Array<{ title: string; score: number; completedAt: string }>;
    inProgressCourses: Array<{ title: string; progress: number; lastActivity: string }>;
    learningGoals: string[];
    strengths: string[];
    weaknesses: string[];
  }
): Promise<{
  overallProgress: number;
  insights: string[];
  recommendations: Array<{ type: string; description: string; priority: 'high' | 'medium' | 'low' }>;
  projectedTimeline: string;
}> {
  try {
    const userDataStr = JSON.stringify(user);

    const response = await openai.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an AI progress analyzer for the Luminate learning platform.
          Your task is to evaluate a user's learning progress, provide insights, and make recommendations
          to help them achieve their learning goals more effectively.`
        },
        {
          role: "user",
          content: `User Data: ${userDataStr}\n\nAnalyze this user's learning progress and provide feedback as a JSON object with overallProgress (0-100), insights array, recommendations array (each with type, description, priority), and projectedTimeline.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1200,
    });

    // Handle null content safely with type assertion
    const content = response.choices[0].message.content ?? '{"overallProgress": 0, "insights": [], "recommendations": [], "projectedTimeline": "Unknown"}';
    return JSON.parse(content as string);
  } catch (error) {
    console.error("Error analyzing progress:", error);
    throw new Error("Failed to analyze progress");
  }
}

/**
 * AI Course Content Generator - Creates educational content for new topics
 */
export async function generateCourseContent(
  topic: string,
  format: 'lesson' | 'article' | 'tutorial' | 'exercise',
  targetAudience: 'beginner' | 'intermediate' | 'advanced',
  specificFocus: string[] = [],
  existingContent: string = ""
): Promise<{
  title: string;
  description: string;
  content: string;
  estimatedReadingTime: string;
  learningObjectives: string[];
  keyTakeaways: string[];
  references: Array<{ title: string; url: string; type: string }>;
}> {
  try {
    const focusStr = specificFocus.length > 0 ? JSON.stringify(specificFocus) : "general overview";

    const response = await openai.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an AI course content generator for the Luminate learning platform.
          Your task is to create engaging, educational, and accurate content for learners.
          Focus on clarity, accuracy, and a teaching style that promotes deep understanding.`
        },
        {
          role: "user",
          content: `Topic: ${topic}
Format: ${format}
Target Audience: ${targetAudience}
Specific Focus: ${focusStr}
Existing Content (if expanding): ${existingContent}

Generate comprehensive educational content as a JSON object with title, description, content (formatted text with sections and subsections), estimatedReadingTime, learningObjectives array, keyTakeaways array, and references array (each with title, url, and type).`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 3000,
    });

    // Handle null content safely with type assertion
    const content = response.choices[0].message.content ?? '{}';
    return JSON.parse(content as string);
  } catch (error) {
    console.error("Error generating course content:", error);
    throw new Error("Failed to generate course content");
  }
}

/**
 * AI Certification Verification - Validates user knowledge for certification
 */
export async function verifyCertification(
  courseContent: string,
  userResponses: Array<{ question: string; answer: string }>,
  certificationLevel: 'basic' | 'intermediate' | 'expert'
): Promise<{
  passed: boolean;
  score: number;
  feedback: string;
  strengths: string[];
  areasForImprovement: string[];
  nextSteps: string;
  certificateId?: string;
}> {
  try {
    const responsesStr = JSON.stringify(userResponses);
    const passingScores = {
      basic: 0.7,      // 70% to pass basic certification
      intermediate: 0.8, // 80% to pass intermediate
      expert: 0.9        // 90% to pass expert
    };

    const response = await openai.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an AI certification verification system for the Luminate learning platform.
          Your task is to evaluate user assessment responses and determine if they qualify for certification.
          Be fair but thorough in your evaluation. Basic certification requires ${passingScores.basic * 100}% accuracy,
          Intermediate requires ${passingScores.intermediate * 100}%, and Expert requires ${passingScores.expert * 100}%.`
        },
        {
          role: "user",
          content: `Course Content Summary: ${courseContent}
Certification Level: ${certificationLevel}
User Assessment Responses: ${responsesStr}

Evaluate these responses and provide results as a JSON object with passed (boolean), score (number between 0-1), feedback (string), strengths array, areasForImprovement array, nextSteps (string), and certificateId (string, only if passed).`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
    });

    // Handle null content safely with type assertion
    const content = response.choices[0].message.content ?? '{"passed": false, "score": 0, "feedback": "Evaluation failed", "strengths": [], "areasForImprovement": [], "nextSteps": "Try again later"}';
    const result = JSON.parse(content as string);
    
    // Generate a real certificate ID if passed but none provided
    if (result.passed && !result.certificateId) {
      const certPrefix = certificationLevel.substring(0, 3).toUpperCase();
      const timestamp = Date.now().toString(36);
      const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
      result.certificateId = `${certPrefix}-${timestamp}-${randomChars}`;
    }
    
    return result;
  } catch (error) {
    console.error("Error verifying certification:", error);
    throw new Error("Failed to verify certification");
  }
}