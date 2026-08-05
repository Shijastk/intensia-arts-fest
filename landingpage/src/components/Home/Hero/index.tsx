import { withBasePath } from '@/utils/urlHelper'
import Image from 'next/image'

const Banner = () => {
    return (
        <section className='bg-header max-h-screen pt-5 pb-10 overflow-hidden'>
            <div className='container px-4 mx-auto'>
                <div className='grid grid-cols-1 lg:grid-cols-12 items-center gap-y-12 lg:gap-y-0'>
                    
                    {/* LEFT COLUMN: Text Content */}
                    <div className='col-span-7 flex flex-col justify-center gap-6 relative'>
                        <Image
                            src={withBasePath('/images/hero/star.svg')}
                            alt='star-image'
                            width={95}
                            height={97}
                            className='absolute top-[-74px] right-[51px] hidden lg:block'
                        />
                        <Image
                            src={withBasePath('/images/hero/lineone.svg')}
                            alt='line-image'
                            width={190}
                            height={148}
                            className='absolute top-[-74px] right-[51px] hidden lg:block'
                        />
                        
                        <h1 className='text-midnight_text text-4xl md:text-86 text-center lg:text-start font-semibold leading-tight'>
                            Put an end to unpaid invoices.
                        </h1>
                        
                        <h3 className='text-black opacity-75 text-lg font-normal text-center lg:text-start max-w-2xl mx-auto lg:mx-0'>
                            Sed ut perspiciatis unde omnis iste natus error sit voluptatem
                            accusantium doloremque laudantium, totam rem aperiam, eaque ipsa
                            quae ab illo inventore veritatis et quasi architecto beatae vitae
                            dicta sunt explicabo.
                        </h3>
                        
                        <div className='pt-4 mx-auto lg:mx-0'>
                            <button className='text-white text-xl font-medium py-6 px-12 rounded-full transition duration-300 border border-primary bg-primary hover:bg-transparent hover:text-primary'>
                                Get started
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Image with Floating Chips */}
                    <div className='col-span-5 flex justify-center items-end pt-10 lg:pt-0'>
                        {/* 
                            Added 'relative' to this wrapper so the absolute chips 
                            position themselves relative to the image area.
                        */}
                        <div className='relative w-full max-w-md lg:max-w-full flex justify-center'>
                            <Image
                                src={withBasePath('/images/hero/usthad.png')}
                                alt='Hero Image of Usthad'
                                width={800} 
                                height={900} 
                                className='w-full h-auto object-contain'
                                priority
                            />

                            {/* EHR Chip (Top-Left) */}
                            <div className='absolute top-1/4 left-0 ml-4 lg:-ml-8 shadow-lg rounded-full animate-[bounce_3s_infinite]'>
                                <span className='bg-gray-200 text-gray-700 font-normal rounded-full px-6 py-3 block whitespace-nowrap'>
                                    EHR
                                </span>
                            </div>

                            {/* Billing and Payments Chip (Middle-Left) */}
                            <div className='absolute top-1/2 left-0 -ml-2 lg:-ml-12 shadow-lg rounded-full animate-[bounce_4s_infinite]'>
                                <span className='bg-gray-200 text-gray-700 font-normal rounded-full px-6 py-3 block whitespace-nowrap'>
                                    Billing and Payments
                                </span>
                            </div>

                            {/* Patients Experience Chip (Top-Right) */}
                            <div className='absolute top-1/4 right-0 mt-8 mr-2 lg:-mr-6 shadow-lg rounded-full animate-[bounce_3.5s_infinite]'>
                                <span className='bg-primary text-white font-normal rounded-full px-6 py-3 block whitespace-nowrap'>
                                    Patients Experience
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}

export default Banner