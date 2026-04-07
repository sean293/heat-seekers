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
    role: "role",
    image: "/images/mostafa.jpg",
    education: [
      "education"
      
    ],
    interests: [
      "interests"
      
    ],
    bio: "bio",
    email: "mostafarezaali@ufl.edu"
  },
    {
    name: "Sean Hamilton",
    role: "Web Developer",
    image: "/images/emptyPic.jpg",
    education: [
      "education"
      
    ],
    interests: [
      "interests"
      
    ],
    bio: "bio",
    email: ""
  },
    {
    name: "Andrew Berland",
    role: "Web Developer",
    image: "/images/emptyPic.jpg",
    education: [
      "education"
      
    ],
    interests: [
      "interests"
      
    ],
    bio: "bio",
    email: "mostafarezaali@ufl.edu"
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