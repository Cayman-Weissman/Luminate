import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PremiumFeature, Testimonial, TrendingTopic } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import DotGridBackground from '@/components/ui/dot-grid-background';

export default function Home() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  // Fetch trending topics for the hero section
  const { data: trendingTopics = [] } = useQuery<TrendingTopic[]>({
    queryKey: ['/api/trending/topics'],
  });

  // Fetch premium features
  const { data: premiumFeatures = [] } = useQuery<PremiumFeature[]>({
    queryKey: ['/api/premium/features'],
  });
  
  // Fetch testimonials
  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ['/api/testimonials'],
  });

  return (
    <div className="min-h-screen relative">
      {/* Dot Grid Background */}
      <DotGridBackground />
      
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/95 to-zinc-800/95 z-0"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Empower Your Learning Journey With AI
              </h1>
              <p className="text-lg text-zinc-300 mb-8">
                Luminate transforms traditional education with personalized AI learning paths, interactive courses, and a supportive global community.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-black font-medium">
                  <Link href="/register">Get Started</Link>
                </Button>
                <Button variant="outline" size="lg" className="text-white border-zinc-600 hover:bg-zinc-700">
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <img 
                src="https://placehold.co/600x400/2a2a2a/FFFFFF?text=AI+Learning+Experience" 
                alt="AI Learning Experience" 
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trending Topics Section */}
      <section className="py-16 px-6 bg-zinc-900/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Trending Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingTopics ? (
              trendingTopics.slice(0, 6).map((topic) => (
                <Card key={topic.id} className="bg-zinc-800/90 border-zinc-700 overflow-hidden backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${topic.icon.startsWith('bg-') ? topic.icon : 'bg-primary/10'} text-primary mr-3`}>
                        <i className={topic.icon.startsWith('ri-') ? topic.icon : 'ri-lightbulb-line'}></i>
                      </div>
                      <h3 className="text-xl font-semibold text-white">{topic.title}</h3>
                    </div>
                    <p className="text-zinc-300 mb-4">{topic.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">{topic.learnerCount.toLocaleString()} learners</span>
                      <span className="text-emerald-400">+{topic.growthPercentage}% growth</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // Placeholder cards while loading
              Array(6).fill(0).map((_, i) => (
                <Card key={i} className="bg-zinc-800/90 border-zinc-700 overflow-hidden backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="h-28 animate-pulse bg-zinc-700 rounded"></div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <div className="mt-10 text-center">
            <Button variant="outline" className="border-zinc-600 text-white hover:bg-zinc-700">
              <Link href="/register">Explore All Topics</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-zinc-800/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-2 text-center">Free Platform Features</h2>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            Discover powerful learning tools available to all users at no cost, designed to enhance your educational journey on Luminate.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {premiumFeatures ? (
              premiumFeatures.map((feature) => (
                <div key={feature.id} className="bg-zinc-900/90 p-6 rounded-lg border border-zinc-700 backdrop-blur-sm">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-primary/10 text-primary mb-4`}>
                    <i className={feature.icon}></i>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-zinc-400">{feature.description}</p>
                </div>
              ))
            ) : (
              // Placeholder while loading
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-zinc-900/90 p-6 rounded-lg border border-zinc-700 backdrop-blur-sm">
                  <div className="w-full h-32 animate-pulse bg-zinc-800 rounded mb-4"></div>
                  <div className="w-2/3 h-4 animate-pulse bg-zinc-800 rounded"></div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-6 bg-zinc-900/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">What Our Users Say</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials ? (
              testimonials.map((testimonial) => (
                <Card key={testimonial.id} className="bg-zinc-800/90 border-zinc-700 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex flex-col h-full">
                      <div className="mb-4">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < testimonial.rating ? "text-yellow-400" : "text-zinc-600"}>★</span>
                        ))}
                      </div>
                      <p className="text-zinc-300 italic mb-6 flex-grow">"{testimonial.text}"</p>
                      <div className="flex items-center mt-auto">
                        <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                          <img src={testimonial.avatar} alt={testimonial.name} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{testimonial.name}</h4>
                          <p className="text-sm text-zinc-400">{testimonial.role}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // Placeholder cards while loading
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="bg-zinc-800/90 border-zinc-700 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="h-48 animate-pulse bg-zinc-700 rounded"></div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary/20 to-primary/5 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Transform Your Learning Experience?</h2>
          <p className="text-lg text-zinc-300 mb-8">Join thousands of learners worldwide who are advancing their skills with Luminate's completely free, AI-powered education platform.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-black font-medium">
              <Link href="/register">Get Started for Free</Link>
            </Button>
            <Button variant="outline" size="lg" className="text-white border-zinc-600 hover:bg-zinc-700">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}