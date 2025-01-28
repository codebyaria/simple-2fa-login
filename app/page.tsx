import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to Our Platform
          </h1>
          <p className="text-lg md:text-xl mb-8">
            Join us today to explore amazing opportunities and take your journey to the next level.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/login"
              className="bg-white text-blue-600 px-6 py-3 rounded-xl shadow-md font-semibold hover:bg-gray-100"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-md font-semibold hover:bg-indigo-700"
            >
              Register
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
