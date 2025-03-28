import React from 'react';
import { Link } from 'wouter';

const Footer = () => {
  return (
    <footer className="bg-zinc-900 border-t border-zinc-800 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Luminate</h3>
            <p className="text-zinc-400 text-sm mb-4">Empowering the future of education through AI-driven learning.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-zinc-400 hover:text-white">
                <i className="ri-twitter-fill text-xl"></i>
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-zinc-400 hover:text-white">
                <i className="ri-linkedin-box-fill text-xl"></i>
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="#" className="text-zinc-400 hover:text-white">
                <i className="ri-facebook-fill text-xl"></i>
                <span className="sr-only">Facebook</span>
              </a>
              <a href="#" className="text-zinc-400 hover:text-white">
                <i className="ri-instagram-fill text-xl"></i>
                <span className="sr-only">Instagram</span>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-4">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/courses"><div className="text-zinc-400 hover:text-white cursor-pointer">Courses</div></Link></li>
              <li><Link href="/certifications"><div className="text-zinc-400 hover:text-white cursor-pointer">Certifications</div></Link></li>
              <li><Link href="/community"><div className="text-zinc-400 hover:text-white cursor-pointer">Community</div></Link></li>
              <li><Link href="/trending"><div className="text-zinc-400 hover:text-white cursor-pointer">Trending Topics</div></Link></li>
              <li><Link href="/premium"><div className="text-zinc-400 hover:text-white cursor-pointer">Premium Features</div></Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-zinc-400 hover:text-white">Blog</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-white">Tutorials</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-white">FAQs</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-white">Support Center</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-white">Career Help</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-zinc-400 hover:text-white">About Us</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-white">Careers</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="text-zinc-400 hover:text-white">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-zinc-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-zinc-400 text-sm">© {new Date().getFullYear()} Luminate. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
            <select className="bg-zinc-800 text-zinc-400 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
              <option>English (US)</option>
              <option>Español</option>
              <option>Français</option>
              <option>Deutsch</option>
              <option>中文</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
