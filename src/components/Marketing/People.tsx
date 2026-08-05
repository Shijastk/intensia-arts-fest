import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

const withBasePath = (url: string) => url;

const People: React.FC = () => {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-white via-slate-50/70 to-blue-50/20 border-y border-gray-100 relative overflow-hidden" id="about">
      {/* Subtle Star Pattern Accent */}
      <img
        src={withBasePath('/images/hero/star.svg')}
        alt=''
        className='absolute bottom-8 left-6 w-28 h-28 opacity-10 pointer-events-none -z-0'
      />
      <div className="container mx-auto px-4 relative z-10">

        {/* Clean Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/70 text-primary text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <Icon icon="tabler:sparkles" className="text-primary text-sm" />
            Campus Showcase
          </span>
          <h2 className="text-4xl sm:text-5xl font-semibold text-midnight_text tracking-tight leading-tight">
            A Soulful Symphony of{' '}
            <span className="relative inline-block text-primary font-bold">
              <span className="relative z-10">Talent</span>
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 bottom-1 h-3 bg-primary/20 -skew-x-6 rounded-sm"
              />
            </span>{' '}
            &amp; Tradition.
          </h2>
          <p className="text-black/65 text-lg mt-4 leading-relaxed">
            Join us for days of unlimited creativity and competition as multiple zones battle for the prestigious Kala Prathibha and Sarga Prathibha titles.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

          {/* Left Column: Editorial Highlight Clay Card */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="clay-card h-full p-8 sm:p-12 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <span className="text-5xl text-amber-500 font-serif leading-none select-none">
                    &ldquo;
                  </span>
                  <span className="skeuo-chip-rose text-xs font-bold uppercase tracking-wider px-4 py-1.5 shadow-sm">
                    Intensia Arts Fest
                  </span>
                </div>

                <p className="text-2xl sm:text-3xl font-medium leading-snug text-midnight_text mb-8">
                  Where melodies transcend boundaries and every stage performance reflects dedication, art, and cultural heritage.
                </p>
              </div>

              {/* Stat Counters Row */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200/80">
                <div>
                  <p className="text-3xl sm:text-4xl font-extrabold text-amber-500 tracking-tight">100+</p>
                  <p className="text-xs font-semibold text-black/60 uppercase tracking-wider mt-1">Programs</p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">500+</p>
                  <p className="text-xs font-semibold text-black/60 uppercase tracking-wider mt-1">Contestants</p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600 tracking-tight">4</p>
                  <p className="text-xs font-semibold text-black/60 uppercase tracking-wider mt-1">Zones</p>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: 3 Tactile Clay Feature Cards */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-5">

            {/* Feature 1 */}
            <div className="clay-card p-7 flex items-start gap-5 group bg-gradient-to-br from-amber-50/90 via-white to-orange-50/60">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl shrink-0 shadow-md shadow-amber-500/20">
                <Icon icon="tabler:trophy" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-midnight_text mb-1.5 group-hover:text-amber-600 transition-colors">
                  Prathibha Championship Titles
                </h3>
                <p className="text-black/60 text-base leading-relaxed">
                  Automated grade point computation for Kala Prathibha &amp; Sarga Prathibha individual awards.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="clay-card p-7 flex items-start gap-5 group bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/60">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-md shadow-indigo-500/20">
                <Icon icon="tabler:shield-check" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-midnight_text mb-1.5 group-hover:text-indigo-600 transition-colors">
                  100% Anonymous Digital Scoring
                </h3>
                <p className="text-black/60 text-base leading-relaxed">
                  Green Room verification attaches secret code letters before candidates hit the stage.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="clay-card p-7 flex items-start gap-5 group bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-md shadow-emerald-500/20">
                <Icon icon="tabler:chart-dots" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-midnight_text mb-1.5 group-hover:text-emerald-600 transition-colors">
                  Live Public Leaderboards
                </h3>
                <p className="text-black/60 text-base leading-relaxed mb-3">
                  Instant public updates for zone points, category tallies, and stage result declarations.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-primary font-semibold text-sm hover:gap-2.5 transition-all"
                >
                  <span>Explore Results &amp; Portal</span>
                  <Icon icon="tabler:arrow-right" className="text-lg" />
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default People;