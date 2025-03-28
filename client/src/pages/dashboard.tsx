import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import StatsCard from '@/components/dashboard/stats-card';
import CourseCard from '@/components/dashboard/course-card';
import SkillRoadmap, { RoadmapItem } from '@/components/dashboard/skill-roadmap';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// Interfaces for dashboard data
interface UserStat {
  id: number;
  title: string;
  value: string | number;
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

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
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
  
  const isLoading = statsLoading || coursesLoading || roadmapLoading;
  
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[70vh]">Loading dashboard data...</div>;
  }
  
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Moved premium banner to the bottom */}
      
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Your Learning Dashboard</h2>
          <div className="hidden sm:block">
            <div className="inline-flex rounded-md shadow-sm">
              <Button variant="outline" className="rounded-l-md rounded-r-none">Today</Button>
              <Button variant="outline" className="rounded-none border-l border-zinc-700">This Week</Button>
              <Button variant="outline" className="rounded-r-md rounded-l-none border-l border-zinc-700">All Time</Button>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {userStats?.map((stat: UserStat) => (
            <StatsCard
              key={stat.id}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              iconBgColor={stat.iconBgColor}
              iconColor={stat.iconColor}
              progress={stat.progress}
              progressColor={stat.progressColor}
              subtitle={stat.subtitle}
            />
          ))}
        </div>
        
        {/* Current Courses */}
        <h3 className="text-xl font-semibold text-white mb-4">Continue Learning</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {activeCourses?.map((course: UserCourse) => (
            <CourseCard
              key={course.id}
              id={course.id}
              title={course.title}
              category={course.category}
              description={course.description}
              timeLeft={course.timeLeft}
              progress={course.progress}
              image={course.image}
            />
          ))}
        </div>
        
        {/* Skill Roadmap */}
        <SkillRoadmap
          title={roadmapData?.title}
          progress={roadmapData?.progress}
          items={roadmapData?.items}
          onContinue={handleRoadmapContinue}
        />
      </section>
      
      {/* Premium Banner - Now at the bottom */}
      <section className="mb-6">
        <Card className="bg-zinc-800/90 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex-1 mb-4 md:mb-0">
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L7 7H3v4l-2 4 2 4v3h18v-3l2-4-2-4V7h-4L12 2z"/>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-zinc-400 mb-1">Enhance Your Learning Experience</p>
                    <h3 className="text-xl font-medium text-white flex items-center mb-2">
                      Unlock Premium Features
                    </h3>
                    <p className="text-zinc-300 max-w-xl">
                      Get access to expert tutors, unlimited certifications, advanced content, and career coaching.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center md:items-end">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm mb-3">Premium</span>
                <Button className="bg-primary hover:bg-primary/90 text-zinc-900 font-medium w-full md:w-auto">
                  Upgrade Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default Dashboard;
