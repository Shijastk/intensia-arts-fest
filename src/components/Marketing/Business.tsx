import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

const withBasePath = (url: string) => url;

const Business: React.FC = () => {
  return (
    <section className='py-20 bg-gradient-to-b from-indigo-50/40 via-blue-50/30 to-slate-50/50 relative overflow-hidden'>
      <div className='container mx-auto px-4'>
        <div className='clay-card p-8 sm:p-12 relative overflow-hidden bg-gradient-to-br from-white via-indigo-50/50 to-blue-50/40 shadow-xl'>
          {/* Subtle Star Pattern Accent */}
          <img
            src={withBasePath('/images/hero/star.svg')}
            alt=''
            className='absolute -top-6 -right-6 w-32 h-32 opacity-10 pointer-events-none'
          />
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10'>
            <div className='col-span-6 flex flex-col justify-center'>
              <span className='clay-chip-coral text-xs font-bold uppercase tracking-wider px-4 py-1.5 w-fit mb-4 shadow-sm'>
                Analytics &amp; Standings
              </span>
              <h2 className='text-midnight_text text-4xl sm:text-5xl font-extrabold text-center lg:text-start leading-tight tracking-tight'>
                Real-Time Zone Standings &amp; Grade Analytics.
              </h2>
              <p className='text-midnight_text/80 text-lg font-normal text-center lg:text-start pt-4 leading-relaxed'>
                Track zone standings, category performance, and Kala &amp; Sarga Prathibha points automatically as judges submit scores and stage results are declared.
              </p>
              <Link
                to='/results'
                className='clay-button-primary px-8 py-3.5 font-semibold text-lg flex items-center gap-2 mt-6 mx-auto lg:mx-0 w-fit cursor-pointer'
              >
                <span>Explore Live Leaderboards</span>
                <Icon icon='tabler:arrow-right' className='text-2xl' />
              </Link>
            </div>
            <div className='col-span-6 flex justify-center mt-10 lg:mt-0'>
              <img
                src={withBasePath('/images/business/grade.png')}
                alt='grade analytics'
                width={1000}
                height={805}
                className='w-full h-auto object-contain drop-shadow-xl'
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Business;
