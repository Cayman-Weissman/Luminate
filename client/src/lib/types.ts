// User related types
export interface User {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  profileImage?: string;
  isInstructor: boolean;
  createdAt: Date;
}

// Course related types
export interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  image: string;
  instructorId: number;
  lessons: number;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCourse {
  id: number;
  userId: number;
  courseId: number;
  progress: number;
  lastAccessedAt: Date;
  completedLessons: number[];
  course: Course;
}

// Learning path and roadmap types
export interface RoadmapItem {
  id: number;
  title: string;
  status: 'completed' | 'in-progress' | 'locked';
  completedDate?: string;
  progress?: number;
}

export interface LearningPath {
  id: number;
  title: string;
  description: string;
  progress: number;
  items: RoadmapItem[];
}

// Community types
export interface Post {
  id: number;
  authorId: number;
  content: string;
  createdAt: Date;
  likes: number;
  comments: number;
  tags: Tag[];
  attachment?: {
    type: 'image' | 'code';
    content: string;
    language?: string;
  };
}

export interface Comment {
  id: number;
  postId: number;
  authorId: number;
  content: string;
  createdAt: Date;
  likes: number;
}

export interface Tag {
  id: number;
  name: string;
}

// Trending topics
export interface TrendingTopic {
  id: number;
  title: string;
  description: string;
  category: string;
  learnerCount: number;
  growthPercentage: number;
  icon: string;
  iconBackground?: string;
  iconColor?: string;
  tags?: string[];
}

// Trending ticker items
export interface TrendingItem {
  id: number;
  rank: number;
  title: string;
  changePercentage: number;
}

// Achievement and gamification
export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  earnedAt?: Date;
}

export interface UserStats {
  streak: number;
  hoursLearned: number;
  pointsEarned: number;
  badgesCount: number;
  completedCourses: number;
}

// Premium features
export interface PremiumFeature {
  id: number;
  title: string;
  description: string;
  icon: string;
}

// Testimonials
export interface Testimonial {
  id: number;
  name: string;
  role: string;
  text: string;
  avatar: string;
  rating: number;
}
