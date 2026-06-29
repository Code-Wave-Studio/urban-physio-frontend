import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FaIcon from '../components/FaIcon';
import PageMeta, { clinicSchema } from '../components/seo/PageMeta';
import ClinicProfileView from '../components/clinic/ClinicProfileView';
import { clinics } from '../services/api';
import { googleMapsUrl } from '../utils/locationHelpers';

export default function ClinicProfilePage() {
  const { slug, id } = useParams();
  const identifier = id ?? slug;
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    clinics
      .get(identifier)
      .then((res) => setClinic(res?.data ?? res))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [identifier]);

  const canonical = clinic?.canonical_path || (slug ? `/clinic/${slug}` : '');
  const canonicalUrl = typeof window !== 'undefined' ? `${window.location.origin}${canonical}` : canonical;
  const jsonLd = useMemo(() => (clinic ? clinicSchema(clinic, canonicalUrl) : null), [clinic, canonicalUrl]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/40">
        <div className="animate-spin w-11 h-11 border-4 border-emerald-600 border-t-transparent rounded-full" />
        <p className="text-sm text-slate-500 mt-4 font-medium">Loading clinic profile…</p>
      </div>
    );
  }

  if (notFound || !clinic) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-24">
          <div className="glass-card max-w-md w-full text-center p-8 md:p-10">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
              <FaIcon icon="fa-hospital" className="text-2xl" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Clinic not found</h1>
            <p className="text-slate-500 text-sm mt-2">This profile may have been removed or the link is incorrect.</p>
            <Link
              to="/clinics"
              className="btn-primary mt-6 inline-flex items-center gap-2 !bg-emerald-600 hover:!bg-emerald-700"
            >
              <FaIcon icon="fa-magnifying-glass" />
              Find clinics
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const mapUrl = (() => {
    const gmaps = clinic.google_maps_url?.trim();
    if (gmaps) return gmaps.startsWith('http') ? gmaps : `https://${gmaps}`;
    if (clinic.latitude && clinic.longitude) return googleMapsUrl(clinic.latitude, clinic.longitude);
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address || clinic.name)}`;
  })();

  const websiteUrl = clinic.website_url || clinic.website;

  return (
    <>
      <PageMeta
        title={clinic.seo?.title || clinic.name}
        description={clinic.seo?.description}
        canonical={canonical}
        image={clinic.cover_image || clinic.logo}
        jsonLd={jsonLd}
      />
      <Navbar />
      <ClinicProfileView clinic={clinic} mapUrl={mapUrl} websiteUrl={websiteUrl} />
      <Footer />
    </>
  );
}
