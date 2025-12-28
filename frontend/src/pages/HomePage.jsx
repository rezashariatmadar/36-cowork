import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const HomePage = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            CoworkSpace
          </div>
          <nav className="flex gap-4">
            <Link to="/login" className="px-4 py-2 text-gray-600 hover:text-indigo-600 font-medium transition-colors">
              Login
            </Link>
            <Link to="/signup" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-lg hover:shadow-indigo-500/30">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.div initial="initial" animate="animate" variants={fadeInUp}>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6">
            Work where <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              inspiration strikes.
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-500 mb-10">
            Premium coworking spaces designed for creators, startups, and remote teams. 
            Experience productivity redefined.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/signup" className="px-8 py-4 bg-gray-900 text-white text-lg font-semibold rounded-xl hover:bg-gray-800 transition-all transform hover:-translate-y-1">
              Book a Desk
            </Link>
            <Link to="/layout" className="px-8 py-4 bg-white text-gray-900 text-lg font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-900 transition-all">
              View Spaces
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white rounded-2xl overflow-hidden shadow-xl"
              >
                <div className="h-64 bg-gray-200 animate-pulse relative group">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    Space Image {i}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">Modern Office {i}</h3>
                  <p className="text-gray-500">High-speed WiFi, ergonomic chairs, and unlimited coffee.</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog/Testimonials Placeholder */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-12">What our members say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="p-8 bg-indigo-50 rounded-2xl text-left">
                <p className="text-lg italic text-gray-700 mb-4">"The best place to get work done. The community is amazing!"</p>
                <div className="font-bold">- Sarah J., Designer</div>
             </div>
             <div className="p-8 bg-purple-50 rounded-2xl text-left">
                <p className="text-lg italic text-gray-700 mb-4">"I love the flexibility and the 24/7 access. Highly recommended."</p>
                <div className="font-bold">- Mike T., Developer</div>
             </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="text-xl font-bold">CoworkSpace</div>
            <div className="text-gray-400">© 2024 CoworkSpace. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
