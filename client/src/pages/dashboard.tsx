import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import StatsCard from '@/components/dashboard/stats-card';
import CourseCard from '@/components/dashboard/course-card';
import SkillRoadmap, { RoadmapItem } from '@/components/dashboard/skill-roadmap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Award, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  Star,
  ChevronRight,
  Bookmark,
  CheckCircle2
} from 'lucide-react';
import { useLocation } from 'wouter';
import { apiRequest } from "@/lib/queryClient";

// Interfaces for dashboard data
interface UserStat {
  id: number;
  title: string;
  value: string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  progress: number;
  progressColor: string;
  subtitle: string;
}

interface UserCourse {
  id: number;
  title: string;
  category: string;
  description: string;
  timeLeft: string;
  progress: number;
  image: string;
}

interface LearningRoadmap {
  title: string;
  progress: number;
  items: RoadmapItem[];
}

interface Topic {
  id: number;
  title: string;
  description: string;
  progress: number;
  lastAccessed: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  progress: number;
  total: number;
}

interface RecentActivity {
  id: number;
  type: 'completed' | 'started' | 'achievement';
  title: string;
  timestamp: string;
  details: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Fetch user stats
  const { data: userStats = [], isLoading: statsLoading } = useQuery<UserStat[]>({
    queryKey: ['/api/user/stats'],
  });
  
  // Fetch active courses
  const { data: activeCourses = [], isLoading: coursesLoading } = useQuery<UserCourse[]>({
    queryKey: ['/api/user/courses/active'],
  });
  
  // Fetch roadmap data
  const { data: roadmapData = { title: '', progress: 0, items: [] }, isLoading: roadmapLoading } = useQuery<LearningRoadmap>({
    queryKey: ['/api/user/roadmap'],
  });

  const { data: topics } = useQuery({
    queryKey: ['userTopics', user?.id],
    queryFn: () => apiRequest('GET', `/api/users/${user?.id}/topics`),
    enabled: !!user?.id
  });

  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ['userAchievements', user?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/users/${user?.id}/achievements`);
      return Array.isArray(response) ? response : [];
    },
    enabled: !!user?.id
  });

  const { data: recentActivity = [] } = useQuery<RecentActivity[]>({
    queryKey: ['userActivity', user?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/users/${user?.id}/activity`);
      return Array.isArray(response) ? response : [];
    },
    enabled: !!user?.id
  });

  const { data: recommendedTopics = [] } = useQuery<Topic[]>({
    queryKey: ['recommendedTopics', user?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/topics/recommended`);
      return Array.isArray(response) ? response : [];
    },
    enabled: !!user?.id
  });
  
  const handleContinueLearning = (courseId: number) => {
    // Navigate to course or lesson
    window.location.href = `/courses/${courseId}`;
  };
  
  const handleRoadmapContinue = (itemId: number) => {
    // Handle roadmap item continuation
    toast({
      title: "Continuing learning",
      description: `Navigating to roadmap item ${itemId}`,
    });
  };
  
  const startLearning = (topicId: number) => {
    setLocation(`/topics/${topicId}`);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const isLoading = statsLoading || coursesLoading || roadmapLoading;
  
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[70vh]">Loading dashboard data...</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {user?.username}!</h1>
        <Button onClick={() => setLocation('/topics')}>
          Browse Topics
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Learning Progress Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2" />
              Learning Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Array.isArray(topics) && topics.map((topic: Topic) => (
                <div key={topic.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{topic.title}</h3>
                      <p className="text-sm text-zinc-400">{topic.description}</p>
                    </div>
                    <Badge variant="outline">
                      {topic.difficulty}
                    </Badge>
                  </div>
                  <Progress value={topic.progress} className="h-2" />
                  <div className="flex justify-between text-sm text-zinc-400">
                    <span>{topic.progress}% Complete</span>
                    <span>Last accessed: {formatDate(topic.lastAccessed)}</span>
                  </div>
                </div>
              ))}
              {!Array.isArray(topics) && (
                <div className="text-center text-zinc-400 py-4">
                  No topics found. Start learning something new!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Achievements Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {achievements?.map((achievement: Achievement) => (
                <div key={achievement.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{achievement.icon}</span>
                      <div>
                        <h3 className="font-medium">{achievement.title}</h3>
                        <p className="text-sm text-zinc-400">{achievement.description}</p>
                      </div>
                    </div>
                    <span className="text-sm text-zinc-400">
                      {achievement.progress}/{achievement.total}
                    </span>
                  </div>
                  <Progress value={(achievement.progress / achievement.total) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity?.map((activity: RecentActivity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="mt-1">
                    {activity.type === 'completed' && <CheckCircle2 className="text-green-500" />}
                    {activity.type === 'started' && <BookOpen className="text-blue-500" />}
                    {activity.type === 'achievement' && <Award className="text-yellow-500" />}
                  </div>
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-zinc-400">{activity.details}</p>
                    <p className="text-xs text-zinc-500">{formatDate(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommended Topics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2" />
              Recommended Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendedTopics?.map((topic: Topic) => (
                <div 
                  key={topic.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-800 hover:bg-zinc-750 cursor-pointer transition-colors"
                  onClick={() => startLearning(topic.id)}
                >
                  <div>
                    <h3 className="font-medium">{topic.title}</h3>
                    <p className="text-sm text-zinc-400">{topic.description}</p>
                  </div>
                  <ChevronRight className="text-zinc-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
