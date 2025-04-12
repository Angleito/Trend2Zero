


import Image from 'next/image';
import Link from 'next/link';
export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">Contact Us</h1>
          
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-[#FF9500]">Get in Touch</h2>
            <p className="text-gray-300 text-lg mb-8">
              Have questions about Trend2Zero or want to collaborate? Feel free to reach out through any of the channels below.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-gray-800 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#FF9500]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white">Email</h3>
                  <p className="text-gray-300 mt-1">
                    <a href="mailto:arainey555@gmail.com" className="hover:text-[#FF9500] transition-colors">
                      arainey555@gmail.com
                    </a>
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-gray-800 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#FF9500]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white">GitHub</h3>
                  <p className="text-gray-300 mt-1">
                    <a 
                      href="https://github.com/Angleito" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-[#FF9500] transition-colors"
                    >
                      github.com/Angleito
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-6 text-[#FF9500]">About the Project</h2>
            <p className="text-gray-300 text-lg mb-6">
              Trend2Zero is an open-source project dedicated to visualizing how global assets trend to zero when priced in Bitcoin.
            </p>
            <p className="text-gray-300 text-lg mb-6">
              We're always looking for contributors and feedback to improve the platform and expand our data coverage.
            </p>
            <div className="flex justify-center">
              <Link 
                href="/"
                className="bg-[#FF9500] hover:bg-opacity-90 text-white px-6 py-3 rounded-md transition-colors inline-flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
