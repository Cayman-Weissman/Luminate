import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { TrendingTopic, posts, users } from '@shared/schema';

const router = Router();
const prisma = new PrismaClient();

// Get all topics
router.get('/topics', async (req, res) => {
  try {
    const topics = await prisma.trendingTopic.findMany({
      orderBy: {
        rank: 'asc'
      }
    });

    // Transform topics to match the community page interface
    const transformedTopics = topics.map((topic: TrendingTopic) => ({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      category: topic.category,
      followers: topic.learnerCount,
      difficulty: 'beginner' as const, // Default difficulty
      symbol: topic.title.slice(0, 4).toUpperCase() // Create a symbol from the title
    }));

    res.json(transformedTopics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// Get posts for a topic
router.get('/posts', async (req: Request, res: Response) => {
  try {
    const { topic } = req.query;
    
    // Require a topic ID
    if (!topic) {
      return res.status(400).json({ error: 'Topic ID is required' });
    }

    const topicId = parseInt(topic as string);
    if (isNaN(topicId)) {
      return res.status(400).json({ error: 'Invalid topic ID' });
    }

    // Get all posts for the topic
    const posts = await prisma.post.findMany({
      where: { topicId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true,
          },
        },
        // Include the original post for reposts
        repostedPost: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isVerified: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get replies for each post
    const postsWithReplies = await Promise.all(posts.map(async (post: typeof posts.$inferSelect & { author: typeof users.$inferSelect }) => {
      const replies = await prisma.post.findMany({
        where: { replyTo: post.id },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              isVerified: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return {
        ...post,
        replies,
      };
    }));

    res.json(postsWithReplies);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create a new post
router.post('/posts', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { topicId, content, sentiment, replyTo, repostId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User must be authenticated to create posts' });
    }

    if (!topicId || !content) {
      return res.status(400).json({ error: 'Topic ID and content are required' });
    }

    // Verify the topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId }
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // If this is a reply, verify the parent post exists
    if (replyTo) {
      const parentPost = await prisma.post.findUnique({
        where: { id: replyTo }
      });
      if (!parentPost) {
        return res.status(404).json({ error: 'Parent post not found' });
      }
      // Update the parent post's comment count
      await prisma.post.update({
        where: { id: replyTo },
        data: { comments: { increment: 1 } }
      });
    }

    // If this is a repost, verify the original post exists
    if (repostId) {
      const originalPost = await prisma.post.findUnique({
        where: { id: repostId }
      });
      if (!originalPost) {
        return res.status(404).json({ error: 'Original post not found' });
      }
      // Update the original post's repost count
      await prisma.post.update({
        where: { id: repostId },
        data: { reposts: { increment: 1 } }
      });
    }

    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        isVerified: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create the post
    const post = await prisma.post.create({
      data: {
        topicId,
        content,
        sentiment,
        authorId: userId,
        replyTo,
        repostId,
        createdAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true,
          },
        },
        repostedPost: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isVerified: true,
              },
            },
          },
        },
      },
    });

    // If this is a reply, include the parent post
    if (replyTo) {
      const parentPost = await prisma.post.findUnique({
        where: { id: replyTo },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              isVerified: true,
            },
          },
        },
      });
      if (parentPost) {
        post.replyTo = parentPost;
      }
    }

    res.json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Delete all posts
router.delete('/posts/all', authenticateToken, async (req: Request, res: Response) => {
  try {
    await prisma.post.deleteMany({});
    res.json({ message: 'All posts deleted successfully' });
  } catch (error) {
    console.error('Error deleting posts:', error);
    res.status(500).json({ error: 'Failed to delete posts' });
  }
});

export default router; 