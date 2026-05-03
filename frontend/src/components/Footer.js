import { Link } from 'react-router-dom';
import {
  FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube
} from 'react-icons/fa';
import { MdFlight, MdEmail, MdPhone, MdLocationOn } from 'react-icons/md';

const footerLinks = {
  Company: ['About Us', 'Our Team', 'Careers', 'Press'],
  Services: ['Tour Packages', 'Taxi Booking', 'Airport Transfers', 'Group Travel'],
  Support: ['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service'],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-accent-500 rounded-xl flex items-center justify-center">
                <MdFlight className="text-white text-xl rotate-45" />
              </div>
              <span className="text-2xl font-black text-white">
                Way<span className="text-accent-500">Go</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400 max-w-sm mb-6">
              Your all-in-one travel companion. Discover breathtaking tours and get
              reliable taxi service wherever your journey takes you.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3 text-gray-400">
                <MdEmail className="text-accent-500 shrink-0" />
                <span>hello@waygo.travel</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <MdPhone className="text-accent-500 shrink-0" />
                <span>+1 (800) WAY-GO99</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <MdLocationOn className="text-accent-500 shrink-0" />
                <span>123 Explorer Ave, Travel City</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-4">
                {heading}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      to="/contact"
                      className="text-sm text-gray-400 hover:text-accent-400 transition-colors duration-200"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} WayGo. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {[FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube].map((Icon, i) => (
              <a
                key={i}
                href="https://waygo.travel"
                className="w-9 h-9 rounded-full bg-gray-800 hover:bg-brand-600 flex items-center justify-center transition-colors duration-200"
              >
                <Icon size={14} className="text-gray-400 hover:text-white" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
