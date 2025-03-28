import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../shared/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Please create a database first.');
  process.exit(1);
}

// Connection for migrations with higher timeout
const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });

async function main() {
  try {
    // Create a drizzle instance with the migrationClient
    const db = drizzle(migrationClient, { schema });

    // Add initial data for critical tables
    console.log('Adding initial data...');
    
    // Add testimonials
    await db.insert(schema.testimonials).values([
      {
        name: 'Jason Torres',
        role: 'Software Engineer',
        text: 'Luminate transformed my career. The AI-powered content helped me learn faster than any other platform.',
        avatar: 'https://i.pravatar.cc/150?img=1',
        rating: 5
      },
      {
        name: 'Sarah Johnson',
        role: 'Data Scientist',
        text: 'The personalized learning paths were exactly what I needed. I finally found a platform that adapts to my pace.',
        avatar: 'https://i.pravatar.cc/150?img=2',
        rating: 5
      },
      {
        name: 'Michael Chen',
        role: 'UX Designer',
        text: 'The community features helped me connect with like-minded professionals. The courses are top-notch quality.',
        avatar: 'https://i.pravatar.cc/150?img=3',
        rating: 4
      }
    ]).onConflictDoNothing();
    
    // Add premium features
    await db.insert(schema.premiumFeatures).values([
      {
        title: 'Expert Tutors',
        description: 'Get personalized guidance from industry professionals',
        icon: 'ri-user-star-line'
      },
      {
        title: 'Unlimited Certifications',
        description: 'Earn verified credentials recognized by employers worldwide',
        icon: 'ri-award-line'
      },
      {
        title: 'Advanced AI Assistant',
        description: 'Access our powerful AI tutor for personalized help 24/7',
        icon: 'ri-robot-line'
      },
      {
        title: 'Career Coaching',
        description: 'Get expert advice on navigating your professional growth',
        icon: 'ri-briefcase-line'
      }
    ]).onConflictDoNothing();
    
    // Add trending topics
    await db.insert(schema.trendingTopics).values([
      {
        title: 'AI & Machine Learning',
        description: 'Learn the fundamentals and advanced concepts of artificial intelligence',
        category: 'technology',
        icon: 'ri-robot-line',
        learnerCount: 28500,
        growthPercentage: 87,
        rank: 1
      },
      {
        title: 'Data Science',
        description: 'Master data analysis, visualization, and predictive modeling',
        category: 'technology',
        icon: 'ri-bar-chart-box-line',
        learnerCount: 22300,
        growthPercentage: 65,
        rank: 2
      },
      {
        title: 'Web Development',
        description: 'Build modern websites and web applications',
        category: 'technology',
        icon: 'ri-code-s-slash-line',
        learnerCount: 19700,
        growthPercentage: 42,
        rank: 3
      },
      {
        title: 'Digital Marketing',
        description: 'Learn strategies to grow businesses through digital channels',
        category: 'business',
        icon: 'ri-line-chart-line',
        learnerCount: 16200,
        growthPercentage: 38,
        rank: 4
      },
      {
        title: 'UX/UI Design',
        description: 'Create beautiful, functional user experiences',
        category: 'design',
        icon: 'ri-paint-brush-line',
        learnerCount: 14800,
        growthPercentage: 31,
        rank: 5
      }
    ]).onConflictDoNothing();
    
    // Add badges
    await db.insert(schema.badges).values([
      {
        name: 'Early Adopter',
        description: 'Joined Luminate during our beta phase',
        icon: 'ri-rocket-line'
      },
      {
        name: 'Course Creator',
        description: 'Created valuable content for the community',
        icon: 'ri-quill-pen-line'
      },
      {
        name: 'Study Streak',
        description: 'Maintained a 30-day learning streak',
        icon: 'ri-fire-line'
      },
      {
        name: 'Top Contributor',
        description: 'Among the most helpful community members',
        icon: 'ri-medal-line'
      }
    ]).onConflictDoNothing();
    
    console.log('Initial data added successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
  
  // Close the connection
  await migrationClient.end();
}

main();