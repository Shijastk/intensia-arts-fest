import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const Header: React.FC = () => {
  const [sticky, setSticky] = useState(false);
  const [navbarOpen, setNavbarOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setSticky(window.scrollY >= 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 pt-4 sm:pt-6 transition-all duration-500">
      <nav
        className={`w-full max-w-7xl flex items-center justify-between py-3.5 px-6 sm:px-10 rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${sticky
            ? 'clay-nav translate-y-1 scale-[1.01]'
            : 'clay-nav scale-100'
          }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Logo />
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-10">
          <a
            href="#home"
            className="text-lg font-medium text-midnight_text hover:text-primary transition-colors"
          >
            Home
          </a>
          <a
            href="#about"
            className="text-lg font-medium text-midnight_text hover:text-primary transition-colors"
          >
            About
          </a>
          <a
            href="#features"
            className="text-lg font-medium text-midnight_text hover:text-primary transition-colors"
          >
            Features
          </a>
          <a
            href="#people"
            className="text-lg font-medium text-midnight_text hover:text-primary transition-colors"
          >
            Showcase
          </a>
          <a
            href="#pricing"
            className="text-lg font-medium text-midnight_text hover:text-primary transition-colors"
          >
            Highlights
          </a>
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden lg:flex items-center gap-4">
          <Link
            to="/login"
            className="clay-button-secondary px-7 py-3 font-semibold text-lg cursor-pointer"
          >
            Sign In
          </Link>
          <Link
            to="/login"
            className="clay-button-primary px-7 py-3 font-semibold text-lg cursor-pointer"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setNavbarOpen(!navbarOpen)}
          className="lg:hidden p-2 text-midnight_text focus:outline-none"
          aria-label="Toggle Navigation"
        >
          <div className="w-6 h-4 flex flex-col justify-between">
            <span
              className={`block h-0.5 w-full bg-midnight_text transform transition-transform duration-300 ${navbarOpen ? 'rotate-45 translate-y-1.5' : ''
                }`}
            />
            <span
              className={`block h-0.5 w-full bg-midnight_text transition-opacity duration-300 ${navbarOpen ? 'opacity-0' : ''
                }`}
            />
            <span
              className={`block h-0.5 w-full bg-midnight_text transform transition-transform duration-300 ${navbarOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
            />
          </div>
        </button>
      </nav>

      {/* Mobile Floating Dropdown Menu */}
      {navbarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setNavbarOpen(false)}
          />
          <div className="absolute top-full left-4 right-4 mt-3 bg-white/95 backdrop-blur-xl border border-gray-200/90 rounded-3xl p-6 shadow-2xl z-50 lg:hidden flex flex-col gap-5 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <Logo />
              <button
                onClick={() => setNavbarOpen(false)}
                className="text-gray-400 hover:text-primary transition-colors text-xl font-bold p-1"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <nav className="flex flex-col gap-4">
              <a
                href="#home"
                onClick={() => setNavbarOpen(false)}
                className="text-lg font-medium text-midnight_text hover:text-primary py-1.5 transition-colors"
              >
                Home
              </a>
              <a
                href="#about"
                onClick={() => setNavbarOpen(false)}
                className="text-lg font-medium text-midnight_text hover:text-primary py-1.5 transition-colors"
              >
                About
              </a>
              <a
                href="#features"
                onClick={() => setNavbarOpen(false)}
                className="text-lg font-medium text-midnight_text hover:text-primary py-1.5 transition-colors"
              >
                Features
              </a>
              <a
                href="#people"
                onClick={() => setNavbarOpen(false)}
                className="text-lg font-medium text-midnight_text hover:text-primary py-1.5 transition-colors"
              >
                Showcase
              </a>
              <a
                href="#pricing"
                onClick={() => setNavbarOpen(false)}
                className="text-lg font-medium text-midnight_text hover:text-primary py-1.5 transition-colors"
              >
                Highlights
              </a>
            </nav>

            <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
              <Link
                to="/login"
                onClick={() => setNavbarOpen(false)}
                className="w-full text-center bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-white py-3 rounded-full font-medium text-lg transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                onClick={() => setNavbarOpen(false)}
                className="w-full text-center bg-primary text-white border-2 border-primary hover:bg-transparent hover:text-primary py-3 rounded-full font-medium text-lg transition-all shadow-md shadow-primary/20"
              >
                Get Started
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;