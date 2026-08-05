import React, { useEffect, useState } from 'react';

const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const scrollToTop = () => {
    const lenis = (window as any).__lenis;
    if (lenis) {
      lenis.scrollTo(0);
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {isVisible && (
        <button
          onClick={scrollToTop}
          aria-label="scroll to top"
          className="back-to-top flex h-10 w-10 cursor-pointer items-center justify-center rounded-md bg-[#102C46] text-white shadow-md transition duration-300 ease-in-out hover:bg-black"
        >
          <span className="mt-[2px] h-3 w-3 rotate-45 border-l border-t border-white"></span>
        </button>
      )}
    </div>
  );
};

export default ScrollToTop;
