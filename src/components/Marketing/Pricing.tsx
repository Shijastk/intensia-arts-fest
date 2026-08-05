import React from 'react';
import { Icon } from '@iconify/react';

const withBasePath = (url: string) => url;

const workflows = [
  {
    heading: 'Team Leaders',
    role: 'Step 1: Registration',
    description: 'Manage candidates and enroll them into events.',
    option: [
      'Add candidates to team roster',
      'Assign chest numbers easily',
      'Book available event slots',
      'Request participant removals',
    ],
    imgSrc: '/images/pricing/starone.svg',
  },
  {
    heading: 'Green Room',
    role: 'Step 2: Verification',
    description: 'Ensure anonymity before candidates hit the stage.',
    option: [
      'Verify candidate chest numbers',
      'Assign secret code letters',
      'Maintain 100% participant anonymity',
      'Push queue to active Judges Panel',
    ],
    imgSrc: '/images/pricing/startwo.svg',
  },
  {
    heading: 'Judges & Admin',
    role: 'Step 3: Scoring',
    description: 'Digital scoring and live result publications.',
    option: [
      'Score performances digitally (0-100)',
      'Auto-calculate A+, A, B, C grades',
      'Auto-calculate ranks and points',
      'Publish results to live leaderboard',
    ],
    imgSrc: '/images/pricing/starthree.svg',
  },
];

const Pricing: React.FC = () => {
  return (
    <section id='pricing' className='bg-header relative py-20 overflow-hidden'>
      <img
        src={withBasePath('/images/pricing/upperline.png')}
        alt='upperline-image'
        width={280}
        height={219}
        className='absolute top-[160px] left-[90px] hidden sm:block'
      />
      <img
        src={withBasePath('/images/pricing/lowerline.png')}
        alt='lowerline-image'
        width={180}
        height={100}
        className='absolute bottom-[0px] right-[90px]'
      />
      <div className='container mx-auto px-4 relative z-10'>
        <h3 className='text-center text-4xl sm:text-6xl font-black text-midnight_text'>
          How Intensia Works.
        </h3>
        <p className='text-lg font-normal text-center text-black/60 pt-5'>
          A completely free, seamless, and automated workflow designed to handle everything <br className='hidden sm:block' /> from participant registration to live public leaderboards.
        </p>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 my-16 gap-8'>
          {workflows.map((item, index) => (
            <div
              className='clay-card pt-10 pb-20 px-8 relative overflow-hidden group flex flex-col justify-between'
              key={index}
            >
              <img
                src={withBasePath(item.imgSrc)}
                alt='star-image'
                width={140}
                height={140}
                className='absolute bottom-0 right-0 opacity-40 group-hover:opacity-60 transition-opacity'
              />
              <div>
                <span className='clay-chip text-primary text-xs font-semibold uppercase tracking-wider px-3.5 py-1 mb-3 inline-block'>
                  {item.heading}
                </span>
                
                <h2 className='text-2xl sm:text-3xl font-bold text-midnight_text mb-2'>
                  {item.role}
                </h2>
                <p className='text-base font-normal text-midnight_text/70 mb-6'>
                  {item.description}
                </p>

                {/* Workflow Features with icons */}
                <div className='mt-6 relative z-10 space-y-3.5'>
                  {item.option.map((feature, idx) => (
                    <div key={idx} className='flex gap-3 items-center'>
                      <Icon
                        icon='tabler:circle-check-filled'
                        className='text-xl text-emerald-500 shrink-0'
                      />
                      <p className='text-base font-medium text-midnight_text/85'>
                        {feature}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
