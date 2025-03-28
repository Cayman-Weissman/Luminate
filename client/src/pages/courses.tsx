import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import CourseCard from '@/components/dashboard/course-card';
import FeatureCard from '@/components/premium/feature-card';
import TestimonialCard from '@/components/ui/testimonial-card';
import { useToast } from '@/hooks/use-toast';

const Courses = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch courses based on active tab and search query
  const { data: courses = [], isLoading: coursesLoading } = useQuery<any[]>({
    queryKey: ['/api/courses', activeTab, searchQuery],
  });
  
  // Fetch premium features
  const { data: premiumFeatures = [], isLoading: featuresLoading } = useQuery<any[]>({
    queryKey: ['/api/premium/features'],
  });
  
  // Fetch testimonials
  const { data: testimonials = [], isLoading: testimonialsLoading } = useQuery<any[]>({
    queryKey: ['/api/testimonials'],
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Trigger search with current query
    toast({
      title: "Searching courses",
      description: `Searching for "${searchQuery}"`,
    });
  };
  
  const handleSubscribe = () => {
    toast({
      title: "Subscribe",
      description: "Opening subscription options",
    });
  };
  
  const isLoading = coursesLoading || featuresLoading || testimonialsLoading;
  
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[70vh]">Loading courses data...</div>;
  }
  
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Course Search & Categories */}
      <section className="mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-4 md:mb-0">Explore Courses</h2>
          
          <form onSubmit={handleSearch} className="w-full md:w-64">
            <div className="relative">
              <Input 
                type="text" 
                placeholder="Search courses..." 
                className="bg-zinc-800 border-zinc-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit"
                size="icon"
                variant="ghost" 
                className="absolute right-0 top-0 h-full"
              >
                <i className="ri-search-line"></i>
                <span className="sr-only">Search</span>
              </Button>
            </div>
          </form>
        </div>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-zinc-800 p-1">
            <TabsTrigger value="all">All Courses</TabsTrigger>
            <TabsTrigger value="technology">Technology</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="science">Science</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses?.map((course: any) => (
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
          </TabsContent>
        </Tabs>
      </section>
      
      {/* Featured Learning Tools */}
      <section id="featured-tools" className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Featured Learning Tools</h2>
        
        <Card className="bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-xl overflow-hidden shadow-lg p-6 relative mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="#FFD700" d="M44.8,-76.1C59.3,-70.7,73.1,-60.9,81.5,-47.7C89.9,-34.4,92.9,-17.2,90.2,-1.6C87.6,14.1,79.3,28.2,69.4,39.7C59.6,51.2,48.1,60.1,35.5,67.2C22.9,74.3,9.2,79.6,-4.7,79.8C-18.7,80,-37.3,75.2,-51.1,65.1C-64.9,55,-73.8,39.7,-79.6,23.3C-85.4,6.9,-88,-10.7,-82.9,-25.9C-77.8,-41.2,-65,-54.2,-50.5,-60C-36,-65.9,-19.8,-64.6,-3.3,-69.4C13.2,-74.2,30.3,-81.4,44.8,-76.1Z" transform="translate(100 100)" />
            </svg>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center">
            <div className="flex-1 z-10 lg:pr-6">
              <span className="bg-primary text-zinc-900 font-medium px-3 py-1 rounded-full text-sm inline-block mb-3">Free Access</span>
              <h3 className="text-2xl font-bold text-white mb-4">Enhance Your Learning Journey</h3>
              <p className="text-zinc-400 mb-6">Access all our learning tools including expert tutors, certification content, career coaching, and more - completely free for all users.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {premiumFeatures?.map((feature: any) => (
                  <FeatureCard
                    key={feature.id}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                  />
                ))}
              </div>
            </div>
            
            <div className="bg-zinc-900 p-6 rounded-xl w-full lg:w-80 flex-shrink-0 z-10">
              <div className="text-center mb-4">
                <h4 className="text-xl font-bold text-white">All Features Included</h4>
                <div className="flex items-center justify-center my-4">
                  <span className="text-3xl font-bold text-white">Free</span>
                </div>
                <p className="text-zinc-400 text-sm mb-6">All tools and resources available to every user.</p>
              </div>
              
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-zinc-900 font-medium mb-4"
              >
                Start Learning Now
              </Button>
              <Button variant="outline" className="w-full">
                Explore Features
              </Button>
            </div>
          </div>
        </Card>
      </section>
      
      {/* Testimonials */}
      <section id="testimonials" className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">What Our Users Say</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials?.map((testimonial: any) => (
            <TestimonialCard
              key={testimonial.id}
              name={testimonial.name}
              role={testimonial.role}
              avatar={testimonial.avatar}
              text={testimonial.text}
              rating={testimonial.rating}
            />
          ))}
        </div>
      </section>
    </main>
  );
};

export default Courses;
