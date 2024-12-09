'use client'

export default function FeaturesPlanet() {
  const content = [
    {
      title: "1:1 Personalised coaching",
      description: "Two weekly sessions with a dedicated math coach, tailored to your child’s needs",
      icon: (
        <svg className="fill-blue-500" xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      ),
    },
    {
      title: "Mastery based pedagogy",
      description: "Personalised curriculum, Customized exercises everyday that adapt to your child’s progress, building true mastery step-by-step",
      icon: (
        <svg className="fill-blue-500" xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        </svg>
      ),
    },
    {
      title: "Grade Level Curriculum",
      description: "We follow state standards, this isn’t just another supplemental program",
      icon: (
        <svg className="fill-blue-500" xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24">
          <path d="M12 2L1 9l11 7 9-5.5V17h2V9L12 2zm0 13L3.5 9 12 4.5 20.5 9 12 15z"/>
        </svg>
      ),
    },
    {
      title: "Visual Learning",
      description: "Engaging visuals and interactive tools that turn complex concepts into child-friendly understanding",
      icon: (
        <svg className="fill-blue-500" xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24">
          <path d="M12 4.5C7.05 4.5 2.73 7.61 1 12c1.73 4.39 6.05 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6.05-7.5-11-7.5zm0 13c-3.87 0-7.19-2.42-8.48-6C4.81 8.92 8.13 6.5 12 6.5s7.19 2.42 8.48 6c-1.29 3.58-4.61 6-8.48 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
        </svg>
      ),
    },
  ];

  return (
    <section className="relative before:absolute before:inset-0 before:-z-20 before:bg-gray-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="mx-auto max-w-3xl pb-16 text-center md:pb-20">
            <h3 className="text-2xl font-bold text-gray-200 md:text-3xl">
              With Lior AI, learning math doesn’t have to be a struggle!
            </h3>
          </div>
          
          <div className="mx-auto max-w-3xl pb-8 text-center md:pb-12">
            <h2 className="text-3xl font-semibold text-gray-300 md:text-4xl">
              Program Offerings
            </h2>
          </div>

          {/* Grid */}
          <div className="grid overflow-hidden sm:grid-cols-2 lg:grid-cols-2 [&>*]:relative [&>*]:p-6 [&>*]:before:absolute [&>*]:before:bg-gray-800 [&>*]:before:[block-size:100vh] [&>*]:before:[inline-size:1px] [&>*]:before:[inset-block-start:0] [&>*]:before:[inset-inline-start:-1px] [&>*]:after:absolute [&>*]:after:bg-gray-800 [&>*]:after:[block-size:1px] [&>*]:after:[inline-size:100vw] [&>*]:after:[inset-block-start:-1px] [&>*]:after:[inset-inline-start:0] md:[&>*]:p-10">
            {content.map((item, index) => (
              <article key={index}>
                <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-200">
                  {item.icon}
                  <span>{item.title}</span>
                </h3>
                <p className="text-[15px] text-gray-400">{item.description}</p>
              </article>
            ))}
          </div>

          <div className="mx-auto max-w-3xl pb-4 text-center md:pb-8 pt-4">
            <p className="text-xl font-bold text-gray-400">
              This isn’t just another tutoring add-on—it’s a fully integrated, mastery-based math curriculum that is designed specifically for homeschooling kids to excel in math from start to finish.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
