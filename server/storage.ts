import { 
  users, type User, type InsertUser,
  courses, type Course, type InsertCourse,
  userCourses, type UserCourse, type InsertUserCourse,
  learningPaths, type LearningPath, type InsertLearningPath,
  userLearningPaths, type UserLearningPath, type InsertUserLearningPath,
  posts, type Post, type InsertPost,
  comments, type Comment, type InsertComment,
  tags, type Tag, type InsertTag,
  postTags, type PostTag, type InsertPostTag,
  courseTags, type CourseTag, type InsertCourseTag,
  trendingTopics, type TrendingTopic, type InsertTrendingTopic,
  badges, type Badge, type InsertBadge,
  userBadges, type UserBadge, type InsertUserBadge,
  userStats, type UserStat, type InsertUserStat,
  testimonials, type Testimonial, type InsertTestimonial,
  premiumFeatures, type PremiumFeature, type InsertPremiumFeature,
  subscriptions, type Subscription, type InsertSubscription,
  userPostLikes, type UserPostLike, type InsertUserPostLike
} from "@shared/schema";
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserStats(userId: number): Promise<UserStat | undefined>;
  updateUserStats(userId: number, stats: Partial<InsertUserStat>): Promise<UserStat | undefined>;
  
  // Course methods
  getCourses(category?: string): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  getUserCourses(userId: number): Promise<(UserCourse & { course: Course })[]>;
  createUserCourse(userCourse: InsertUserCourse): Promise<UserCourse>;
  updateUserCourseProgress(id: number, progress: number): Promise<UserCourse | undefined>;
  
  // Learning path methods
  getLearningPath(id: number): Promise<LearningPath | undefined>;
  getUserLearningPath(userId: number, pathId: number): Promise<(UserLearningPath & { path: LearningPath }) | undefined>;
  getUserLearningPaths(userId: number): Promise<(UserLearningPath & { path: LearningPath })[]>;
  
  // Community methods
  getPosts(tab: string): Promise<(Post & { author: User, tags: Tag[] })[]>;
  getPost(id: number): Promise<(Post & { author: User, tags: Tag[] }) | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  likePost(userId: number, postId: number): Promise<void>;
  unlikePost(userId: number, postId: number): Promise<void>;
  hasUserLikedPost(userId: number, postId: number): Promise<boolean>;
  getTopContributors(): Promise<(User & { badges: Badge[] })[]>;
  
  // Comment methods
  getComments(postId: number): Promise<(Comment & { author: User })[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  likeComment(userId: number, commentId: number): Promise<void>;
  unlikeComment(userId: number, commentId: number): Promise<void>;
  deleteComment(id: number): Promise<void>;

  // Trending methods
  getTrendingTopics(): Promise<TrendingTopic[]>;
  getTrendingTicker(): Promise<{ id: number, rank: number, title: string, changePercentage: number }[]>;
  
  // Premium features
  getPremiumFeatures(): Promise<PremiumFeature[]>;
  
  // Testimonials
  getTestimonials(): Promise<Testimonial[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private userCourses: Map<number, UserCourse>;
  private learningPaths: Map<number, LearningPath>;
  private userLearningPaths: Map<number, UserLearningPath>;
  private posts: Map<number, Post>;
  private comments: Map<number, Comment>;
  private tags: Map<number, Tag>;
  private postTags: Map<number, PostTag>;
  private courseTags: Map<number, CourseTag>;
  private trendingTopics: Map<number, TrendingTopic>;
  private badges: Map<number, Badge>;
  private userBadges: Map<number, UserBadge>;
  private userStats: Map<number, UserStat>;
  private testimonials: Map<number, Testimonial>;
  private premiumFeatures: Map<number, PremiumFeature>;
  private subscriptions: Map<number, Subscription>;
  private userPostLikes: Map<number, UserPostLike>;
  
  private currentIds: {
    [key: string]: number;
  };

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.userCourses = new Map();
    this.learningPaths = new Map();
    this.userLearningPaths = new Map();
    this.posts = new Map();
    this.comments = new Map();
    this.tags = new Map();
    this.postTags = new Map();
    this.courseTags = new Map();
    this.trendingTopics = new Map();
    this.badges = new Map();
    this.userBadges = new Map();
    this.userStats = new Map();
    this.testimonials = new Map();
    this.premiumFeatures = new Map();
    this.subscriptions = new Map();
    this.userPostLikes = new Map();

    this.currentIds = {
      users: 1,
      courses: 1,
      userCourses: 1,
      learningPaths: 1,
      userLearningPaths: 1,
      posts: 1,
      comments: 1,
      tags: 1,
      postTags: 1,
      courseTags: 1,
      trendingTopics: 1,
      badges: 1,
      userBadges: 1,
      userStats: 1,
      testimonials: 1,
      premiumFeatures: 1,
      subscriptions: 1,
      userPostLikes: 1
    };

    // Initialize with some demo data for development
    this.initializePremiumFeatures();
    this.initializeTestimonials();
    this.initializeTrendingTopics();
    this.initializeBadges();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    const user: User = { 
      id, 
      username: insertUser.username,
      email: insertUser.email,
      password: hashedPassword,
      displayName: insertUser.displayName || null,
      profileImage: insertUser.profileImage || null,
      isInstructor: false,
      points: 0,
      createdAt: new Date()
    };
    
    this.users.set(id, user);
    
    // Create initial user stats
    this.createUserStats({
      userId: id,
      streak: 0,
      hoursLearned: 0,
      completedCourses: 0
    });
    
    return user;
  }

  async getUserStats(userId: number): Promise<UserStat | undefined> {
    return Array.from(this.userStats.values()).find(
      (stats) => stats.userId === userId
    );
  }

  async createUserStats(stats: InsertUserStat): Promise<UserStat> {
    const id = this.currentIds.userStats++;
    const userStats: UserStat = {
      id,
      userId: stats.userId,
      streak: stats.streak || 0,
      hoursLearned: stats.hoursLearned || 0,
      completedCourses: stats.completedCourses || 0,
      lastActivityDate: new Date()
    };
    
    this.userStats.set(id, userStats);
    return userStats;
  }

  async updateUserStats(userId: number, updatedStats: Partial<InsertUserStat>): Promise<UserStat | undefined> {
    const existingStats = await this.getUserStats(userId);
    
    if (!existingStats) return undefined;
    
    const updatedUserStats: UserStat = {
      ...existingStats,
      ...updatedStats,
      lastActivityDate: new Date()
    };
    
    this.userStats.set(existingStats.id, updatedUserStats);
    return updatedUserStats;
  }

  // Course methods
  async getCourses(category?: string): Promise<Course[]> {
    const allCourses = Array.from(this.courses.values());
    
    if (category && category !== 'all') {
      return allCourses.filter(course => course.category === category);
    }
    
    return allCourses;
  }

  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getUserCourses(userId: number): Promise<(UserCourse & { course: Course })[]> {
    const userCourses = Array.from(this.userCourses.values())
      .filter(uc => uc.userId === userId);
    
    return userCourses.map(uc => {
      const course = this.courses.get(uc.courseId);
      if (!course) throw new Error(`Course not found for id: ${uc.courseId}`);
      
      return {
        ...uc,
        course
      };
    });
  }

  async createUserCourse(userCourse: InsertUserCourse): Promise<UserCourse> {
    const id = this.currentIds.userCourses++;
    const newUserCourse: UserCourse = {
      ...userCourse,
      id,
      progress: 0,
      lastAccessedAt: new Date(),
      completedLessons: []
    };
    
    this.userCourses.set(id, newUserCourse);
    return newUserCourse;
  }

  async updateUserCourseProgress(id: number, progress: number): Promise<UserCourse | undefined> {
    const userCourse = this.userCourses.get(id);
    
    if (!userCourse) return undefined;
    
    const updatedUserCourse: UserCourse = {
      ...userCourse,
      progress,
      lastAccessedAt: new Date()
    };
    
    this.userCourses.set(id, updatedUserCourse);
    return updatedUserCourse;
  }

  // Learning path methods
  async getLearningPath(id: number): Promise<LearningPath | undefined> {
    return this.learningPaths.get(id);
  }

  async getUserLearningPath(userId: number, pathId: number): Promise<(UserLearningPath & { path: LearningPath }) | undefined> {
    const userLearningPath = Array.from(this.userLearningPaths.values())
      .find(ulp => ulp.userId === userId && ulp.pathId === pathId);
    
    if (!userLearningPath) return undefined;
    
    const path = await this.getLearningPath(pathId);
    if (!path) return undefined;
    
    return {
      ...userLearningPath,
      path
    };
  }

  async getUserLearningPaths(userId: number): Promise<(UserLearningPath & { path: LearningPath })[]> {
    const userPaths = Array.from(this.userLearningPaths.values())
      .filter(ulp => ulp.userId === userId);
    
    const result: (UserLearningPath & { path: LearningPath })[] = [];
    
    for (const userPath of userPaths) {
      const path = await this.getLearningPath(userPath.pathId);
      if (path) {
        result.push({
          ...userPath,
          path
        });
      }
    }
    
    return result;
  }

  // Community methods
  async getPosts(tab: string): Promise<(Post & { author: User, tags: Tag[] })[]> {
    const allPosts = Array.from(this.posts.values());
    let filteredPosts = allPosts;
    
    // Filter posts based on the tab
    switch (tab) {
      case 'latest':
        filteredPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'popular':
        filteredPosts.sort((a, b) => b.likes - a.likes);
        break;
      // Additional filtering for other tabs can be added here
    }
    
    // Get author and tags for each post
    const result: (Post & { author: User, tags: Tag[] })[] = [];
    
    for (const post of filteredPosts) {
      const author = await this.getUser(post.authorId);
      if (!author) continue; // Skip posts without author
      
      // Get tags for the post
      const postTagEntries = Array.from(this.postTags.values())
        .filter(pt => pt.postId === post.id);
      
      const tags: Tag[] = [];
      for (const postTag of postTagEntries) {
        const tag = await this.getTag(postTag.tagId);
        if (tag) tags.push(tag);
      }
      
      result.push({
        ...post,
        author,
        tags
      });
    }
    
    return result;
  }

  async getPost(id: number): Promise<(Post & { author: User, tags: Tag[] }) | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;
    
    const author = await this.getUser(post.authorId);
    if (!author) return undefined;
    
    const postTagEntries = Array.from(this.postTags.values())
      .filter(pt => pt.postId === post.id);
    
    const tags: Tag[] = [];
    for (const postTag of postTagEntries) {
      const tag = await this.getTag(postTag.tagId);
      if (tag) tags.push(tag);
    }
    
    return {
      ...post,
      author,
      tags
    };
  }

  async getTag(id: number): Promise<Tag | undefined> {
    return this.tags.get(id);
  }

  async createPost(post: InsertPost): Promise<Post> {
    const id = this.currentIds.posts++;
    const newPost: Post = {
      id,
      authorId: post.authorId,
      content: post.content,
      attachment: post.attachment || null,
      likes: 0,
      createdAt: new Date()
    };
    
    this.posts.set(id, newPost);
    return newPost;
  }

  async likePost(userId: number, postId: number): Promise<void> {
    // Check if user already liked the post
    const alreadyLiked = await this.hasUserLikedPost(userId, postId);
    if (alreadyLiked) return;
    
    // Add the like
    const id = this.currentIds.userPostLikes++;
    const userPostLike: UserPostLike = {
      id,
      userId,
      postId
    };
    
    this.userPostLikes.set(id, userPostLike);
    
    // Increment the post's like count
    const post = this.posts.get(postId);
    if (post) {
      this.posts.set(postId, {
        ...post,
        likes: post.likes + 1
      });
    }
  }

  async unlikePost(userId: number, postId: number): Promise<void> {
    // Find the like entry
    const likeEntry = Array.from(this.userPostLikes.values())
      .find(like => like.userId === userId && like.postId === postId);
    
    if (!likeEntry) return;
    
    // Remove the like
    this.userPostLikes.delete(likeEntry.id);
    
    // Decrement the post's like count
    const post = this.posts.get(postId);
    if (post && post.likes > 0) {
      this.posts.set(postId, {
        ...post,
        likes: post.likes - 1
      });
    }
  }

  async hasUserLikedPost(userId: number, postId: number): Promise<boolean> {
    return Array.from(this.userPostLikes.values())
      .some(like => like.userId === userId && like.postId === postId);
  }

  async getTopContributors(): Promise<(User & { badges: Badge[] })[]> {
    // Get users ordered by points (most points first)
    const usersWithPoints = Array.from(this.users.values())
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 3); // Top 3 contributors
    
    const result: (User & { badges: Badge[] })[] = [];
    
    for (const user of usersWithPoints) {
      // Get badges for the user
      const userBadgeEntries = Array.from(this.userBadges.values())
        .filter(ub => ub.userId === user.id);
      
      const badges: Badge[] = [];
      for (const userBadge of userBadgeEntries) {
        const badge = this.badges.get(userBadge.badgeId);
        if (badge) badges.push(badge);
      }
      
      result.push({
        ...user,
        badges
      });
    }
    
    return result;
  }
  
  // Comment methods
  async getComments(postId: number): Promise<(Comment & { author: User })[]> {
    const comments = Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); // Oldest first
    
    const result: (Comment & { author: User })[] = [];
    
    for (const comment of comments) {
      const author = await this.getUser(comment.authorId);
      if (author) {
        result.push({
          ...comment,
          author
        });
      }
    }
    
    return result;
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    const id = this.currentIds.comments++;
    const newComment: Comment = {
      id,
      postId: comment.postId,
      authorId: comment.authorId,
      content: comment.content,
      likes: 0,
      createdAt: new Date()
    };
    
    this.comments.set(id, newComment);
    return newComment;
  }
  
  async likeComment(userId: number, commentId: number): Promise<void> {
    const comment = this.comments.get(commentId);
    if (!comment) return;
    
    this.comments.set(commentId, {
      ...comment,
      likes: comment.likes + 1
    });
  }
  
  async unlikeComment(userId: number, commentId: number): Promise<void> {
    const comment = this.comments.get(commentId);
    if (!comment || comment.likes <= 0) return;
    
    this.comments.set(commentId, {
      ...comment,
      likes: comment.likes - 1
    });
  }
  
  async deleteComment(id: number): Promise<void> {
    this.comments.delete(id);
  }

  // Trending methods
  async getTrendingTopics(category?: string): Promise<TrendingTopic[]> {
    const allTopics = Array.from(this.trendingTopics.values())
      .sort((a, b) => b.growthPercentage - a.growthPercentage);
    
    if (category && category !== 'all') {
      return allTopics.filter(topic => topic.category === category);
    }
    
    return allTopics;
  }

  async getTrendingTicker(): Promise<{ id: number, rank: number, title: string, changePercentage: number }[]> {
    const topics = await this.getTrendingTopics();
    return topics.map((topic, index) => ({
      id: topic.id,
      rank: index + 1,
      title: topic.title,
      changePercentage: topic.growthPercentage
    }));
  }

  // Premium features
  async getPremiumFeatures(): Promise<PremiumFeature[]> {
    return Array.from(this.premiumFeatures.values());
  }

  // Testimonials
  async getTestimonials(): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values());
  }

  // Demo data initialization methods
  private initializePremiumFeatures() {
    const features = [
      {
        id: 1,
        title: 'Expert Tutors',
        description: 'Get personalized guidance from industry professionals',
        icon: 'ri-user-star-line'
      },
      {
        id: 2,
        title: 'Unlimited Certifications',
        description: 'Earn credentials for every completed course',
        icon: 'ri-award-line'
      },
      {
        id: 3,
        title: 'Advanced Content',
        description: 'Access exclusive resources and case studies',
        icon: 'ri-graduation-cap-line'
      },
      {
        id: 4,
        title: 'Career Coaching',
        description: 'One-on-one sessions to advance your career',
        icon: 'ri-briefcase-line'
      }
    ];

    features.forEach(feature => {
      this.premiumFeatures.set(feature.id, feature);
    });
    this.currentIds.premiumFeatures = features.length + 1;
  }

  private initializeTestimonials() {
    const testimonials = [
      {
        id: 1,
        name: 'Jason Torres',
        role: 'Software Engineer',
        text: 'Luminate\'s courses are what got me my first job in tech. The AI-driven approach helped me learn at my own pace, and the certification was recognized by my employer.',
        avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80',
        rating: 5
      },
      {
        id: 2,
        name: 'Rebecca Kim',
        role: 'UX Designer',
        text: 'The community features are what sets Luminate apart. I\'ve connected with other designers worldwide and learned as much from them as from the courses themselves.',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80',
        rating: 4.5
      },
      {
        id: 3,
        name: 'David Patel',
        role: 'Data Scientist',
        text: 'Premium subscription was worth every penny. The expert tutors helped me solve complex problems in my data science projects that I couldn\'t figure out on my own.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80',
        rating: 5
      }
    ];

    testimonials.forEach(testimonial => {
      this.testimonials.set(testimonial.id, testimonial);
    });
    this.currentIds.testimonials = testimonials.length + 1;
  }

  private initializeTrendingTopics() {
    const topics = [
      {
        id: 1,
        title: 'AI & Machine Learning',
        description: 'Build intelligent systems using Python, TensorFlow and other cutting-edge tools',
        category: 'technology',
        icon: 'ri-robot-line',
        iconColor: 'text-primary',
        iconBackground: 'bg-primary/10',
        learnerCount: 12.5,
        growthPercentage: 85,
        rank: 1,
        tags: ['Python', 'TensorFlow', 'Neural Networks', 'Deep Learning']
      },
      {
        id: 2,
        title: 'Cybersecurity Fundamentals',
        description: 'Learn to protect systems and networks from digital attacks',
        category: 'technology',
        icon: 'ri-shield-keyhole-line',
        iconColor: 'text-blue-500',
        iconBackground: 'bg-blue-500/10',
        learnerCount: 8.3,
        growthPercentage: 62,
        rank: 4,
        tags: ['Network Security', 'Ethical Hacking', 'Encryption', 'Penetration Testing']
      },
      {
        id: 3,
        title: 'Blockchain Development',
        description: 'Create decentralized applications and smart contracts',
        category: 'technology',
        icon: 'ri-links-line',
        iconColor: 'text-primary',
        iconBackground: 'bg-primary/10',
        learnerCount: 7.4,
        growthPercentage: 58,
        rank: 2,
        tags: ['Ethereum', 'Smart Contracts', 'Solidity', 'DeFi']
      },
      {
        id: 4,
        title: 'UX Research Methods',
        description: 'Master the techniques to understand user needs and behaviors',
        category: 'design',
        icon: 'ri-layout-4-line',
        iconColor: 'text-blue-500',
        iconBackground: 'bg-blue-500/10',
        learnerCount: 6.9,
        growthPercentage: 45,
        rank: 3,
        tags: ['User Testing', 'Prototyping', 'Accessibility', 'Usability']
      },
      {
        id: 5,
        title: 'Data Visualization',
        description: 'Transform complex data into compelling visual stories',
        category: 'design',
        icon: 'ri-bar-chart-box-line',
        iconColor: 'text-primary',
        iconBackground: 'bg-primary/10',
        learnerCount: 5.7,
        growthPercentage: 33,
        rank: 5,
        tags: ['D3.js', 'Tableau', 'Information Design', 'Data Analysis']
      },
      {
        id: 6,
        title: 'Cloud Computing',
        description: 'Deploy and manage scalable applications in the cloud',
        category: 'technology',
        icon: 'ri-cloud-line',
        iconColor: 'text-blue-500',
        iconBackground: 'bg-blue-500/10',
        learnerCount: 5.2,
        growthPercentage: 28,
        rank: 6,
        tags: ['AWS', 'Azure', 'Containerization', 'Serverless']
      }
    ];

    topics.forEach(topic => {
      this.trendingTopics.set(topic.id, topic);
    });
    this.currentIds.trendingTopics = topics.length + 1;
  }

  private initializeBadges() {
    const badges = [
      {
        id: 1,
        name: 'Code Master',
        description: 'Completed 10 programming courses',
        icon: 'ri-code-line'
      },
      {
        id: 2,
        name: 'Thought Leader',
        description: 'Created 50 insightful posts',
        icon: 'ri-brain-line'
      },
      {
        id: 3,
        name: 'Learning Streak',
        description: 'Maintained a 30-day learning streak',
        icon: 'ri-flag-line'
      }
    ];

    badges.forEach(badge => {
      this.badges.set(badge.id, badge);
    });
    this.currentIds.badges = badges.length + 1;
  }
}

export class DbStorage implements IStorage {
  constructor(private db: any) {}

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash the password
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    const user = {
      ...insertUser,
      password: hashedPassword,
      isInstructor: false,
      points: 0,
    };

    const result = await this.db.insert(users).values(user).returning();
    
    // Create initial user stats for the new user
    if (result.length > 0) {
      await this.createUserStats({
        userId: result[0].id,
        streak: 0,
        hoursLearned: 0,
        completedCourses: 0
      });
    }
    
    return result[0];
  }

  async getUserStats(userId: number): Promise<UserStat | undefined> {
    const result = await this.db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async createUserStats(stats: InsertUserStat): Promise<UserStat> {
    const result = await this.db.insert(userStats).values(stats).returning();
    return result[0];
  }

  async updateUserStats(userId: number, updatedStats: Partial<InsertUserStat>): Promise<UserStat | undefined> {
    const existingStats = await this.getUserStats(userId);
    
    if (!existingStats) return undefined;
    
    const result = await this.db
      .update(userStats)
      .set({
        ...updatedStats,
        lastActivityDate: new Date()
      })
      .where(eq(userStats.id, existingStats.id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  // Course methods
  async getCourses(category?: string): Promise<Course[]> {
    if (category && category !== 'all') {
      return await this.db.select().from(courses).where(eq(courses.category, category));
    }
    
    return await this.db.select().from(courses);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const result = await this.db.select().from(courses).where(eq(courses.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserCourses(userId: number): Promise<(UserCourse & { course: Course })[]> {
    const userCourseData = await this.db.select().from(userCourses).where(eq(userCourses.userId, userId));
    
    const result: (UserCourse & { course: Course })[] = [];
    
    for (const userCourse of userCourseData) {
      const course = await this.getCourse(userCourse.courseId);
      if (course) {
        result.push({
          ...userCourse,
          course
        });
      }
    }
    
    return result;
  }

  async createUserCourse(userCourse: InsertUserCourse): Promise<UserCourse> {
    const result = await this.db
      .insert(userCourses)
      .values({
        ...userCourse,
        progress: 0,
        completedLessons: []
      })
      .returning();
      
    return result[0];
  }

  async updateUserCourseProgress(id: number, progress: number): Promise<UserCourse | undefined> {
    const result = await this.db
      .update(userCourses)
      .set({
        progress,
        lastAccessedAt: new Date()
      })
      .where(eq(userCourses.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  // Learning path methods
  async getLearningPath(id: number): Promise<LearningPath | undefined> {
    const result = await this.db.select().from(learningPaths).where(eq(learningPaths.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserLearningPath(userId: number, pathId: number): Promise<(UserLearningPath & { path: LearningPath }) | undefined> {
    const result = await this.db
      .select()
      .from(userLearningPaths)
      .where(and(
        eq(userLearningPaths.userId, userId),
        eq(userLearningPaths.pathId, pathId)
      ))
      .limit(1);
    
    if (result.length === 0) return undefined;
    
    const path = await this.getLearningPath(pathId);
    if (!path) return undefined;
    
    return {
      ...result[0],
      path
    };
  }

  async getUserLearningPaths(userId: number): Promise<(UserLearningPath & { path: LearningPath })[]> {
    const userPaths = await this.db
      .select()
      .from(userLearningPaths)
      .where(eq(userLearningPaths.userId, userId));
    
    const result: (UserLearningPath & { path: LearningPath })[] = [];
    
    for (const userPath of userPaths) {
      const path = await this.getLearningPath(userPath.pathId);
      if (path) {
        result.push({
          ...userPath,
          path
        });
      }
    }
    
    return result;
  }

  // Community methods
  async getPosts(tab: string): Promise<(Post & { author: User, tags: Tag[] })[]> {
    // Query all posts and sort them based on the tab
    let queryResult;
    if (tab === 'popular') {
      queryResult = await this.db.select().from(posts).orderBy(posts.likes);
    } else { // 'latest' is default
      queryResult = await this.db.select().from(posts).orderBy(posts.createdAt);
    }
    
    const result: (Post & { author: User, tags: Tag[] })[] = [];
    
    for (const post of queryResult) {
      const author = await this.getUser(post.authorId);
      if (!author) continue;
      
      // Get tags for the post
      const postTagEntries = await this.db
        .select()
        .from(postTags)
        .where(eq(postTags.postId, post.id));
      
      const tags: Tag[] = [];
      for (const postTag of postTagEntries) {
        const tag = await this.getTag(postTag.tagId);
        if (tag) tags.push(tag);
      }
      
      result.push({
        ...post,
        author,
        tags
      });
    }
    
    return result;
  }

  async getPost(id: number): Promise<(Post & { author: User, tags: Tag[] }) | undefined> {
    const result = await this.db.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (result.length === 0) return undefined;
    
    const post = result[0];
    const author = await this.getUser(post.authorId);
    if (!author) return undefined;
    
    const postTagEntries = await this.db
      .select()
      .from(postTags)
      .where(eq(postTags.postId, post.id));
    
    const tags: Tag[] = [];
    for (const postTag of postTagEntries) {
      const tag = await this.getTag(postTag.tagId);
      if (tag) tags.push(tag);
    }
    
    return {
      ...post,
      author,
      tags
    };
  }

  async getTag(id: number): Promise<Tag | undefined> {
    const result = await this.db.select().from(tags).where(eq(tags.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const result = await this.db
      .insert(posts)
      .values({
        ...post,
        likes: 0
      })
      .returning();
    
    return result[0];
  }

  async likePost(userId: number, postId: number): Promise<void> {
    // Check if user already liked the post
    const alreadyLiked = await this.hasUserLikedPost(userId, postId);
    if (alreadyLiked) return;
    
    // Add the like
    await this.db.insert(userPostLikes).values({
      userId,
      postId
    });
    
    // Increment the post's like count
    const post = await this.getPost(postId);
    if (post) {
      await this.db
        .update(posts)
        .set({ likes: post.likes + 1 })
        .where(eq(posts.id, postId));
    }
  }

  async unlikePost(userId: number, postId: number): Promise<void> {
    // Delete the like entry
    await this.db
      .delete(userPostLikes)
      .where(and(
        eq(userPostLikes.userId, userId),
        eq(userPostLikes.postId, postId)
      ));
    
    // Decrement the post's like count
    const post = await this.getPost(postId);
    if (post && post.likes > 0) {
      await this.db
        .update(posts)
        .set({ likes: post.likes - 1 })
        .where(eq(posts.id, postId));
    }
  }

  async hasUserLikedPost(userId: number, postId: number): Promise<boolean> {
    const result = await this.db
      .select()
      .from(userPostLikes)
      .where(and(
        eq(userPostLikes.userId, userId),
        eq(userPostLikes.postId, postId)
      ));
    
    return result.length > 0;
  }

  async getTopContributors(): Promise<(User & { badges: Badge[] })[]> {
    // Get users ordered by points (most points first)
    const usersWithPoints = await this.db
      .select()
      .from(users)
      .orderBy(users.points)
      .limit(3);
    
    const result: (User & { badges: Badge[] })[] = [];
    
    for (const user of usersWithPoints) {
      // Get badge relations for this user
      const badgeRelations = await this.db
        .select()
        .from(userBadges)
        .where(eq(userBadges.userId, user.id));
      
      // Get the actual badge objects
      const userBadgesArray: Badge[] = [];
      for (const relation of badgeRelations) {
        const badgeResults = await this.db
          .select()
          .from(badges)
          .where(eq(badges.id, relation.badgeId))
          .limit(1);
        
        if (badgeResults && badgeResults.length > 0) {
          userBadgesArray.push(badgeResults[0]);
        }
      }
      
      // Add user with their badges to the result
      result.push({
        ...user,
        badges: userBadgesArray
      });
    }
    
    return result;
  }
  
  // Comment methods
  async getComments(postId: number): Promise<(Comment & { author: User })[]> {
    const commentsResult = await this.db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);
    
    const result: (Comment & { author: User })[] = [];
    
    for (const comment of commentsResult) {
      const author = await this.getUser(comment.authorId);
      if (author) {
        result.push({
          ...comment,
          author
        });
      }
    }
    
    return result;
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    const result = await this.db
      .insert(comments)
      .values(comment)
      .returning();
    
    return result[0];
  }
  
  async likeComment(userId: number, commentId: number): Promise<void> {
    // Get the current comment
    const commentResult = await this.db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);
    
    if (commentResult.length === 0) return;
    
    // Increment the likes count
    await this.db
      .update(comments)
      .set({
        likes: commentResult[0].likes + 1
      })
      .where(eq(comments.id, commentId));
  }
  
  async unlikeComment(userId: number, commentId: number): Promise<void> {
    // Get the current comment
    const commentResult = await this.db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);
    
    if (commentResult.length === 0 || commentResult[0].likes <= 0) return;
    
    // Decrement the likes count
    await this.db
      .update(comments)
      .set({
        likes: commentResult[0].likes - 1
      })
      .where(eq(comments.id, commentId));
  }
  
  async deleteComment(id: number): Promise<void> {
    await this.db
      .delete(comments)
      .where(eq(comments.id, id));
  }

  // Trending methods
  async getTrendingTopics(): Promise<TrendingTopic[]> {
    return await this.db
      .select()
      .from(trendingTopics)
      .orderBy(trendingTopics.growthPercentage);
  }

  async getTrendingTicker(): Promise<{ id: number, rank: number, title: string, changePercentage: number }[]> {
    const topics = await this.getTrendingTopics();
    return topics.map((topic, index) => ({
      id: topic.id,
      rank: index + 1,
      title: topic.title,
      changePercentage: topic.growthPercentage
    }));
  }

  // Premium features
  async getPremiumFeatures(): Promise<PremiumFeature[]> {
    return await this.db.select().from(premiumFeatures);
  }

  // Testimonials
  async getTestimonials(): Promise<Testimonial[]> {
    return await this.db.select().from(testimonials);
  }
}

// Import the database
import { db } from './database';

// Create the storage instance
export const storage = new DbStorage(db);
