import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

const withBasePath = (url: string) => url;

const Payment: React.FC = () => {
  return (
    <section className='py-16 bg-white'>
      <div className='container mx-auto px-4'>
        <div className='clay-card p-8 sm:p-12'>
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-center'>
            <div className='col-span-6 flex justify-center'>
              <img
                src={withBasePath('/images/features/completion.png')}
                alt='Green Room Verification'
                width={600}
                height={500}
                className='w-full h-auto object-contain drop-shadow-lg'
              />
            </div>
            <div className='col-span-6 flex flex-col justify-center'>
              <span className='clay-chip text-primary text-xs font-semibold uppercase tracking-wider px-4 py-1.5 w-fit mb-4'>
                Anonymous Judging
              </span>
              <h2 className='text-midnight_text text-4xl sm:text-5xl font-bold text-center lg:text-start leading-tight tracking-tight'>
                100% Anonymous Green Room Control.
              </h2>
              <p className='text-midnight_text/70 text-lg font-normal text-center lg:text-start leading-relaxed pt-4'>
                Ensure complete fairness in every performance. In the Green Room, candidate chest numbers are assigned secret code letters before stepping onto stage—keeping identities 100% anonymous to the judges panel.
              </p>
              <Link
                to='/login'
                className='clay-button-primary px-8 py-3.5 font-semibold text-lg flex items-center gap-2 mt-6 mx-auto lg:mx-0 w-fit cursor-pointer'
              >
                <span>Access Green Room Portal</span>
                <Icon icon='tabler:arrow-right' className='text-2xl' />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Payment;
