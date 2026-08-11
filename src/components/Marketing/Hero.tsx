import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import usthadImg from '../../images/usthad.png';
import starImg from '../../images/star.svg';

const Hero: React.FC = () => {
  return (
    <section className='bg-header min-h-[85vh] lg:min-h-[90vh] pt-28 sm:pt-32 lg:pt-36 pb-8 lg:pb-12 overflow-hidden relative flex items-center' id="home">
      
      {/* Soft Ambient Glow */}
      <div className="absolute top-16 left-1/3 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <img
        src={starImg}
        alt=''
        className='absolute bottom-8 left-8 w-24 h-24 opacity-15 pointer-events-none -z-10'
      />

      <div className='container px-4 mx-auto h-full flex items-center relative z-10'>
        <div className='grid grid-cols-1 lg:grid-cols-12 items-center lg:items-end gap-y-10 lg:gap-y-0 w-full h-full'>
          
          {/* LEFT COLUMN: Clean Messaging with Generous Breathing Space */}
          <div className='col-span-7 flex flex-col justify-center gap-5 lg:gap-6 relative pb-6 lg:pb-10'>
            
            {/* Direct Value Badge */}
            <div className="flex justify-center lg:justify-start">
              <span className="skeuo-chip-rose inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 shadow-sm">
                <Icon icon="tabler:trophy" className="text-sm" />
                Arts Fest Management &amp; Scoreboard
              </span>
            </div>

            <h1 className='text-midnight_text text-3xl sm:text-4xl lg:text-5xl font-extrabold text-center lg:text-start leading-tight tracking-tight'>
              All-in-One Arts Fest Management &amp; Live Scoreboard.
            </h1>
            
            <h3 className='text-midnight_text/80 text-base sm:text-lg font-normal text-center lg:text-start max-w-xl mx-auto lg:mx-0 leading-relaxed'>
              The official digital platform powering real-time zone leaderboards, anonymous greenroom scoring, and instant stage result declarations.
            </h3>
            
            <div className='pt-2 mx-auto lg:mx-0 flex flex-wrap gap-4 items-center justify-center lg:justify-start'>
              <Link
                to="/results"
                className='skeuo-button-primary py-3.5 px-7 font-bold text-base inline-flex items-center gap-2 text-center cursor-pointer shadow-lg'
              >
                <Icon icon="tabler:chart-bar" className="text-xl" />
                <span>View Live Scoreboard</span>
              </Link>
              <Link
                to="/login"
                className='skeuo-button-secondary py-3.5 px-7 font-bold text-base inline-flex items-center gap-2 text-center cursor-pointer shadow-md'
              >
                <Icon icon="tabler:lock" className="text-xl" />
                <span>Official Fest Login</span>
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: Usthad Image with Floating Skeuomorphic Chips */}
          <div className='col-span-5 flex justify-center items-end h-full pt-4 lg:pt-0'>
            <div className='relative w-full max-w-md lg:max-w-full flex justify-center items-end h-full'>
              <img
                src={usthadImg}
                alt='Hero Image of Usthad'
                width={800} 
                height={900} 
                className='w-auto h-auto max-h-[70vh] lg:max-h-[80vh] object-contain object-bottom drop-shadow-xl'
                style={{
                  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 82%, rgba(0,0,0,0) 100%)',
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 82%, rgba(0,0,0,0) 100%)'
                }}
              />

              {/* Tactile Live Leaderboards Chip (Top-Left) */}
              <div className='absolute top-1/4 left-0 ml-2 lg:-ml-6 animate-[bounce_3s_infinite]'>
                <span className='skeuo-chip-emerald font-bold px-4 py-2.5 block whitespace-nowrap text-xs sm:text-sm shadow-lg'>
                  🏆 Live Zone Scores (A, B, C, D)
                </span>
              </div>

              {/* Tactile Anonymous Judging Chip (Middle-Left) */}
              <div className='absolute top-1/2 left-0 -ml-2 lg:-ml-10 animate-[bounce_4s_infinite]'>
                <span className='skeuo-chip-indigo font-bold px-4 py-2.5 block whitespace-nowrap text-xs sm:text-sm shadow-lg'>
                  🔒 Anonymous Code #A-104
                </span>
              </div>

              {/* Tactile Green Room Control Chip (Top-Right) */}
              <div className='absolute top-1/4 right-0 mt-6 mr-2 lg:-mr-4 animate-[bounce_3.5s_infinite]'>
                <span className='skeuo-chip-rose font-bold px-4 py-2.5 block whitespace-nowrap text-xs sm:text-sm shadow-lg'>
                  📱 Judge Tablet Scoring
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
