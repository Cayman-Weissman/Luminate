import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  profileImage: text("profile_image"),
  isInstructor: boolean("is_instructor").default(false).notNull(),
  points: integer("points").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  image: text("image").notNull(),
  instructorId: integer("instructor_id").references(() => users.id),
  lessons: integer("lessons").default(0).notNull(),
  duration: integer("duration").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Courses (progress tracking)
export const userCourses = pgTable("user_courses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  progress: integer("progress").default(0).notNull(),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow().notNull(),
  completedLessons: jsonb("completed_lessons").default([]).notNull(),
});

// Learning paths
export const learningPaths = pgTable("learning_paths", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  items: jsonb("items").default([]).notNull(),
});

// User learning paths
export const userLearningPaths = pgTable("user_learning_paths", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  pathId: integer("path_id").references(() => learningPaths.id).notNull(),
  progress: integer("progress").default(0).notNull(),
});

// Posts for community
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  attachment: jsonb("attachment"),
  likes: integer("likes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Comments on posts
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  likes: integer("likes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tags for posts and courses
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Post tags join table
export const postTags = pgTable("post_tags", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id).notNull(),
  tagId: integer("tag_id").references(() => tags.id).notNull(),
});

// Course tags join table
export const courseTags = pgTable("course_tags", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  tagId: integer("tag_id").references(() => tags.id).notNull(),
});

// Trending topics
export const trendingTopics = pgTable("trending_topics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  icon: text("icon").notNull(),
  learnerCount: integer("learner_count").default(0).notNull(),
  growthPercentage: integer("growth_percentage").default(0).notNull(),
  rank: integer("rank").default(0).notNull(),
  tags: jsonb("tags").default([]).notNull(),
});

// Badges/achievements
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
});

// User badges
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  badgeId: integer("badge_id").references(() => badges.id).notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});

// User stats
export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  streak: integer("streak").default(0).notNull(),
  hoursLearned: integer("hours_learned").default(0).notNull(),
  completedCourses: integer("completed_courses").default(0).notNull(),
  lastActivityDate: timestamp("last_activity_date").defaultNow().notNull(),
});

// Testimonials
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  text: text("text").notNull(),
  avatar: text("avatar").notNull(),
  rating: integer("rating").default(5).notNull(),
});

// Premium features
export const premiumFeatures = pgTable("premium_features", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
});

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  plan: text("plan").notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true).notNull(),
});

// User likes on posts
export const userPostLikes = pgTable("user_post_likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  postId: integer("post_id").references(() => posts.id).notNull(),
});

// User interests in topics
export const userInterests = pgTable("user_interests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  topicId: integer("topic_id").references(() => trendingTopics.id).notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// Create insert schemas for all tables
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserCourseSchema = createInsertSchema(userCourses).omit({ id: true, lastAccessedAt: true });
export const insertLearningPathSchema = createInsertSchema(learningPaths).omit({ id: true });
export const insertUserLearningPathSchema = createInsertSchema(userLearningPaths).omit({ id: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, likes: true, createdAt: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, likes: true, createdAt: true });
export const insertTagSchema = createInsertSchema(tags).omit({ id: true });
export const insertPostTagSchema = createInsertSchema(postTags).omit({ id: true });
export const insertCourseTagSchema = createInsertSchema(courseTags).omit({ id: true });
export const insertTrendingTopicSchema = createInsertSchema(trendingTopics).omit({ id: true });
export const insertBadgeSchema = createInsertSchema(badges).omit({ id: true });
export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({ id: true, earnedAt: true });
export const insertUserStatSchema = createInsertSchema(userStats).omit({ id: true, lastActivityDate: true });
export const insertTestimonialSchema = createInsertSchema(testimonials).omit({ id: true });
export const insertPremiumFeatureSchema = createInsertSchema(premiumFeatures).omit({ id: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, startDate: true });
export const insertUserPostLikeSchema = createInsertSchema(userPostLikes).omit({ id: true });
export const insertUserInterestSchema = createInsertSchema(userInterests).omit({ id: true, addedAt: true });

// Define select types
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type UserCourse = typeof userCourses.$inferSelect;
export type LearningPath = typeof learningPaths.$inferSelect;
export type UserLearningPath = typeof userLearningPaths.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type PostTag = typeof postTags.$inferSelect;
export type CourseTag = typeof courseTags.$inferSelect;
export type TrendingTopic = typeof trendingTopics.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;
export type UserStat = typeof userStats.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type PremiumFeature = typeof premiumFeatures.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type UserPostLike = typeof userPostLikes.$inferSelect;
export type UserInterest = typeof userInterests.$inferSelect;

// Define insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertUserCourse = z.infer<typeof insertUserCourseSchema>;
export type InsertLearningPath = z.infer<typeof insertLearningPathSchema>;
export type InsertUserLearningPath = z.infer<typeof insertUserLearningPathSchema>;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type InsertPostTag = z.infer<typeof insertPostTagSchema>;
export type InsertCourseTag = z.infer<typeof insertCourseTagSchema>;
export type InsertTrendingTopic = z.infer<typeof insertTrendingTopicSchema>;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type InsertUserStat = z.infer<typeof insertUserStatSchema>;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type InsertPremiumFeature = z.infer<typeof insertPremiumFeatureSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type InsertUserPostLike = z.infer<typeof insertUserPostLikeSchema>;
export type InsertUserInterest = z.infer<typeof insertUserInterestSchema>;
