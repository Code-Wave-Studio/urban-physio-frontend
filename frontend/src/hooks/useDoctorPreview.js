import { useEffect, useMemo, useState } from 'react';
import { booking, doctors } from '../services/api';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function useDoctorPreview(doctor, open) {
  const [detail, setDetail] = useState(null);
  const [availableToday, setAvailableToday] = useState(null);
  const [packageFrom, setPackageFrom] = useState(null);
  const [loading, setLoading] = useState(false);

  const merged = useMemo(() => {
    if (!doctor) return null;
    return { ...doctor, ...(detail || {}) };
  }, [doctor, detail]);

  useEffect(() => {
    if (!open || !doctor?.id) {
      return undefined;
    }

    let active = true;
    setLoading(true);
    setDetail(null);
    setAvailableToday(null);
    setPackageFrom(null);

    const today = todayIso();

    Promise.all([
      doctors.get(doctor.id).then((r) => r?.data ?? r).catch(() => null),
      booking
        .availableDates({ doctor_id: doctor.id })
        .then((r) => {
          const dates = r?.data ?? r ?? [];
          return Array.isArray(dates) && dates.includes(today);
        })
        .catch(() => false),
      booking
        .doctorPackages(doctor.id)
        .then((r) => {
          const data = r?.data ?? r ?? {};
          const all = [...(data.admin_packages || []), ...(data.doctor_packages || [])];
          const prices = all.map((p) => Number(p.discount_price)).filter((p) => p > 0);
          return prices.length ? Math.min(...prices) : null;
        })
        .catch(() => null),
    ])
      .then(([profile, hasToday, pkgMin]) => {
        if (!active) return;
        if (profile) setDetail(profile);
        setAvailableToday(hasToday);
        setPackageFrom(pkgMin);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, doctor?.id]);

  return { doctor: merged, loading, availableToday, packageFrom };
}
