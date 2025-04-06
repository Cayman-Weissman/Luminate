import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import bcrypt from "bcryptjs";
import "./types"; // Import types to extend Express Request
import { 
  insertUserSchema, 
  insertPostSchema,
  insertUserCourseSchema,
  InsertUserStat,
  interactiveCourses
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./database";
import { AiService } from "./services/ai-service";
import {
  authenticateUser,
  registerUser,
  requireAuth,
  verifyToken,
  extractTokenFromHeader,
  generateToken
} from "./services/auth";
import { generateTopicContent, generateTopicLearningPath, generateTopicQuiz } from "./services/huggingface-service";

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
      
      // Get the actual user stats from database
      const userStats = await storage.getUserStats(userId);
      
      if (!userStats) {
        // Create initial stats for the user
        const currentDate = new Date();
        const initialStats: InsertUserStat = {
          userId,
          streak: 0,
          hoursLearned: 0,
          completedCourses: 0
        };
        
        await storage.createUserStats(initialStats);
        
        // Return the newly created stats in the format expected by the frontend
        return res.status(200).json([
          {
            id: 1,
            title: "Learning Streak",
            value: "0 Days",
            icon: "ri-fire-fill",
            iconBgColor: "bg-primary/10",
            iconColor: "text-primary",
            progress: 0,
            subtitle: "Start your learning journey!"
          },
          {
            id: 2,
            title: "Hours Learned",
            value: "0 Hours",
            icon: "ri-time-line",
            iconBgColor: "bg-blue-500/10",
            iconColor: "text-blue-500",
            progress: 0,
            subtitle: "Begin tracking your progress"
          },
          {
            id: 3,
            title: "Achievements",
            value: "0 Badges",
            icon: "ri-medal-line",
            iconBgColor: "bg-primary/10",
            iconColor: "text-primary",
            progress: 0,
            subtitle: "Earn your first badge!"
          }
        ]);
      }
      
      // Format stats for frontend
      const formattedStats = [
        {
          id: 1,
          title: "Learning Streak",
          value: `${userStats.streak} Days`,
          icon: "ri-fire-fill",
          iconBgColor: "bg-primary/10",
          iconColor: "text-primary",
          progress: Math.min(100, userStats.streak * 5), // 5% per day, max 100%
          subtitle: userStats.streak > 7 ? 
                    `Keep going! ${(userStats.streak + 7) % 30} more days to beat your record` : 
                    "Build your learning habit"
        },
        {
          id: 2,
          title: "Hours Learned",
          value: `${userStats.hoursLearned.toFixed(1)} Hours`,
          icon: "ri-time-line",
          iconBgColor: "bg-blue-500/10",
          iconColor: "text-blue-500",
          progress: Math.min(100, userStats.hoursLearned * 2), // 2% per hour, max 100%
          subtitle: "Total study time"
        },
        {
          id: 3,
          title: "Achievements",
          value: `${userStats.completedCourses} Completions`,
          icon: "ri-medal-line",
          iconBgColor: "bg-primary/10",
          iconColor: "text-primary",
          progress: Math.min(100, userStats.completedCourses * 10), // 10% per completion, max 100%
          subtitle: userStats.completedCourses > 0 ? 
                    `${userStats.completedCourses} courses completed` : 
                    "Complete your first course!"
        }
      ];
      
      return res.status(200).json(formattedStats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user/courses/active", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // If req.user is undefined, middleware should have already returned an error
      const userId = req.user!.id; // Use non-null assertion as requireAuth guarantees req.user exists
      
      // Get user's courses from the database
      const userCourses = await storage.getUserCourses(userId);
      
      // Format courses for the frontend
      const activeCourses = userCourses.map(userCourse => {
        const course = userCourse.course;
        
        // Calculate time left based on progress and course duration
        const totalMinutes = course.duration || 60; // Default to 1 hour if not specified
        const completedMinutes = Math.round(totalMinutes * (userCourse.progress / 100));
        const minutesLeft = totalMinutes - completedMinutes;
        
        // Format time left string
        const hoursLeft = Math.floor(minutesLeft / 60);
        const minsLeft = minutesLeft % 60;
        const timeLeft = `${hoursLeft}h ${minsLeft}m`;
        
        return {
          id: course.id,
          title: course.title,
          category: course.category,
          description: course.description,
          timeLeft: timeLeft,
          progress: userCourse.progress,
          image: course.image
        };
      });
      
      // If no courses are found, return an empty array
      if (activeCourses.length === 0) {
        return res.status(200).json([]);
      }
      
      return res.status(200).json(activeCourses);
    } catch (error) {
      console.error("Error fetching active courses:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user/roadmap", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id; // From JWT middleware
      
      // Get user learning paths from database
      const userLearningPaths = await storage.getUserLearningPaths(userId);
      
      // If user has no learning paths, return a default response
      if (userLearningPaths.length === 0) {
        return res.status(200).json({
          title: "No Active Learning Path",
          progress: 0,
          items: []
        });
      }
      
      // Use the first learning path (most users will only have one active path at a time)
      const userPath = userLearningPaths[0];
      const pathItems = userPath.path.items as Array<any>;
      
      // Format items for the frontend
      const formattedItems = pathItems.map((item: any, index: number) => {
        // Determine status based on index and overall progress
        const progressPerItem = 100 / pathItems.length;
        const currentItemIndex = Math.floor(userPath.progress / progressPerItem);
        
        let status: 'completed' | 'in-progress' | 'locked' = 'locked';
        let itemData: any = { id: index + 1, title: item.title };
        
        if (index < currentItemIndex) {
          // Completed items
          status = 'completed';
          // Generate a plausible completion date (within the last 6 months)
          const randomDaysAgo = Math.floor(Math.random() * 180) + 1;
          const completionDate = new Date();
          completionDate.setDate(completionDate.getDate() - randomDaysAgo);
          
          itemData.status = status;
          itemData.completedDate = completionDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        } else if (index === currentItemIndex) {
          // Current item in progress
          status = 'in-progress';
          
          // Calculate progress for this specific item
          const baseProgress = progressPerItem * currentItemIndex;
          const remainingProgress = userPath.progress - baseProgress;
          const itemProgress = Math.round((remainingProgress / progressPerItem) * 100);
          
          itemData.status = status;
          itemData.progress = itemProgress;
        } else {
          // Future items
          itemData.status = 'locked';
        }
        
        return itemData;
      });
      
      // Construct the roadmap response
      const roadmap = {
        title: userPath.path.title,
        progress: userPath.progress,
        items: formattedItems
      };
      
      return res.status(200).json(roadmap);
    } catch (error) {
      console.error("Error fetching user roadmap:", error);
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
      const topics = await storage.getTrendingTopics();
      
      // Filter by category if provided
      const category = req.query.category as string | undefined;
      const filteredTopics = category 
        ? topics.filter(topic => topic.category.toLowerCase() === category.toLowerCase())
        : topics;
        
      return res.status(200).json(filteredTopics);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // ====== User Interests Routes ======
  app.get("/api/user/interests", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const interests = await storage.getUserInterests(userId);
      return res.status(200).json(interests);
    } catch (error) {
      console.error("Error fetching user interests:", error);
      return res.status(500).json({ message: "Failed to fetch user interests" });
    }
  });

  app.post("/api/user/interests/:topicId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const topicId = parseInt(req.params.topicId, 10);
      
      if (isNaN(topicId)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }
      
      // Check if topic exists
      const topics = await storage.getTrendingTopics();
      const topic = topics.find(t => t.id === topicId);
      
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      
      // Add interest
      const interest = await storage.addUserInterest(userId, topicId);
      return res.status(201).json({
        message: "Topic added to interests",
        interest
      });
    } catch (error: any) {
      if (error.message === "User is already interested in this topic") {
        return res.status(409).json({ message: error.message });
      }
      
      console.error("Error adding user interest:", error);
      return res.status(500).json({ message: "Failed to add interest" });
    }
  });

  app.delete("/api/user/interests/:topicId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const topicId = parseInt(req.params.topicId, 10);
      
      if (isNaN(topicId)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }
      
      // Check if user is interested in this topic
      const isInterested = await storage.hasUserInterestedInTopic(userId, topicId);
      
      if (!isInterested) {
        return res.status(404).json({ message: "Topic not found in user interests" });
      }
      
      // Remove interest
      await storage.removeUserInterest(userId, topicId);
      return res.status(200).json({ message: "Topic removed from interests" });
    } catch (error) {
      console.error("Error removing user interest:", error);
      return res.status(500).json({ message: "Failed to remove interest" });
    }
  });

  app.get("/api/user/interests/check/:topicId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const topicId = parseInt(req.params.topicId, 10);
      
      if (isNaN(topicId)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }
      
      const isInterested = await storage.hasUserInterestedInTopic(userId, topicId);
      return res.status(200).json({ isInterested });
    } catch (error) {
      console.error("Error checking user interest:", error);
      return res.status(500).json({ message: "Failed to check interest" });
    }
  });

  // ====== Community Routes ======
  app.get("/api/community/topics", async (req: Request, res: Response) => {
    try {
      const topics = await storage.getTrendingTopics();
      
      // Transform topics to match the community page interface
      const transformedTopics = topics.map(topic => ({
        id: topic.id,
        title: topic.title,
        description: topic.description,
        category: topic.category,
        followers: topic.learnerCount,
        difficulty: 'beginner' as const, // Default difficulty
        symbol: topic.title.slice(0, 4).toUpperCase() // Create a symbol from the title
      }));

      return res.status(200).json(transformedTopics);
    } catch (error) {
      console.error("Error fetching topics:", error);
      return res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  app.get("/api/community/posts", async (req: Request, res: Response) => {
    try {
      const topicId = req.query.topic ? parseInt(req.query.topic as string) : undefined;
      const tab = req.query.tab as string || 'popular';
      
      if (topicId && isNaN(topicId)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }
      
      const posts = await storage.getPosts(tab, topicId);
      
      // Check if user is authenticated to get like status
      const authHeader = req.headers.authorization;
      let userId: number | null = null;
      
      if (authHeader) {
        try {
          const token = extractTokenFromHeader(authHeader);
          if (token) {
            const decoded = verifyToken(token);
            if (decoded && decoded.id) {
              userId = decoded.id;
            }
          }
        } catch (e) {
          // Continue without user ID
        }
      }
      
      // If user is authenticated, check which posts are liked
      if (userId) {
        const postsWithLikeStatus = await Promise.all(posts.map(async (post) => {
          const isLiked = await storage.hasUserLikedPost(userId!, post.id);
          const isReposted = await storage.hasUserRepostedPost(userId!, post.id);
          
          // Process replies
          const repliesWithLikeStatus = await Promise.all((post.replies || []).map(async (reply) => {
            const replyIsLiked = await storage.hasUserLikedPost(userId!, reply.id);
            const replyIsReposted = await storage.hasUserRepostedPost(userId!, reply.id);
            return {
              ...reply,
              isLiked: replyIsLiked,
              isReposted: replyIsReposted
            };
          }));

          // Process reposted post if it exists
          let repostedPostWithLikeStatus = post.repostedPost;
          if (post.repostedPost) {
            const repostedPostIsLiked = await storage.hasUserLikedPost(userId!, post.repostedPost.id);
            const repostedPostIsReposted = await storage.hasUserRepostedPost(userId!, post.repostedPost.id);
            repostedPostWithLikeStatus = {
              ...post.repostedPost,
              isLiked: repostedPostIsLiked,
              isReposted: repostedPostIsReposted
            };
          }

          return {
            ...post,
            isLiked,
            isReposted,
            replies: repliesWithLikeStatus,
            repostedPost: repostedPostWithLikeStatus
          };
        }));
        return res.status(200).json(postsWithLikeStatus);
      }
      
      return res.status(200).json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/community/posts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id; // From JWT middleware
      const { topicId, content, sentiment, replyTo, repostId } = req.body;

      if (!topicId) {
        return res.status(400).json({ message: "Topic ID is required" });
      }

      // If this is a reply, verify the parent post exists
      if (replyTo) {
        const parentPost = await storage.getPost(replyTo);
        if (!parentPost) {
          return res.status(404).json({ message: "Parent post not found" });
        }
      }

      // If this is a repost, verify the original post exists
      if (repostId) {
        const originalPost = await storage.getPost(repostId);
        if (!originalPost) {
          return res.status(404).json({ message: "Original post not found" });
        }
      }
      
      const validatedData = insertPostSchema.parse({
        ...req.body,
        authorId: userId,
        attachment: req.body.attachment || null
      });
      
      const newPost = await storage.createPost(validatedData);

      // Get the complete post with author and related data
      const completePost = await storage.getPost(newPost.id);
      if (!completePost) {
        return res.status(500).json({ message: "Failed to retrieve created post" });
      }

      return res.status(201).json(completePost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Error creating post:", error);
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
  
  // Comments routes
  app.get("/api/community/posts/:id/comments", async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const comments = await storage.getComments(postId);
      return res.status(200).json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/community/posts/:id/comments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id; // From JWT middleware
      const postId = parseInt(req.params.id);
      const { content } = req.body;
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      if (!content || content.trim() === "") {
        return res.status(400).json({ message: "Comment content cannot be empty" });
      }
      
      const comment = await storage.createComment({
        postId,
        authorId: userId,
        content
      });
      
      // Get the complete comment with author info
      const commentWithAuthor = (await storage.getComments(postId)).find(c => c.id === comment.id);
      return res.status(201).json(commentWithAuthor);
    } catch (error) {
      console.error("Error creating comment:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/community/comments/:id/like", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id; // From JWT middleware
      const commentId = parseInt(req.params.id);
      
      if (isNaN(commentId)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }
      
      await storage.likeComment(userId, commentId);
      return res.status(200).json({ message: "Comment liked successfully" });
    } catch (error) {
      console.error("Error liking comment:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/community/comments/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const commentId = parseInt(req.params.id);
      
      if (isNaN(commentId)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }
      
      // Optionally add authorization check here to ensure only the comment author can delete
      
      await storage.deleteComment(commentId);
      return res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/community/contributors", async (req: Request, res: Response) => {
    try {
      // Get top contributors from database
      const topContributors = await storage.getTopContributors();
      
      // Format the response for the frontend
      const contributors = topContributors.map((contributor, index) => {
        return {
          id: contributor.id,
          name: contributor.displayName || contributor.username,
          username: contributor.username,
          points: contributor.points,
          rank: index + 1,
          avatar: contributor.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(contributor.username)}&background=random`,
          badges: contributor.badges.map(badge => ({
            id: badge.id,
            filled: true,
            name: badge.name,
            icon: badge.icon
          }))
        };
      });
      
      return res.status(200).json(contributors);
    } catch (error) {
      console.error("Error fetching contributors:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // ====== Courses Routes ======
  app.get("/api/courses", async (req: Request, res: Response) => {
    try {
      const tab = req.query.tab as string || 'all';
      const searchQuery = req.query.searchQuery as string || '';
      
      // Get courses from the database
      const courses = await storage.getCourses(tab !== 'all' ? tab : undefined);
      
      // Filter courses based on search query if provided
      let filteredCourses = courses;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredCourses = filteredCourses.filter(course => 
          course.title.toLowerCase().includes(query) || 
          course.description.toLowerCase().includes(query)
        );
      }
      
      // Format courses for the frontend
      const formattedCourses = filteredCourses.map(course => {
        // Calculate estimated time to complete the course in minutes
        const totalMinutes = course.duration || 60; // Default to 1 hour if not specified
        
        // Format time left string
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const timeLeftDisplay = `${hours}h ${minutes}m`;
        
        return {
          id: course.id,
          title: course.title,
          category: course.category,
          description: course.description,
          difficulty: course.difficulty,
          timeLeft: timeLeftDisplay,
          progress: 0, // Default progress for courses not started by user
          image: course.image
        };
      });
      
      return res.status(200).json(formattedCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
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
      
      const response = await AiService.getAIAssistantResponse(question, courseContext);
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
      
      const recommendations = await AiService.getCourseRecommendations(userProfile, allCourses);
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
      
      // Using our free HuggingFace AI service
      const result = await AiService.summarizeText(content);
      return res.status(200).json(result);
    } catch (error) {
      console.error("AI Summarization error:", error);
      return res.status(500).json({ message: "Failed to generate content summary" });
    }
  });
  
  // New AI endpoints for additional features
  
  app.post("/api/ai/learning-path", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { userGoal, userSkillLevel } = req.body;
      
      if (!userGoal || !userSkillLevel) {
        return res.status(400).json({ message: "User goal and skill level are required" });
      }
      
      // Using our free HuggingFace AI service
      const learningPath = await AiService.generateLearningPath(userGoal, userSkillLevel, userGoal);
      
      return res.status(200).json(learningPath);
    } catch (error) {
      console.error("Error generating learning path:", error);
      return res.status(500).json({ message: "Failed to generate learning path" });
    }
  });
  
  app.post("/api/ai/verify-answer", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { question, userAnswer, correctAnswer } = req.body;
      
      if (!question || !userAnswer || !correctAnswer) {
        return res.status(400).json({ message: "Question, user answer, and correct answer are required" });
      }
      
      // Using our free HuggingFace AI service
      const verification = await AiService.verifyAnswer(question, correctAnswer, userAnswer);
      
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
      
      const analysis = await AiService.analyzeTrendingTopics(
        recentUserActivities
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
      
      const careerPath = await AiService.generateCareerPath(
        careerGoal,
        userSkills,
        timeframe
      );
      
      return res.status(200).json(careerPath);
    } catch (error) {
      console.error("Error generating career path:", error);
      return res.status(500).json({ message: "Failed to generate career path" });
    }
  });
  
  app.post("/api/ai/quiz", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { topic, difficulty, questionCount = 5 } = req.body;
      
      if (!topic || !difficulty) {
        return res.status(400).json({ message: "Topic and difficulty are required" });
      }
      
      // Using our free HuggingFace AI service
      const quiz = await AiService.generateQuiz(
        topic,
        difficulty as ('beginner' | 'intermediate' | 'advanced'),
        questionCount
      );
      
      return res.status(200).json(quiz);
    } catch (error) {
      console.error("Error generating quiz:", error);
      return res.status(500).json({ message: "Failed to generate quiz" });
    }
  });
  
  app.post("/api/ai/analyze-progress", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { topics = [], strengths = [], weaknesses = [], goals = "" } = req.body;
      
      // Using our free HuggingFace AI service
      const progressAnalysis = await AiService.analyzeProgress(
        topics,
        strengths,
        weaknesses,
        goals
      );
      
      return res.status(200).json({ analysis: progressAnalysis });
    } catch (error) {
      console.error("Error analyzing progress:", error);
      return res.status(500).json({ message: "Failed to analyze progress" });
    }
  });
  
  app.post("/api/ai/course-content", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { topic, format, targetAudience } = req.body;
      
      if (!topic || !format || !targetAudience) {
        return res.status(400).json({ message: "Topic, format, and target audience are required" });
      }
      
      // Using our free HuggingFace AI service
      const courseContent = await AiService.generateCourseContent(
        topic,
        targetAudience as ('beginner' | 'intermediate' | 'advanced'),
        format as ('lesson' | 'article' | 'tutorial' | 'exercise')
      );
      
      return res.status(200).json({ content: courseContent });
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
      
      const certificationResult = await AiService.verifyCertification(
        courseContent,
        userResponses.join("\n"),
        certificationLevel
      );
      
      return res.status(200).json(certificationResult);
    } catch (error) {
      console.error("Error verifying certification:", error);
      return res.status(500).json({ message: "Failed to verify certification" });
    }
  });

  // ====== Topic Content Routes ======
  app.get("/api/topics/:id/content", async (req: Request, res: Response) => {
    try {
      const topicId = parseInt(req.params.id);
      if (isNaN(topicId)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }
      
      // Get the topic from storage
      const topics = await storage.getTrendingTopics();
      const topic = topics.find(t => t.id === topicId);
      
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      
      // Generate content for the topic
      const content = await generateTopicContent(topic.title);
      
      return res.status(200).json({
        topicId,
        title: topic.title,
        content
      });
    } catch (error) {
      console.error("Error generating topic content:", error);
      return res.status(500).json({ message: "Error generating content" });
    }
  });
  
  app.get("/api/topics/:id/learning-path", async (req: Request, res: Response) => {
    try {
      const topicId = parseInt(req.params.id);
      if (isNaN(topicId)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }
      
      // Get the topic from storage
      const topics = await storage.getTrendingTopics();
      const topic = topics.find(t => t.id === topicId);
      
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      
      // Generate learning path for the topic
      const learningPath = await generateTopicLearningPath(topic.title);
      
      return res.status(200).json({
        topicId,
        title: topic.title,
        learningPath
      });
    } catch (error) {
      console.error("Error generating learning path:", error);
      return res.status(500).json({ message: "Error generating learning path" });
    }
  });
  
  app.get("/api/topics/:id/quiz", async (req: Request, res: Response) => {
    try {
      const topicId = parseInt(req.params.id);
      if (isNaN(topicId)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }
      
      // Get number of questions from query params, default to 5
      const numQuestions = req.query.questions ? 
        parseInt(req.query.questions as string) : 5;
      
      // Get the topic from storage
      const topics = await storage.getTrendingTopics();
      const topic = topics.find(t => t.id === topicId);
      
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      
      // Generate quiz for the topic
      const quiz = await generateTopicQuiz(topic.title, numQuestions);
      
      return res.status(200).json({
        topicId,
        title: topic.title,
        quiz
      });
    } catch (error) {
      console.error("Error generating quiz:", error);
      return res.status(500).json({ message: "Error generating quiz" });
    }
  });
  
  // ====== Interactive Courses Routes ======
  
  // Create a new interactive course from white paper content
  app.post("/api/interactive-courses", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { title, whitePaperText } = req.body;
      
      if (!title || !whitePaperText) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Generate interactive course using HuggingFace service
      const { generateInteractiveCourse } = await import('./services/huggingface-service');
      const courseData = await generateInteractiveCourse(title, whitePaperText);
      
      // Save course to database
      const courseInsert = {
        title: courseData.title,
        description: courseData.description,
        level: courseData.level,
        estimatedHours: courseData.estimatedHours,
        modules: courseData.modules,
      };
      
      const result = await db.insert(interactiveCourses).values(courseInsert).returning();
      const course = result[0];
      
      res.status(201).json({ course });
    } catch (error) {
      console.error("Error creating interactive course:", error);
      res.status(500).json({ error: "Failed to create interactive course" });
    }
  });
  
  // Get all interactive courses
  app.get("/api/interactive-courses", async (req: Request, res: Response) => {
    try {
      const courses = await db.select().from(interactiveCourses);
      res.json({ courses });
    } catch (error) {
      console.error("Error fetching interactive courses:", error);
      res.status(500).json({ error: "Failed to fetch interactive courses" });
    }
  });
  
  // Get a specific interactive course
  app.get("/api/interactive-courses/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "Invalid course ID" });
      }
      
      const course = await db.select().from(interactiveCourses).where(eq(interactiveCourses.id, Number(id))).limit(1);
      
      if (!course || course.length === 0) {
        return res.status(404).json({ error: "Course not found" });
      }
      
      res.json({ course: course[0] });
    } catch (error) {
      console.error("Error fetching interactive course:", error);
      res.status(500).json({ error: "Failed to fetch interactive course" });
    }
  });
  
  // Generate tutorial content using AI (website assistant)
  app.post("/api/ai/tutorial", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { feature } = req.body;
      
      if (!feature) {
        return res.status(400).json({ error: "Missing feature parameter" });
      }
      
      // Create a prompt that will generate a helpful tutorial about a website feature
      const prompt = `Create a short tutorial for using the "${feature}" feature on the Luminate educational platform.
      The tutorial should:
      1. Explain what the feature is and why it's useful
      2. Provide step-by-step instructions on how to use it effectively
      3. Include 1-2 tips or best practices
      
      Format the response as concise markdown.`;
      
      const { textGeneration } = await import('@huggingface/inference');
      
      const result = await textGeneration({
        model: 'google/flan-t5-large',
        inputs: prompt,
        parameters: {
          max_new_tokens: 250,
          temperature: 0.7,
          top_p: 0.95,
        }
      });
      
      res.json({ 
        feature,
        content: result.generated_text
      });
    } catch (error) {
      console.error("Error generating tutorial:", error);
      res.status(500).json({ error: "Failed to generate tutorial content" });
    }
  });

  // Edit a post
  app.patch('/api/community/posts/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const postId = Number(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ error: 'Invalid post ID' });
      }

      const { content } = req.body;
      if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Content cannot be empty' });
      }

      // Get the post to check ownership
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Check if the user is the author of the post
      if (post.authorId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized to edit this post' });
      }

      // Edit the post
      const updatedPost = await storage.editPost(postId, content);
      if (!updatedPost) {
        return res.status(500).json({ error: 'Failed to update post' });
      }

      // Get the complete post with author and related data
      const completePost = await storage.getPost(postId);
      return res.status(200).json(completePost);
    } catch (error) {
      console.error('Error editing post:', error);
      return res.status(500).json({ error: 'Failed to edit post' });
    }
  });

  // Delete a post
  app.delete('/api/community/posts/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const postId = Number(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ error: 'Invalid post ID' });
      }

      // Get the post to check ownership
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Check if the user is the author of the post
      if (post.authorId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized to delete this post' });
      }

      // Delete the post and all its replies and reposts
      await storage.deletePost(postId);
      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting post:', error);
      console.error('Error deleting post:', error);
      res.status(500).json({ error: 'Failed to delete post' });
    }
  });

  return httpServer;
}
