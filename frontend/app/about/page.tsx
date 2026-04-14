import Image from "next/image";

const team = [
  {
    name: "Dr. David Keelings",
    role: "role",
    image: "/images/keeling.jpg",
    education: [
      "Postdoctoral Associate, Department of Geography & Emerging Pathogens Institute, University of Florida, 2016" ,
      "PhD in Geography, University of Florida, 2015",
      "M.S. in Geography, University of Florida, 2010",
      "B.S. in Environmental Studies, University of Central Florida, 2007"

    ],
    interests: [
      "interests"

    ],
    bio: "bio",
    email: "djkeellings@ufl.edu"
  },
  {
    name: "Rezaali Mostafa",
    role: "Implementation and development of methodology",
    image: "/images/mostafa.jpg",
    education: [
      "Ph.D. Candidate in Geography, Climate Sciences"
      
    ],
    interests: [
      "Heat wave dynamics and thermodynamic drivers",
      "Extreme weather event mechanisms and predictability",
      "Climate variability and change across temporal scales",
      "Earth system feedback and teleconnections",
      "Integration of earth system models with machine learning methods"
      
    ],
    bio: "I am a PhD candidate in the Department of Geography at the University of Florida, specializing in AI and climate sciences. My research focuses on understanding, detecting, and predicting heat waves and extreme weather events through the integration of numerical climate models with deep learning models.",
    email: "mostafarezaali@ufl.edu"
  },
    {
    name: "Sean Hamilton",
    role: "Web Developer",
    image: "/images/sean_hamilton_headshot.jpg",
    education: [
      "B.S. in Computer Science, University of Florida, 2026",
      "B.A. in Statistics, University of Florida, 2026",
      "Mathematics minor, University of Florida, 2026",
      "Geographic Artificial Intelligence and Big Data Certificate, University of Florida, 2026"
    ],
    interests: [
      "Computer vision",
      "Geostatistical modeling"
    ],
    bio: "I am a fourth year undergraduate student in the College of Liberal Arts and Sciences at the University of Florida. I started working towards a GeoAI certificate in the summer of my freshman year and quickly developed an interest in geospatial data. Since then, I've worked on a bevy of projects involving this kind of data. Some of my projects include analyzing patterns of lightning strikes in Northern Alabama using kriging, helping students find study spaces on campus by developing a website, and using DeepForest to count trees in Gainesville. Recently I have been working in the Gator Glaciology Lab to geostatistically simulate the subglacial topography of Antarctica and I have had the privelidge of working on this dashboard to make Dr. Keellings and Mostafa Rezaali's research more accessible!",
    email: "sean.hamilton@ufl.edu"
  },
    {
    name: "Andrew Berland",
    role: "Web Developer",
    image: "/images/berland.jpg",
    education: [
      "B.S. in Computer Science, University of Florida, 2026",
      "Minor in Digital Arts and Sciences, University of Florida, 2026",
      "Minor in Electrical Engineering, University of Florida, 2026"
      
    ],
    interests: [
      "Software development",
      "Game development",
      
    ],
    bio: "I am a senior at the University of Florida pursuing a B.S. in Computer Science with minors in Digital Arts and Sciences and Electrical Engineering. I am passionate about software development and game development, and I am excited to contribute to this project help this research be more accessable to the public.",
    email: "aberland@ufl.edu"
  }

];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-16">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900">Meet the Team</h1>
        <p className="text-gray-600 mt-2">
          The researchers contributing to this project.
        </p>
      </div>

      <div className="grid gap-12 max-w-5xl mx-auto md:grid-cols-2">
        {team.map((member, i) => (
          <div key={member.name} className="flex flex-col items-center text-center">
            <div className="w-52 h-52 rounded-full overflow-hidden shadow-md">
              <Image
                src={member.image}
                alt={member.name}
                width={208}
                height={208}
                className="object-cover w-full shadow-md"
              />
            </div>

            <h2 className="text-orange-600 text-2xl font-semibold mt-4">{member.name}</h2>
            <p className="text-indigo-600 font-medium">{member.role}</p>

            <div className="text-gray-700 mt-3">
              <strong>Education:</strong>
              <ul className="list-disc ml-6 mt-1 text-left">
                {member.education.map((degree, idx) => (
                  <li key={idx}>{degree}</li>
                ))}
              </ul>
            </div>
              <div className="text-gray-700 mt-3">
                <strong>Research Interests:</strong>
                <ul className="list-disc ml-6 mt-1 text-left">
                  {member.interests.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="text-gray-700 mt-3">
                <strong>Bio:</strong>
              </div>
            <p className="text-gray-600 mt-2">{member.bio}</p>

            <a
              href={`mailto:${member.email}`}
              className="text-indigo-600 mt-4 underline"
            >
              Email
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}