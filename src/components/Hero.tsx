const Banner = () => {
  return (
    <section className="bg-header max-h-screen pt-5 pb-10 overflow-hidden">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-y-12 lg:gap-y-0">

          {/* LEFT COLUMN */}
          <div className="col-span-7 flex flex-col justify-center gap-6 relative">

            <img
              src="/images/hero/star.svg"
              alt="star"
              className="absolute top-[-74px] right-[51px] hidden lg:block w-[95px] h-[97px]"
            />

            <img
              src="/images/hero/lineone.svg"
              alt="line"
              className="absolute top-[-74px] right-[51px] hidden lg:block w-[190px] h-[148px]"
            />

            <h1 className="text-midnight_text text-4xl md:text-86 text-center lg:text-start font-semibold leading-tight">
              The Art Form of Creativity.
            </h1>

            <h3 className="text-black opacity-75 text-lg font-normal text-center lg:text-start max-w-2xl mx-auto lg:mx-0">
              Transform your event management with Intensia. The ultimate digital
              platform for Intensia Arts Fest to seamlessly manage
              participants, anonymous judging, and live leaderboards.
            </h3>

            <div className="pt-4 mx-auto lg:mx-0">
              <a
                href="/login"
                className="text-white text-xl font-medium py-6 px-12 rounded-full transition duration-300 border border-primary bg-primary hover:bg-transparent hover:text-primary"
              >
                Go to Dashboard
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="col-span-5 flex justify-center items-end pt-10 lg:pt-0">
            <div className="relative w-full max-w-md lg:max-w-full flex justify-center">

              <img
                src="/images/hero/usthad.png"
                alt="Hero"
                className="w-full h-auto object-contain"
              />

              {/* Chip 1 */}
              <div className="absolute top-1/4 left-0 ml-4 lg:-ml-8 shadow-lg rounded-full animate-[bounce_3s_infinite]">
                <span className="bg-gray-200 text-gray-700 font-normal rounded-full px-6 py-3 block whitespace-nowrap">
                  Live Leaderboards
                </span>
              </div>

              {/* Chip 2 */}
              <div className="absolute top-1/2 left-0 -ml-2 lg:-ml-12 shadow-lg rounded-full animate-[bounce_4s_infinite]">
                <span className="bg-gray-200 text-gray-700 font-normal rounded-full px-6 py-3 block whitespace-nowrap">
                  Anonymous Judging
                </span>
              </div>

              {/* Chip 3 */}
              <div className="absolute top-1/4 right-0 mt-8 mr-2 lg:-mr-6 shadow-lg rounded-full animate-[bounce_3.5s_infinite]">
                <span className="bg-primary text-white font-normal rounded-full px-6 py-3 block whitespace-nowrap">
                  Green Room Control
                </span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Banner;