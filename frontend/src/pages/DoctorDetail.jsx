import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FaIcon from '../components/FaIcon';
import DoctorAvatar from '../components/DoctorAvatar';
import BadgeList from '../components/platform/BadgeList';
import ReviewStars from '../components/platform/ReviewStars';
import ReviewForm from '../components/platform/ReviewForm';
import { doctors } from '../services/api';
import { bookDoctorUrl } from '../utils/bookUrl';
import { useAuth } from '../contexts/AuthContext';

export default function DoctorDetail() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const [doctor, setDoctor] = useState(null);

  const load = () => doctors.get(id).then((res) => setDoctor(res.data));

  useEffect(() => {
    load();
  }, [id]);

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="card mb-8">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <DoctorAvatar doctor={doctor} size="xl" className="!rounded-full shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold">
                Dr. {doctor.first_name} {doctor.last_name}
              </h1>
              <p className="text-primary-600">{doctor.specialization}</p>
              <p className="text-slate-500 mt-2">{doctor.bio || 'Experienced physiotherapist'}</p>
              <div className="mt-3">
                <ReviewStars rating={doctor.rating_avg} count={doctor.rating_count} size="lg" />
              </div>
              <BadgeList badges={doctor.badges} />
              <div className="flex gap-4 mt-4 text-sm flex-wrap text-slate-600">
                <span>{doctor.experience_years}+ years exp</span>
                <span>Clinic: ₹{doctor.consultation_fee}</span>
                <span>Online: ₹{doctor.online_fee}</span>
                <span>Home: ₹{doctor.home_visit_fee}</span>
              </div>
            </div>
          </div>
        </div>

        {doctor.reviews?.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Patient reviews</h2>
            <div className="space-y-3">
              {doctor.reviews.map((r) => (
                <div key={r.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <ReviewStars rating={r.rating} />
                  <p className="text-sm text-slate-600 mt-2">{r.comment || 'No comment'}</p>
                  <p className="text-xs text-slate-400 mt-1">{r.first_name} · {r.created_at?.slice(0, 10)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasRole('patient') && (
          <div className="mb-8">
            <ReviewForm doctorId={+id} onSubmitted={load} />
          </div>
        )}

        <div className="card text-center space-y-4">
          <h2 className="text-xl font-semibold">Book with Dr. {doctor.last_name}</h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            6-step booking: choose consultation type, add pain details, pick a time slot, and pay securely with Razorpay.
          </p>
          <Link to={bookDoctorUrl(id)} className="btn-primary inline-flex items-center gap-2">
            <FaIcon icon="fa-calendar-check" />
            Start Booking
          </Link>
          <Link to="/book" className="block text-sm text-primary-600 hover:underline">
            Or book any doctor
          </Link>
        </div>
      </div>
    </div>
  );
}
