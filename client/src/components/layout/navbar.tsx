import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/auth-context';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Navbar = () => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location === path;
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/topics', label: 'Learning Hub' },
    { href: '/community', label: 'Community' }
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-zinc-900/80 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex-shrink-0 flex items-center cursor-pointer">
                <span className="text-primary font-bold text-2xl font-accent">Luminate</span>
              </div>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {user ? (
                // Show dashboard navigation links when user is logged in
                navLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <div className={`${isActive(link.href) ? 'border-b-2 border-primary text-white' : 'border-transparent hover:border-primary border-b-2 text-zinc-400 hover:text-white'} px-1 py-2 text-sm font-medium cursor-pointer`}>
                      {link.label}
                    </div>
                  </Link>
                ))
              ) : (
                // Show public navigation links when user is not logged in
                <>
                  <Link href="/#features">
                    <div className={`border-transparent hover:border-primary border-b-2 text-zinc-400 hover:text-white px-1 py-2 text-sm font-medium cursor-pointer`}>
                      Features
                    </div>
                  </Link>
                  <Link href="/#testimonials">
                    <div className={`border-transparent hover:border-primary border-b-2 text-zinc-400 hover:text-white px-1 py-2 text-sm font-medium cursor-pointer`}>
                      Testimonials
                    </div>
                  </Link>
                  <Link href="/#pricing">
                    <div className={`border-transparent hover:border-primary border-b-2 text-zinc-400 hover:text-white px-1 py-2 text-sm font-medium cursor-pointer`}>
                      Pricing
                    </div>
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {user ? (
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="mr-4">
                <i className="ri-search-line text-xl"></i>
                <span className="sr-only">Search</span>
              </Button>
              <Button variant="ghost" size="icon" className="mr-4">
                <i className="ri-notification-3-line text-xl"></i>
                <span className="sr-only">Notifications</span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full h-8 w-8 p-0">
                    <Avatar>
                      {user.profileImage ? (
                        <AvatarImage src={user.profileImage} alt={user.username} />
                      ) : (
                        <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem>
                    <Link href="/profile">
                      <span className="w-full">Your Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/settings">
                      <span className="w-full">Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/register">
                <Button>Sign up</Button>
              </Link>
            </div>
          )}
          
          <div className="flex items-center md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
            >
              <i className="ri-menu-line text-xl"></i>
              <span className="sr-only">Menu</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`} id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {user ? (
            // Show dashboard navigation links when user is logged in
            navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div 
                  className={`${isActive(link.href) ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'} block px-3 py-2 rounded-md text-base font-medium cursor-pointer`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </div>
              </Link>
            ))
          ) : (
            // Show public navigation links when user is not logged in
            <>
              <Link href="/#features">
                <div 
                  className="text-zinc-400 hover:bg-zinc-800 hover:text-white block px-3 py-2 rounded-md text-base font-medium cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </div>
              </Link>
              <Link href="/#testimonials">
                <div 
                  className="text-zinc-400 hover:bg-zinc-800 hover:text-white block px-3 py-2 rounded-md text-base font-medium cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Testimonials
                </div>
              </Link>
              <Link href="/#pricing">
                <div 
                  className="text-zinc-400 hover:bg-zinc-800 hover:text-white block px-3 py-2 rounded-md text-base font-medium cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </div>
              </Link>
              <Link href="/login">
                <div 
                  className="text-zinc-400 hover:bg-zinc-800 hover:text-white block px-3 py-2 rounded-md text-base font-medium cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </div>
              </Link>
              <Link href="/register">
                <div 
                  className="text-zinc-400 hover:bg-zinc-800 hover:text-white block px-3 py-2 rounded-md text-base font-medium cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign up
                </div>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
