'use client';

import Link from 'next/link';

export default function DesktopNavDashboard() {
  return (
    <nav className="hidden lg:flex items-center space-x-8">
      <Link
        href="/"
        className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors hover:text-blue-600"
      >
        Accueil
      </Link>
      <Link
        href="/profile"
        className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors hover:text-blue-600"
      >
        Profil
      </Link>
    </nav>
  );
}
