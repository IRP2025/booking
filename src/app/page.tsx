import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-x-hidden">
      {/* Simple background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%236366f1%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
      
      
      {/* Navigation */}
      <nav className="relative z-50 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/irp-logo.jpg"
                alt="IRP Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 drop-shadow-sm">IRP Booking</h1>
              <p className="text-sm text-gray-800 font-medium drop-shadow-sm">Innovation & Research Park</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors drop-shadow-sm"
            >
              Admin
            </Link>
            <Link
              href="/user/auth"
              className="modern-button text-sm px-6 py-2"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-4 sm:px-6 py-12 sm:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-6 sm:space-y-8 animate-fade-in-up">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Streamline Your
                  <span className="block bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                    Project Reviews
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-gray-800 leading-relaxed max-w-lg font-medium drop-shadow-sm">
                  Book review slots for your project presentations with our modern, 
                  efficient booking system designed for academic excellence.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/user/auth"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <span>Start Booking</span>
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/admin/login"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl shadow-lg hover:shadow-xl border border-gray-200 hover:border-gray-300 transform hover:-translate-y-1 transition-all duration-300"
                >
                  Admin Portal
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-8">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-500 drop-shadow-sm">50+</div>
                  <div className="text-xs sm:text-sm text-gray-700 font-medium drop-shadow-sm">Projects Reviewed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-green-500 drop-shadow-sm">5+</div>
                  <div className="text-xs sm:text-sm text-gray-700 font-medium drop-shadow-sm">Industry Experts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-500 drop-shadow-sm">98%</div>
                  <div className="text-xs sm:text-sm text-gray-700 font-medium drop-shadow-sm">Success Rate</div>
                </div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative animate-slide-in-right">
              <div className="relative group">
                {/* Main Card */}
                <div className="bg-gray-100/80 backdrop-blur-lg border border-gray-200/50 rounded-2xl p-8 space-y-6 shadow-xl transition-all duration-500 ease-out group-hover:shadow-2xl group-hover:shadow-blue-500/20 group-hover:-translate-y-2 group-hover:scale-105 group-hover:bg-white/90 group-hover:border-blue-300/50 hover-pulse-glow hover-shimmer">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-blue-500/30">
                      <Image
                        src="/irp-logo.jpg"
                        alt="IRP Logo"
                        width={64}
                        height={64}
                        className="w-full h-full object-contain transition-all duration-500 group-hover:scale-110"
                      />
                    </div>
                  <div className="transition-all duration-500 group-hover:translate-x-2">
                    <h3 className="text-xl font-bold text-gray-900 transition-all duration-500 group-hover:text-blue-600 group-hover:tracking-wide">IRP Booking System</h3>
                    <p className="text-gray-700 font-medium transition-all duration-500 group-hover:text-blue-500">Innovation & Research Park</p>
                  </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 transition-all duration-500 group-hover:translate-x-1 group-hover:bg-green-50/50 group-hover:rounded-lg group-hover:p-2 group-hover:-ml-2 group-hover:pl-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full transition-all duration-500 group-hover:scale-150 group-hover:shadow-lg group-hover:shadow-green-500/50"></div>
                      <span className="text-sm text-gray-700 font-medium transition-all duration-500 group-hover:text-green-600 group-hover:font-semibold">Real-time slot availability</span>
                    </div>
                    <div className="flex items-center space-x-3 transition-all duration-500 group-hover:translate-x-1 group-hover:bg-blue-50/50 group-hover:rounded-lg group-hover:p-2 group-hover:-ml-2 group-hover:pl-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full transition-all duration-500 group-hover:scale-150 group-hover:shadow-lg group-hover:shadow-blue-500/50"></div>
                      <span className="text-sm text-gray-700 font-medium transition-all duration-500 group-hover:text-blue-600 group-hover:font-semibold">Industry expert reviewers</span>
                    </div>
                    <div className="flex items-center space-x-3 transition-all duration-500 group-hover:translate-x-1 group-hover:bg-purple-50/50 group-hover:rounded-lg group-hover:p-2 group-hover:-ml-2 group-hover:pl-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full transition-all duration-500 group-hover:scale-150 group-hover:shadow-lg group-hover:shadow-purple-500/50"></div>
                      <span className="text-sm text-gray-700 font-medium transition-all duration-500 group-hover:text-purple-600 group-hover:font-semibold">Professional feedback system</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 font-medium">IIPC Partnership</span>
                      <div className="w-8 h-8 rounded-lg overflow-hidden">
                        <Image
                          src="/iipc.jpg"
                          alt="IIPC Logo"
                          width={32}
                          height={32}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-4 sm:px-6 py-12 sm:py-20 bg-white/50 backdrop-blur-sm overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              A simple, efficient process designed to streamline your project review experience
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-gray-100/80 backdrop-blur-lg border border-gray-200/50 rounded-2xl p-6 sm:p-8 text-center group hover:scale-105 hover:-translate-y-3 hover:rotate-1 hover:shadow-2xl hover:shadow-blue-500/20 hover:bg-white/90 hover:border-blue-300/50 transition-all duration-500 ease-out shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all duration-500">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 transition-all duration-500 group-hover:text-blue-600 group-hover:tracking-wide group-hover:scale-105">Create Account</h3>
              <p className="text-gray-700 leading-relaxed font-medium transition-all duration-500 group-hover:text-blue-500 group-hover:translate-y-1">
                Sign up with your academic details and team information to get started with the booking process.
              </p>
            </div>

            <div className="bg-gray-100/80 backdrop-blur-lg border border-gray-200/50 rounded-2xl p-6 sm:p-8 text-center group hover:scale-105 hover:-translate-y-3 hover:-rotate-1 hover:shadow-2xl hover:shadow-green-500/20 hover:bg-white/90 hover:border-green-300/50 transition-all duration-500 ease-out shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:-rotate-12 group-hover:shadow-lg group-hover:shadow-green-500/50 transition-all duration-500">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 transition-all duration-500 group-hover:text-green-600 group-hover:tracking-wide group-hover:scale-105">Book Your Slot</h3>
              <p className="text-gray-700 leading-relaxed font-medium transition-all duration-500 group-hover:text-green-500 group-hover:translate-y-1">
                Choose from available review slots and secure your presentation time with industry experts.
              </p>
            </div>

            <div className="bg-gray-100/80 backdrop-blur-lg border border-gray-200/50 rounded-2xl p-6 sm:p-8 text-center group hover:scale-105 hover:-translate-y-3 hover:rotate-1 hover:shadow-2xl hover:shadow-purple-500/20 hover:bg-white/90 hover:border-purple-300/50 transition-all duration-500 ease-out shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-all duration-500">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 transition-all duration-500 group-hover:text-purple-600 group-hover:tracking-wide group-hover:scale-105">Present & Excel</h3>
              <p className="text-gray-700 leading-relaxed font-medium transition-all duration-500 group-hover:text-purple-500 group-hover:translate-y-1">
                Attend your scheduled review session and receive professional feedback to improve your project.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 sm:px-6 py-12 sm:py-20 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gray-100/80 backdrop-blur-lg border border-gray-200/50 rounded-2xl p-6 sm:p-12 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 hover:bg-white/90 hover:border-blue-300/50 hover:-translate-y-2 hover:scale-105 transition-all duration-500 ease-out group">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 transition-all duration-500 group-hover:text-blue-600 group-hover:tracking-wide group-hover:scale-105">
              Ready to Get Started?
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 mb-8 max-w-2xl mx-auto font-medium transition-all duration-500 group-hover:text-blue-500 group-hover:translate-y-1">
              Join hundreds of students who have successfully presented their projects 
              through our streamlined booking system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/user/auth"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/50 transform hover:-translate-y-2 hover:scale-105 hover:from-blue-500 hover:to-blue-600 transition-all duration-500 ease-out group"
              >
                <span className="transition-all duration-500 group-hover:tracking-wide">Start Your Journey</span>
                <svg className="ml-2 w-5 h-5 transition-all duration-500 group-hover:translate-x-1 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 sm:px-6 py-8 sm:py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <Image
                src="/irp-logo.jpg"
                alt="IRP Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold">IRP Booking System</h3>
              <p className="text-sm text-gray-400">Innovation & Research Park</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            © 2024 KLN Innovation & Research Park. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}