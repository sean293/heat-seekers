import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen">

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-red-200 to-orange-200 py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-6 text-orange-600">
            Heat Seekers
          </h1>
          <p className="text-lg text-gray-800 mb-8 max-w-2xl mx-auto">
            A data visualization dashboard designed to analyze and explore 
            patterns in extreme heat waves. This platform transforms large-scale 
            research data into accessible visual insights.
          </p>
          <Link
            href="/dashboard"
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition"
          >
            View Dashboard
          </Link>
        </div>
      </section>

      {/* About the Research Section */}
      <section className="bg-gradient-to-b from-orange-200 to-yellow-200 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-10 text-center text-orange-400">
            Understanding Heat Waves
          </h2>
          <p className="text-gray-700 text-center max-w-3xl mx-auto">
            Heat waves are increasing in frequency, intensity, and duration. 
            This project aggregates large-scale environmental datasets to 
            identify trends, visualize anomalies, and support research-driven 
            insights into climate behavior.
          </p>
        </div>
      </section>

      {/* Preview Section */}
      <section className="bg-gradient-to-b from-yellow-200 to-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-semibold mb-10 text-center text-orange-400">
            Data Visualization Preview
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-100 h-48 rounded-xl overflow=hidden relative">
              <Image
                src="/images/heatmap_preview.jpg"
                alt="Heat Map Preview"
                layout="fill"
                objectFit="cover"
              />
            </div>
            <div className="bg-gray-100 h-48 rounded-xl overflow=hidden relative">
              <Image
                src="/images/time_series_preview.jpg"
                alt="Trend Analysis Preview"
                layout="fill"
                objectFit="cover"
              />
            </div>
            <div className="bg-gray-100 h-48 rounded-xl overflow=hidden relative">
              <Image
                src="/images/bar_chart_preview.jpg"
                alt="Bar Chart Preview"
                layout="fill"
                objectFit="cover"
              />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}