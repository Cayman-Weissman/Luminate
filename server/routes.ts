import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import bcrypt from "bcryptjs";
import "./types"; // Import types to extend Express Request
import { 
  insertUserSchema, 
  insertPostSchema,
  insertUserCourseSchema
} from "@shared/schema";
import { 
  getAIAssistantResponse,
  getCourseRecommendations,
  generateContentSummary,
  generateLearningPath,
  verifyAnswer,
  analyzeTrendingTopics,
  generateCareerPath,
  generateQuiz,
  analyzeProgress,
  generateCourseContent,
  verifyCertification
} from "./services/openai";
import {
  authenticateUser,
  registerUser,
  requireAuth,
  verifyToken,
  extractTokenFromHeader,
  generateToken
} from "./services/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // No session middleware needed for JWT
  console.log("JWT authentication configured");

  const httpServer = createServer(app);
  
  // Authentication middleware for protected routes
  const isAuthenticated = requireAuth;

  // Set up WebSocket server for real-time features if needed

  // ====== Authentication Routes ======
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      try {
        // Register user using the auth service
        const newUser = await registerUser(
          validatedData.username, 
          validatedData.email, 
          validatedData.password
        );
        
        // Generate token for the new user
        const token = generateToken(newUser);
        
        // Remove password from response
        const { password, ...userResponse } = newUser;
        
        return res.status(201).json({
          user: userResponse,
          token
        });
      } catch (error) {
        // Handle specific registration errors
        const authError = error as Error;
        if (authError.message === 'Username already exists' || 
            authError.message === 'Email already exists') {
          return res.status(400).json({ message: authError.message });
        }
        throw error; // Re-throw if it's another error
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error('Registration error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      console.log("Login attempt with:", req.body);
      const { username, password } = req.body;
      
      // Validate input
      if (!username || !password) {
        console.log("Missing username or password");
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      try {
        // Authenticate user with JWT
        const { user, token } = await authenticateUser(username, password);
        console.log("User authenticated:", user.username);
        
        // Remove password from response
        const { password: _, ...userResponse } = user;
        
        // Return user data with token
        return res.status(200).json({
          user: userResponse,
          token
        });
      } catch (error) {
        const authError = error as Error;
        console.error("Authentication error:", authError.message);
        return res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    // For JWT, the client should discard the token
    // The server can't invalidate the token without additional infrastructure (like a token blacklist)
    return res.status(200).json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      // Extract token from authorization header
      const token = extractTokenFromHeader(req.headers.authorization);
      console.log("Auth check - Token received:", !!token);
      
      if (!token) {
        console.log("No token provided");
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Verify token
      const decoded = verifyToken(token);
      if (!decoded || !decoded.id) {
        console.log("Invalid token");
        return res.status(401).json({ message: "Invalid or expired token" });
      }
      
      // Get fresh user data
      console.log("Looking up user with ID:", decoded.id);
      const user = await storage.getUser(decoded.id);
      
      if (!user) {
        console.log("User not found for ID:", decoded.id);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log("User found:", user.username);
      
      // Remove password from response
      const { password, ...userResponse } = user;
      
      return res.status(200).json(userResponse);
    } catch (error) {
      console.error("Error in /auth/me:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // ====== User Routes ======
  app.get("/api/user/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // If req.user is undefined, middleware should have already returned an error
      const userId = req.user!.id; // Use non-null assertion as requireAuth guarantees req.user exists
      
      // Return demo stats for now
      const stats = [
        {
          id: 1,
          title: "Learning Streak",
          value: "14 Days",
          icon: "ri-fire-fill",
          iconBgColor: "bg-primary/10",
          iconColor: "text-primary",
          progress: 75,
          subtitle: "Keep going! 7 more days to beat your record"
        },
        {
          id: 2,
          title: "Hours Learned",
          value: "23.5 Hours",
          icon: "ri-time-line",
          iconBgColor: "bg-blue-500/10",
          iconColor: "text-blue-500",
          progress: 60,
          subtitle: "+5.2 hours from last week"
        },
        {
          id: 3,
          title: "Achievements",
          value: "12 Badges",
          icon: "ri-medal-line",
          iconBgColor: "bg-primary/10",
          iconColor: "text-primary",
          progress: 40,
          subtitle: "3 new badges this month"
        }
      ];
      
      return res.status(200).json(stats);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user/courses/active", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // If req.user is undefined, middleware should have already returned an error
      const userId = req.user!.id; // Use non-null assertion as requireAuth guarantees req.user exists
      
      // Return demo active courses for now
      const activeCourses = [
        {
          id: 1,
          title: "Machine Learning Fundamentals",
          category: "AI & Data",
          description: "Learn how to build intelligent systems with Python and TensorFlow",
          timeLeft: "4h 30m",
          progress: 64,
          image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=300&q=80"
        },
        {
          id: 2,
          title: "Full-Stack Web Development",
          category: "Programming",
          description: "Master modern web technologies from frontend to backend",
          timeLeft: "12h 45m",
          progress: 25,
          image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=300&q=80"
        },
        {
          id: 3,
          title: "UX Design Principles",
          category: "Design",
          description: "Create intuitive user experiences with modern design techniques",
          timeLeft: "1h 15m",
          progress: 88,
          image: "https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=300&q=80"
        }
      ];
      
      return res.status(200).json(activeCourses);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user/roadmap", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id; // From JWT middleware
      
      // Return demo roadmap for now
      const roadmap = {
        title: "Data Science Career Path",
        progress: 32,
        items: [
          {
            id: 1,
            title: "Python Programming Basics",
            status: "completed",
            completedDate: "May 15, 2023"
          },
          {
            id: 2,
            title: "Data Analysis with Pandas",
            status: "completed",
            completedDate: "June 22, 2023"
          },
          {
            id: 3,
            title: "Machine Learning Fundamentals",
            status: "in-progress",
            progress: 64
          },
          {
            id: 4,
            title: "Deep Learning and Neural Networks",
            status: "locked"
          },
          {
            id: 5,
            title: "Applied Data Science Projects",
            status: "locked"
          }
        ]
      };
      
      return res.status(200).json(roadmap);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // ====== Trending Routes ======
  app.get("/api/trending/ticker", async (req: Request, res: Response) => {
    try {
      const trendingItems = await storage.getTrendingTicker();
      return res.status(200).json(trendingItems);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/trending/topics", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const topics = await storage.getTrendingTopics(category);
      return res.status(200).json(topics);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // ====== Community Routes ======
  app.get("/api/community/posts", async (req: Request, res: Response) => {
    try {
      const tab = req.query.tab as string || 'popular';
      const posts = await storage.getPosts(tab);
      return res.status(200).json(posts);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/community/posts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id; // From JWT middleware
      
      const validatedData = insertPostSchema.parse({
        ...req.body,
        authorId: userId
      });
      
      const newPost = await storage.createPost(validatedData);
      return res.status(201).json(newPost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/community/posts/:id/like", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id; // From JWT middleware
      const postId = parseInt(req.params.id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      await storage.likePost(userId, postId);
      return res.status(200).json({ message: "Post liked successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/community/posts/:id/like", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id; // From JWT middleware
      const postId = parseInt(req.params.id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      await storage.unlikePost(userId, postId);
      return res.status(200).json({ message: "Post unliked successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/community/contributors", async (req: Request, res: Response) => {
    try {
      // For demonstration, return simple contributors data
      const contributors = [
        {
          id: 1,
          name: "Michael Wei",
          username: "michaelw",
          points: 4356,
          rank: 1,
          avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80",
          badges: [
            { id: 1, filled: true },
            { id: 2, filled: true },
            { id: 3, filled: true }
          ]
        },
        {
          id: 2,
          name: "Sarah Chen",
          username: "sarahc",
          points: 3892,
          rank: 2,
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80",
          badges: [
            { id: 1, filled: true },
            { id: 2, filled: true },
            { id: 3, filled: false }
          ]
        },
        {
          id: 3,
          name: "Alex Johnson",
          username: "alexj",
          points: 3241,
          rank: 3,
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80",
          badges: [
            { id: 1, filled: true },
            { id: 2, filled: false },
            { id: 3, filled: false }
          ]
        }
      ];
      
      return res.status(200).json(contributors);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // ====== Courses Routes ======
  app.get("/api/courses", async (req: Request, res: Response) => {
    try {
      const tab = req.query.tab as string || 'all';
      const searchQuery = req.query.searchQuery as string || '';
      
      // Demo courses
      const courses = [
        {
          id: 1,
          title: "Machine Learning Fundamentals",
          category: "AI & Data",
          description: "Learn how to build intelligent systems with Python and TensorFlow",
          timeLeft: "4h 30m",
          progress: 64,
          image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=300&q=80"
        },
        {
          id: 2,
          title: "Full-Stack Web Development",
          category: "Programming",
          description: "Master modern web technologies from frontend to backend",
          timeLeft: "12h 45m",
          progress: 25,
          image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=300&q=80"
        },
        {
          id: 3,
          title: "UX Design Principles",
          category: "Design",
          description: "Create intuitive user experiences with modern design techniques",
          timeLeft: "1h 15m",
          progress: 88,
          image: "https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=300&q=80"
        },
        {
          id: 4,
          title: "Cybersecurity Fundamentals",
          category: "Technology",
          description: "Learn to protect systems and networks from digital attacks",
          timeLeft: "8h 20m",
          progress: 15,
          image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=300&q=80"
        },
        {
          id: 5,
          title: "Data Science with Python",
          category: "Technology",
          description: "Master data analysis, visualization, and machine learning",
          timeLeft: "10h 30m",
          progress: 32,
          image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=300&q=80"
        },
        {
          id: 6,
          title: "Mobile App Development",
          category: "Programming",
          description: "Build cross-platform mobile apps with React Native",
          timeLeft: "15h 45m",
          progress: 10,
          image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=300&q=80"
        }
      ];
      
      // Filter courses based on tab and search query
      let filteredCourses = courses;
      
      if (tab && tab !== 'all') {
        filteredCourses = filteredCourses.filter(course => 
          course.category.toLowerCase() === tab.toLowerCase()
        );
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredCourses = filteredCourses.filter(course => 
          course.title.toLowerCase().includes(query) || 
          course.description.toLowerCase().includes(query)
        );
      }
      
      return res.status(200).json(filteredCourses);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // ====== Premium Features Routes ======
  app.get("/api/premium/features", async (req: Request, res: Response) => {
    try {
      const features = await storage.getPremiumFeatures();
      return res.status(200).json(features);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // ====== Testimonials Routes ======
  app.get("/api/testimonials", async (req: Request, res: Response) => {
    try {
      const testimonials = await storage.getTestimonials();
      return res.status(200).json(testimonials);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // ====== AI Services Routes ======
  
  // AI Learning Assistant 
  app.post("/api/ai/assistant", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { question, courseId } = req.body;
      
      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }
      
      let courseContext = "";
      
      if (courseId) {
        const course = await storage.getCourse(parseInt(courseId));
        if (course) {
          courseContext = `Course Title: ${course.title}
Description: ${course.description}
Category: ${course.category}
Difficulty: ${course.difficulty}`;
        }
      }
      
      const response = await getAIAssistantResponse(question, courseContext);
      return res.status(200).json({ answer: response });
    } catch (error) {
      console.error("AI Assistant error:", error);
      return res.status(500).json({ message: "Failed to get AI assistant response" });
    }
  });

  // AI Course Recommendations
  app.get("/api/ai/recommendations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id; // From JWT middleware
      
      // Get completed courses
      const userCourses = await storage.getUserCourses(userId);
      const completedCourseIds = userCourses
        .filter(uc => uc.progress === 100)
        .map(uc => uc.course.title);
      
      // Get all available courses
      const allCourses = await storage.getCourses();
      
      // Setup user profile for recommendations
      const userProfile = {
        completedCourses: completedCourseIds,
        interests: ["web development", "data science", "machine learning"],
        learningStyle: "visual",
        skillLevel: "intermediate"
      };
      
      const recommendations = await getCourseRecommendations(userProfile, allCourses);
      return res.status(200).json(recommendations);
    } catch (error) {
      console.error("AI Recommendations error:", error);
      return res.status(500).json({ message: "Failed to get AI course recommendations" });
    }
  });

  // AI Content Summarization
  app.post("/api/ai/summarize", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { content, type = "brief" } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      if (!["brief", "detailed", "key_points"].includes(type)) {
        return res.status(400).json({ message: "Type must be 'brief', 'detailed', or 'key_points'" });
      }
      
      const summary = await generateContentSummary(content, type as 'brief' | 'detailed' | 'key_points');
      return res.status(200).json({ summary });
    } catch (error) {
      console.error("AI Summarization error:", error);
      return res.status(500).json({ message: "Failed to generate content summary" });
    }
  });
  
  // New AI endpoints for additional features
  
  app.post("/api/ai/learning-path", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { userGoal, userSkillLevel, availableCourses } = req.body;
      
      if (!userGoal || !userSkillLevel) {
        return res.status(400).json({ message: "User goal and skill level are required" });
      }
      
      const courses = Array.isArray(availableCourses) ? availableCourses : await storage.getCourses();
      const learningPath = await generateLearningPath(userGoal, userSkillLevel, courses);
      
      return res.status(200).json(learningPath);
    } catch (error) {
      console.error("Error generating learning path:", error);
      return res.status(500).json({ message: "Failed to generate learning path" });
    }
  });
  
  app.post("/api/ai/verify-answer", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { question, userAnswer, courseContext } = req.body;
      
      if (!question || !userAnswer) {
        return res.status(400).json({ message: "Question and user answer are required" });
      }
      
      const verification = await verifyAnswer(question, userAnswer, courseContext || "");
      
      return res.status(200).json(verification);
    } catch (error) {
      console.error("Error verifying answer:", error);
      return res.status(500).json({ message: "Failed to verify answer" });
    }
  });
  
  app.post("/api/ai/trending-analysis", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { recentUserActivities, globalTrends } = req.body;
      
      if (!Array.isArray(recentUserActivities)) {
        return res.status(400).json({ message: "Recent user activities must be an array" });
      }
      
      const analysis = await analyzeTrendingTopics(
        recentUserActivities, 
        Array.isArray(globalTrends) ? globalTrends : []
      );
      
      return res.status(200).json(analysis);
    } catch (error) {
      console.error("Error analyzing trending topics:", error);
      return res.status(500).json({ message: "Failed to analyze trending topics" });
    }
  });
  
  app.post("/api/ai/career-path", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { userSkills, careerGoal, timeframe, currentPosition } = req.body;
      
      if (!Array.isArray(userSkills) || !careerGoal || !timeframe) {
        return res.status(400).json({ message: "User skills, career goal, and timeframe are required" });
      }
      
      const careerPath = await generateCareerPath(
        userSkills, 
        careerGoal, 
        timeframe, 
        currentPosition || ""
      );
      
      return res.status(200).json(careerPath);
    } catch (error) {
      console.error("Error generating career path:", error);
      return res.status(500).json({ message: "Failed to generate career path" });
    }
  });
  
  app.post("/api/ai/quiz", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { courseContent, difficulty, questionCount, focusTopics } = req.body;
      
      if (!courseContent || !difficulty) {
        return res.status(400).json({ message: "Course content and difficulty are required" });
      }
      
      const quiz = await generateQuiz(
        courseContent,
        difficulty as ('beginner' | 'intermediate' | 'advanced'),
        questionCount || 5,
        Array.isArray(focusTopics) ? focusTopics : []
      );
      
      return res.status(200).json(quiz);
    } catch (error) {
      console.error("Error generating quiz:", error);
      return res.status(500).json({ message: "Failed to generate quiz" });
    }
  });
  
  app.post("/api/ai/analyze-progress", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { user } = req.body;
      
      if (!user || !user.completedCourses || !user.inProgressCourses) {
        return res.status(400).json({ message: "Valid user data with courses information is required" });
      }
      
      const progressAnalysis = await analyzeProgress(user);
      
      return res.status(200).json(progressAnalysis);
    } catch (error) {
      console.error("Error analyzing progress:", error);
      return res.status(500).json({ message: "Failed to analyze progress" });
    }
  });
  
  app.post("/api/ai/course-content", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { topic, format, targetAudience, specificFocus, existingContent } = req.body;
      
      if (!topic || !format || !targetAudience) {
        return res.status(400).json({ message: "Topic, format, and target audience are required" });
      }
      
      const courseContent = await generateCourseContent(
        topic,
        format as ('lesson' | 'article' | 'tutorial' | 'exercise'),
        targetAudience as ('beginner' | 'intermediate' | 'advanced'),
        Array.isArray(specificFocus) ? specificFocus : [],
        existingContent || ""
      );
      
      return res.status(200).json(courseContent);
    } catch (error) {
      console.error("Error generating course content:", error);
      return res.status(500).json({ message: "Failed to generate course content" });
    }
  });
  
  app.post("/api/ai/verify-certification", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { courseContent, userResponses, certificationLevel } = req.body;
      
      if (!courseContent || !Array.isArray(userResponses) || !certificationLevel) {
        return res.status(400).json({ 
          message: "Course content, user responses array, and certification level are required" 
        });
      }
      
      const certificationResult = await verifyCertification(
        courseContent,
        userResponses,
        certificationLevel as ('basic' | 'intermediate' | 'expert')
      );
      
      return res.status(200).json(certificationResult);
    } catch (error) {
      console.error("Error verifying certification:", error);
      return res.status(500).json({ message: "Failed to verify certification" });
    }
  });

  return httpServer;
}
