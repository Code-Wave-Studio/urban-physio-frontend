import { useEffect, useState } from 'react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import { admin } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminAnalytics() {
  const [overview, setOverview] = useState(null);
  const [reports, setReports] = useState(null);
  const [range, setRange] = useState('30d');

  useEffect(() => {
    admin.analyticsOverview().then((r) => setOverview(r.data)).catch((e) => toast.error(e.message));
  }, []);

  useEffect(() => {
    admin.analyticsReports({ range }).then((r) => setReports(r.data)).catch((e) => toast.error(e.message));
  }, [range]);

  const Stat = ({ label, value }) => (
    <div className="glass-card p-4 text-center">
      <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );

  return (
    <AdminDashboardLayout>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Advanced Analytics & Reports</h1>

      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Stat label="Doctor reviews" value={overview.reviews?.doctor_reviews_total} />
          <Stat label="Clinic reviews" value={overview.reviews?.clinic_reviews_total} />
          <Stat label="Coupon redemptions" value={overview.coupons?.total_redemptions} />
          <Stat label="PhysioFeed views" value={overview.feed?.total_views} />
          <Stat label="Active coupons" value={overview.coupons?.active} />
          <Stat label="Published posts" value={overview.feed?.published} />
          <Stat label="Badge assignments" value={(overview.badges?.doctor_assignments || 0) + (overview.badges?.clinic_assignments || 0)} />
          <Stat label="Discount given" value={`₹${overview.coupons?.discount_given || 0}`} />
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {['7d', '30d', '90d'].map((r) => (
          <button key={r} type="button" onClick={() => setRange(r)} className={range === r ? 'btn-primary text-sm' : 'btn-outline text-sm'}>{r}</button>
        ))}
      </div>

      {reports && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass-card p-4">
            <h2 className="font-bold mb-3">Top doctors (bookings)</h2>
            <ul className="space-y-2 text-sm">
              {(reports.top_doctors || []).map((d) => (
                <li key={d.id} className="flex justify-between"><span>Dr. {d.first_name} {d.last_name}</span><span className="text-slate-500">{d.appointment_count} appts</span></li>
              ))}
            </ul>
          </div>
          <div className="glass-card p-4">
            <h2 className="font-bold mb-3">Coupon usage</h2>
            <ul className="space-y-2 text-sm">
              {(reports.coupon_usage || []).map((c) => (
                <li key={c.code} className="flex justify-between"><span>{c.code}</span><span className="text-slate-500">{c.redemptions} uses · ₹{c.total_discount}</span></li>
              ))}
            </ul>
          </div>
          <div className="glass-card p-4 lg:col-span-2">
            <h2 className="font-bold mb-3">PhysioFeed performance</h2>
            <div className="flex flex-wrap gap-4">
              {(reports.feed_performance || []).map((f) => (
                <span key={f.type} className="px-3 py-2 rounded-xl bg-slate-100 text-sm capitalize">{f.type}: {f.posts} posts · {f.views} views</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
}
