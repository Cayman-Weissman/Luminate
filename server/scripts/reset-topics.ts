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
        { title: 'Web Development', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 1, tags: [] },
        { title: 'Mobile App Development', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 2, tags: [] },
        { title: 'Data Science', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 3, tags: [] },
        { title: 'Artificial Intelligence & Machine Learning', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 4, tags: [] },
        { title: 'Cloud Computing', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 5, tags: [] },
        { title: 'Blockchain & Cryptocurrency', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 6, tags: [] },
        { title: 'Digital Marketing', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 7, tags: [] },
        { title: 'UX/UI Design', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 8, tags: [] },
        { title: 'Graphic Design', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 9, tags: [] },
        { title: 'Game Development', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 10, tags: [] },
        { title: 'Programming Languages', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 11, tags: [] },
        { title: 'E-Commerce Development', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 12, tags: [] },
        { title: 'Cloud DevOps', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 13, tags: [] },
        { title: 'Cybersecurity', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 14, tags: [] },
        { title: 'Finance & Accounting', description: '', category: '', icon: 'server', learnerCount: 0, growthPercentage: 0, rank: 15, tags: [] },
        { title: 'Economics', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 16, tags: [] },
        { title: 'Public Speaking & Communication', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 17, tags: [] },
        { title: 'Entrepreneurship', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 18, tags: [] },
        { title: 'Video Editing & Production', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 19, tags: [] },
        { title: 'Photography & Videography', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 20, tags: [] },
        { title: 'Business Management', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 21, tags: [] },
        { title: 'Fitness & Nutrition', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 22, tags: [] },
        { title: 'Cooking & Culinary Arts', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 23, tags: [] },
        { title: 'Psychology', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 24, tags: [] },
        { title: 'Sociology', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 25, tags: [] },
        { title: 'Conflict Resolution & Negotiation', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 26, tags: [] },
        { title: 'Supply Chain Management & Logistics', description: '', category: '', icon: '', learnerCount: 0, growthPercentage: 0, rank: 27, tags: [] }
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