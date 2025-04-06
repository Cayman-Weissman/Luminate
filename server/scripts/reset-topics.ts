import { db } from '../database';
import { sql } from 'drizzle-orm';
import { trendingTopics, posts } from '@shared/schema';

async function resetTopics() {
  try {
    // Use Drizzle's transaction API
    await db.transaction(async (tx) => {
      // First, get the current topics to preserve their IDs
      const currentTopics = await tx.select().from(trendingTopics);
      
      // Clear existing topics
      await tx.delete(trendingTopics);

      // Insert new topics
      const topics = [
        { title: 'Web Development', description: 'General topics and discussions about learning and education', category: 'general', icon: 'chat', learnerCount: 0, growthPercentage: 0, rank: 1, tags: [] },
        { title: 'Mobile App Development', description: 'Get help with programming questions and challenges', category: 'programming', icon: 'code', learnerCount: 0, growthPercentage: 0, rank: 2, tags: [] },
        { title: 'Data Science', description: 'Discuss career paths and professional development', category: 'career', icon: 'briefcase', learnerCount: 0, growthPercentage: 0, rank: 3, tags: [] },
        { title: 'Artificial Intelligence & Machine Learning', description: 'Share and learn effective study techniques', category: 'learning', icon: 'book', learnerCount: 0, growthPercentage: 0, rank: 4, tags: [] },
        { title: 'Cloud Computing', description: 'Show off your learning projects and get feedback', category: 'projects', icon: 'presentation', learnerCount: 0, growthPercentage: 0, rank: 5, tags: [] },
        { title: 'Blockchain & Cryptocurrency', description: 'Share helpful learning resources and materials', category: 'resources', icon: 'share', learnerCount: 0, growthPercentage: 0, rank: 6, tags: [] },
        { title: 'Digital Marketing', description: 'Discuss learning challenges and how to overcome them', category: 'learning', icon: 'target', learnerCount: 0, growthPercentage: 0, rank: 7, tags: [] },
        { title: 'UX/UI Design', description: 'Information about community events and meetups', category: 'events', icon: 'calendar', learnerCount: 0, growthPercentage: 0, rank: 8, tags: [] },
        { title: 'Graphic Design', description: 'Share your learning journey and success stories', category: 'stories', icon: 'trophy', learnerCount: 0, growthPercentage: 0, rank: 9, tags: [] },
        { title: 'Game Development', description: 'Provide feedback and suggestions for the platform', category: 'feedback', icon: 'message-square', learnerCount: 0, growthPercentage: 0, rank: 10, tags: [] },
        { title: 'Programming Languages', description: 'Discussions about data science, machine learning, and analytics', category: 'programming', icon: 'database', learnerCount: 0, growthPercentage: 0, rank: 11, tags: [] },
        { title: 'E-Commerce Development', description: 'Topics related to web development and design', category: 'programming', icon: 'globe', learnerCount: 0, growthPercentage: 0, rank: 12, tags: [] },
        { title: 'Cloud DevOps', description: 'Topics related to game development and design', category: 'programming', icon: 'gamepad', learnerCount: 0, growthPercentage: 0, rank: 13, tags: [] },
        { title: 'Cybersecurity', description: 'Discussions about security, privacy, and ethical hacking', category: 'programming', icon: 'shield', learnerCount: 0, growthPercentage: 0, rank: 14, tags: [] },
        { title: 'Finance & Accounting', description: 'Discussions about development operations and deployment', category: 'programming', icon: 'server', learnerCount: 0, growthPercentage: 0, rank: 15, tags: [] },
        { title: 'Economics', description: 'Topics related to user interface and experience design', category: 'design', icon: 'palette', learnerCount: 0, growthPercentage: 0, rank: 16, tags: [] },
        { title: 'Public Speaking & Communication', description: 'Discussions about blockchain technology and cryptocurrencies', category: 'programming', icon: 'link', learnerCount: 0, growthPercentage: 0, rank: 17, tags: [] },
        { title: 'Entrepreneurship', description: 'Topics related to artificial intelligence and machine learning', category: 'programming', icon: 'brain', learnerCount: 0, growthPercentage: 0, rank: 18, tags: [] }
        { title: 'Video Editing & Production', description: 'Discussions about mobile app development', category: 'programming', icon: 'smartphone', learnerCount: 0, growthPercentage: 0, rank: 19, tags: [] },
        { title: 'Photography & Videography', description: 'Topics related to game development and design', category: 'programming', icon: 'gamepad', learnerCount: 0, growthPercentage: 0, rank: 20, tags: [] },
        { title: 'Business Management', description: 'Discussions about security, privacy, and ethical hacking', category: 'programming', icon: 'shield', learnerCount: 0, growthPercentage: 0, rank: 21, tags: [] },
        { title: 'Fitness & Nutrition', description: 'Topics related to cloud services and infrastructure', category: 'programming', icon: 'cloud', learnerCount: 0, growthPercentage: 0, rank: 22, tags: [] },
        { title: 'Cooking & Culinary Arts', description: 'Discussions about development operations and deployment', category: 'programming', icon: 'server', learnerCount: 0, growthPercentage: 0, rank: 23, tags: [] },
        { title: 'Psychology', description: 'Topics related to user interface and experience design', category: 'design', icon: 'palette', learnerCount: 0, growthPercentage: 0, rank: 24, tags: [] },
        { title: 'Sociology', description: 'Discussions about blockchain technology and cryptocurrencies', category: 'programming', icon: 'link', learnerCount: 0, growthPercentage: 0, rank: 25, tags: [] },
        { title: 'Conflict Resolution & Negotiation', description: 'Topics related to artificial intelligence and machine learning', category: 'programming', icon: 'brain', learnerCount: 0, growthPercentage: 0, rank: 26, tags: [] },
        { title: 'Supply Chain Management & Logistics', description: 'Topics related to artificial intelligence and machine learning', category: 'programming', icon: 'brain', learnerCount: 0, growthPercentage: 0, rank: 27, tags: [] }
      ];

      // Insert topics and store their IDs
      const insertedTopics = [];
      for (const topic of topics) {
        try {
          const result = await tx.insert(trendingTopics).values(topic).returning();
          if (result.length > 0) {
            insertedTopics.push(result[0]);
          }
        } catch (error) {
          console.log(`Topic "${topic.title}" already exists, skipping...`);
        }
      }

      // Update posts to reference the first topic (General Discussion) as a fallback
      if (insertedTopics.length > 0) {
        const generalDiscussionId = insertedTopics[0].id;
        await tx.update(posts)
          .set({ topicId: generalDiscussionId })
          .where(sql`1=1`);
      }
    });

    console.log('Topics reset successfully');
  } catch (error) {
    console.error('Error resetting topics:', error);
  }
}

// Run the script
resetTopics(); 