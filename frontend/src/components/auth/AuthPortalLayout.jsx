import { Link } from 'react-router-dom';
import Navbar from '../Navbar';

/**
 * @param {{ portal: object, children: React.ReactNode, footer?: React.ReactNode }} props
 */
export default function AuthPortalLayout({ portal, children, footer }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-white">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-10 sm:py-14">
        {children}
        {footer}
        <p className="mt-6 text-center">
          <Link to="/login" className="text-xs text-slate-400 hover:text-slate-600 transition">
            Not sure which account? Choose account type
          </Link>
        </p>
      </div>
    </div>
  );
}
