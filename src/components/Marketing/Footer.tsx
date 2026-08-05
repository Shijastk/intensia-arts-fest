import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

const withBasePath = (url: string) => url;

interface LinkItem {
  link: string;
}

interface SocialLinkItem {
  imgSrc: string;
  link: string;
  width: number;
}

const socialLinks: SocialLinkItem[] = [
  {
    imgSrc: 'fa-brands:facebook-f',
    link: 'https://www.facebook.com',
    width: 10,
  },
  {
    imgSrc: 'fa6-brands:instagram',
    link: 'https://www.instagram.com',
    width: 14,
  },
  {
    imgSrc: 'fa6-brands:twitter',
    link: 'https://www.twitter.com',
    width: 14,
  },
];

const links: LinkItem[] = [
  { link: 'Product' },
  { link: 'Pricing' },
  { link: 'Features' },
];

const Footer: React.FC = () => {
  return (
    <div className='bg-midnight_text py-12'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 gap-y-10 sm:grid-cols-6 lg:grid-cols-12 items-center pb-12 border-b border-white/20'>
          
          {/* COLUMN-1 */}
          <div className='sm:col-span-6 lg:col-span-3'>
            <div className='flex shrink-0 items-center'>
              <img
                src={withBasePath('/images/logo/logo-white.svg')}
                alt='logo'
                width={214}
                height={55}
              />
            </div>
          </div>
          
          <div className='sm:col-span-6 lg:col-span-5 flex items-center'>
            <div className='flex gap-6'>
              {links.map((item, i) => (
                <div key={i}>
                  <Link
                    to='/'
                    className='text-lg font-normal text-white hover:text-primary transition-all'
                  >
                    {item.link}
                  </Link>
                </div>
              ))}
            </div>
          </div>
          
          <div className='sm:col-span-6 lg:col-span-4'>
            <div className='flex gap-4 lg:justify-end'>
              {socialLinks.map((item, i) => (
                <a
                  href={item.link}
                  key={i}
                  target="_blank"
                  rel="noopener noreferrer"
                  className='bg-white/20 h-12 w-12 shadow-xl text-base rounded-full flex items-center justify-center text-white hover:text-black hover:bg-white transition-all'
                >
                  <Icon icon={item.imgSrc} className='text-2xl' />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className='pt-8 lg:flex items-center justify-between'>
          <h4 className='text-lg text-center lg:text-start font-normal text-white opacity-60'>
            © 2026 Intensia Arts Fest. All rights reserved.
          </h4>
          <div className='flex gap-5 mt-6 lg:mt-0 justify-center lg:justify-end items-center'>
            <h4 className='opacity-60 text-lg font-normal text-white hover:opacity-100 transition-all'>
              <Link to='/'>
                Privacy policy
              </Link>
            </h4>
            <div className='h-5 bg-white opacity-60 w-0.5'></div>
            <h4 className='opacity-60 text-lg font-normal text-white hover:opacity-100 transition-all'>
              <Link to='/'>
                Terms & conditions
              </Link>
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
