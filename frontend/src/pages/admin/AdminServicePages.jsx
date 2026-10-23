import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import { admin, uploadCmsImage } from '../../services/api';
import MediaUrlOrUpload from '../../components/admin/MediaUrlOrUpload';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import toast from 'react-hot-toast';
import { bookingUrlError, isSafeBookingUrl } from '../../components/serviceCatalogue/serviceCatalogueModel';

const TABS = [
  { id: 'items', label: 'Items' },
  { id: 'sections', label: 'Sections' },
  { id: 'chips', label: 'Chips' },
  { id: 'options', label: 'Booking options' },
  { id: 'page', label: 'Page blocks' },
];

const EMPTY_ITEM = {
  item_type: 'service',
  delivery_mode: 'online',
  title: '',
  benefit: '',
  slug: '',
  section_id: '',
  status: 'draft',
  is_visible: true,
  badge: '',
  ai_guided: false,
  duration_label: '',
  regular_price: '',
  offer_price: '',
  unit_label: 'per session',
  booking_pain_type: 'Other',
  disclaimer: '',
  booking_url: '',
  gallery_urls: '',
  image_url: '',
  image_alt: '',
  chip_ids: [],
  often_booked_with: [],
  included: '',
  weeks_total: '',
  sessions_total: '',
  plan_regular_price: '',
  plan_offer_price: '',
  clinically_reviewed_by: '',
  clinically_reviewed_at: '',
  clinical_note_variant: 'standard',
  good_fit: '',
  see_doctor: '',
  phases: [{ name: '', week_from: 0, week_to: 1, goal: '', sessions_text: '', milestone: '', price: '', mode: 'online' }],
  questions: [{ prompt: '', answers: [{ label: '', outcome: 'ok' }, { label: '', outcome: 'stop' }] }],
};

function lines(value) {
  return String(value || '').split('\n').map((line) => line.trim()).filter(Boolean);
}

function slugifyTitle(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

const inputClass = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm';

export function AdminHomePhysioServices() {
  return (
    <AdminServicePages
      pageKey="home_physiotherapy"
      heading="Home Physiotherapy services"
      summary="Services, treatments, therapies, filters and booking options for home visits. Prices are whole rupees. Savings are calculated."
      viewTo="/home-physiotherapy"
      viewLabel="View Home Physiotherapy"
      deliveryDefault="home"
    />
  );
}

export default function AdminServicePages({
  pageKey = 'telerehab',
  heading = 'Service Pages',
  summary = 'Tele-Rehab catalogue. Prices are whole rupees. Savings are calculated. Home Physiotherapy is not edited here.',
  viewTo = '/telephysio',
  viewLabel = 'View Tele-Rehab',
  deliveryDefault = 'online',
}) {
  const [tab, setTab] = useState('items');
  const [data, setData] = useState(null);
  const [item, setItem] = useState(null);
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    admin.serviceCatalogue(pageKey)
      .then((res) => setData(res.data))
      .catch((err) => toast.error(err.message || 'Could not load service pages'));
  };

  useEffect(() => { load(); }, []);

  const preview = useMemo(() => {
    if (!item) return null;
    const regular = item.regular_price === '' ? null : Number(item.regular_price);
    const offer = item.offer_price === '' ? null : Number(item.offer_price);
    const show = offer != null && regular != null && offer < regular;
    return {
      title: item.title || 'Service title',
      benefit: item.benefit || 'Benefit',
      price: show ? offer : regular,
      regular,
      show,
      image: item.image_url ? (resolveMediaUrl(item.image_url) || item.image_url) : '',
      badge: item.badge || '',
      duration: item.duration_label || '',
    };
  }, [item]);

  function editItem(row) {
    if (!row) {
      setItem({ ...EMPTY_ITEM, delivery_mode: deliveryDefault, section_id: data?.sections?.[0]?.id || '' });
      setErrors({});
      setWarnings([]);
      return;
    }
    setItem({
      ...EMPTY_ITEM,
      ...row,
      item_type: row.type,
      delivery_mode: row.deliveryMode,
      section_id: row.sectionId,
      is_visible: row.isVisible,
      ai_guided: row.aiGuided,
      duration_label: row.durationLabel || '',
      regular_price: row.regularPrice ?? '',
      offer_price: row.offerPrice ?? '',
      unit_label: row.unitLabel || '',
      booking_pain_type: row.bookingPainType || '',
      booking_url: row.bookingUrl || '',
      gallery_urls: Array.isArray(row.gallery) ? row.gallery.join('\n') : '',
      image_url: row.imageUrl || '',
      image_alt: row.imageAlt || '',
      chip_ids: row.chipIds || [],
      often_booked_with: row.oftenBookedWith || [],
      included: (row.included || []).join('\n'),
      weeks_total: row.weeksTotal ?? '',
      sessions_total: row.sessionsTotal ?? '',
      plan_regular_price: row.planRegularPrice ?? '',
      plan_offer_price: row.planOfferPrice ?? '',
      clinically_reviewed_by: row.clinicallyReviewedBy || '',
      clinically_reviewed_at: row.clinicallyReviewedAt || '',
      clinical_note_variant: row.clinicalNoteVariant || 'standard',
      good_fit: (row.goodFit || []).join('\n'),
      see_doctor: (row.seeDoctor || []).join('\n'),
      phases: row.phases?.length ? row.phases.map((phase) => ({
        name: phase.name,
        week_from: phase.weekFrom,
        week_to: phase.weekTo,
        goal: phase.goal,
        sessions_text: phase.sessionsText,
        milestone: phase.milestone,
        price: phase.price,
        mode: phase.mode,
        exercises: phase.exercises || [],
      })) : EMPTY_ITEM.phases,
      questions: row.questions?.length ? row.questions : EMPTY_ITEM.questions,
      id: row.id,
      slug: row.slug,
      title: row.title,
      benefit: row.benefit,
      status: row.status,
    });
    setErrors({});
    setWarnings([]);
  }

  async function saveItem(event) {
    event.preventDefault();
    if (saving) return; // prevent accidental duplicate submissions
    setSaving(true);
    setErrors({});
    setWarnings([]);
    const isPlan = item.item_type === 'plan';
    const payload = {
      ...item,
      page_key: pageKey,
      // Blank slug → backend generates a unique one from the title.
      slug: String(item.slug || '').trim(),
      image_url: String(item.image_url || '').trim(),
      image_alt: String(item.image_alt || '').trim() || String(item.title || '').trim(),
      included: lines(item.included),
      good_fit: lines(item.good_fit),
      see_doctor: lines(item.see_doctor),
      regular_price: item.regular_price === '' ? null : Number(item.regular_price),
      offer_price: item.offer_price === '' ? null : Number(item.offer_price),
      plan_regular_price: item.plan_regular_price === '' ? null : Number(item.plan_regular_price),
      plan_offer_price: item.plan_offer_price === '' ? null : Number(item.plan_offer_price),
      // Phases / eligibility questions are plan-only. Never send the form's
      // blank plan placeholders with a service — they caused the spurious
      // "Each question needs text" error on service saves.
      phases: isPlan ? item.phases : [],
      questions: isPlan ? item.questions : [],
    };
    const localErrors = {};
    const imageUrl = String(item.image_url || '').trim();
    if (imageUrl && !isSafeBookingUrl(imageUrl)) {
      localErrors.image_url = 'Image must be an http(s) URL or a site path';
    }
    if (String(item.image_alt || '').trim().length > 255) {
      localErrors.image_alt = 'Alt text must be 255 characters or fewer';
    }
    if (pageKey === 'home_physiotherapy') {
      const bookingMessage = bookingUrlError(item.booking_url);
      if (bookingMessage) localErrors.booking_url = bookingMessage;
      const galleryLines = lines(item.gallery_urls);
      if (galleryLines.length > 8) {
        localErrors.gallery_urls = 'A service can have at most 8 additional images';
      } else if (galleryLines.some((url) => !isSafeBookingUrl(url))) {
        localErrors.gallery_urls = 'Each additional image must be an http(s) URL or a site path';
      }
      payload.booking_url = String(item.booking_url || '').trim();
      payload.gallery_urls = galleryLines;
    } else {
      delete payload.booking_url;
      delete payload.gallery_urls;
    }
    delete payload.gallery;
    if (Object.keys(localErrors).length) {
      setErrors(localErrors);
      toast.error('Check the form fields');
      setSaving(false);
      return;
    }
    try {
      const res = item.id ? await admin.updateServiceItem(item.id, payload) : await admin.createServiceItem(payload);
      const nextWarnings = res.data?.warnings || res.warnings || [];
      if (nextWarnings.length) toast(nextWarnings.join(' '), { icon: '⚠️' });
      toast.success(item.id ? 'Service updated' : 'Service added');
      setItem(null);
      load();
    } catch (err) {
      // Keep the form (and everything typed into it) open on failure.
      setErrors(err.errors || {});
      toast.error(err.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(row) {
    // Soft delete on the server: the record (and any booking history that
    // references it) is retained, it simply leaves the public catalogue.
    if (!window.confirm(`Delete “${row.title}”?\n\nIt will be removed from ${heading} and hidden on the live page. Past bookings are not affected. This cannot be undone from here.`)) return;
    if (deletingId) return;
    setDeletingId(row.id);
    try {
      await admin.deleteServiceItem(row.id, pageKey);
      toast.success(`“${row.title}” deleted`);
      if (item?.id === row.id) setItem(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Could not delete the service');
    } finally {
      setDeletingId(null);
    }
  }

  if (!data) {
    return <AdminDashboardLayout><p className="p-6 text-sm text-slate-500">Loading service pages…</p></AdminDashboardLayout>;
  }

  return (
    <AdminDashboardLayout>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{heading}</h1>
          <p className="text-sm text-slate-600">{summary}</p>
        </div>
        <Link to={viewTo} target="_blank" className="text-sm font-semibold text-[#376299]">{viewLabel}</Link>
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {TABS.map((entry) => (
          <button key={entry.id} type="button" className={`rounded-full px-3 py-1.5 text-sm ${tab === entry.id ? 'bg-slate-900 text-white' : 'bg-slate-100'}`} onClick={() => setTab(entry.id)}>
            {entry.label}
          </button>
        ))}
      </div>

      {tab === 'items' && !item ? (
        <div>
          <button type="button" className="mb-3 rounded-lg bg-[#376299] px-3 py-2 text-sm font-semibold text-white" onClick={() => editItem(null)}>+ Add new service</button>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-3 py-2">Service</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Delivery</th><th className="px-3 py-2">Price</th><th className="px-3 py-2">Status</th><th className="px-3 py-2"><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {data.items.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-10 text-center text-slate-500">No services yet. Use “Add new service” to create the first card.</td></tr>
                ) : data.items.map((row) => {
                  const section = data.sections.find((entry) => entry.id === row.sectionId);
                  const thumb = row.imageUrl ? (resolveMediaUrl(row.imageUrl) || row.imageUrl) : '';
                  return (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-3">
                          <span className="flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[#2a4d79] to-[#5b86c2] text-white">
                            {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" /> : <FaIcon icon="fa-video" className="text-xs" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{row.title}</span>
                            <span className="block truncate text-xs text-slate-500">{section?.title || row.benefit || ''}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2 capitalize">{row.type}</td>
                      <td className="px-3 py-2 capitalize">{row.deliveryMode}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {row.price?.display != null ? <>₹{Number(row.price.display).toLocaleString('en-IN')}{row.price?.showOffer ? <span className="ml-1 text-xs text-slate-400 line-through">₹{Number(row.price.regular).toLocaleString('en-IN')}</span> : null}</> : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span className="capitalize">{row.status}</span>
                        {row.isVisible === false ? <span className="block text-xs text-slate-400">Hidden</span> : null}
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <button type="button" className="mr-3 font-semibold text-[#376299]" onClick={() => editItem(row)}>Edit</button>
                        <button type="button" disabled={deletingId === row.id} className="font-semibold text-rose-700 disabled:opacity-50" onClick={() => removeItem(row)}>{deletingId === row.id ? 'Deleting…' : 'Delete'}</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === 'items' && item ? (
        <form onSubmit={saveItem} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900">{item.id ? `Edit service — ${item.title || 'Untitled'}` : 'Add new service'}</h2>
              {item.id ? <span className="text-xs text-slate-400">#{item.id}</span> : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Type">
                <select className={inputClass} value={item.item_type} onChange={(event) => setItem({ ...item, item_type: event.target.value })}>
                  <option value="service">Service</option>
                  <option value="plan">Plan</option>
                </select>
              </Field>
              <Field label="Delivery">
                <select className={inputClass} value={item.delivery_mode} onChange={(event) => setItem({ ...item, delivery_mode: event.target.value })}>
                  {pageKey === 'home_physiotherapy' ? (
                    <>
                      <option value="home">Home</option>
                      <option value="both">Both</option>
                    </>
                  ) : (
                    <>
                      <option value="online">Online</option>
                      <option value="both">Both</option>
                    </>
                  )}
                </select>
              </Field>
              <Field label="Title (60)"><input className={inputClass} maxLength={60} value={item.title} onChange={(event) => setItem({ ...item, title: event.target.value })} /></Field>
              <Field label="Benefit (90)"><input className={inputClass} maxLength={90} value={item.benefit} onChange={(event) => setItem({ ...item, benefit: event.target.value })} /></Field>
              <Field label="Section">
                <select className={inputClass} value={item.section_id} onChange={(event) => setItem({ ...item, section_id: Number(event.target.value) })}>
                  {data.sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select className={inputClass} value={item.status} onChange={(event) => setItem({ ...item, status: event.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </Field>
              <Field label="Booking pain type"><input className={inputClass} value={item.booking_pain_type} onChange={(event) => setItem({ ...item, booking_pain_type: event.target.value })} /></Field>
              {pageKey === 'home_physiotherapy' ? (
                <div className="sm:col-span-2 space-y-3">
                  <Field label="Booking URL">
                    <input
                      className={inputClass}
                      value={item.booking_url || ''}
                      placeholder={'/book?type=home_visit&service={slug}'}
                      spellCheck={false}
                      autoComplete="off"
                      inputMode="url"
                      onChange={(event) => setItem({ ...item, booking_url: event.target.value })}
                    />
                    <span className="mt-1 block text-xs font-normal text-slate-500">
                      Optional destination for this card&apos;s Book now button. Use a site path such as /book?type=home_visit&amp;service={'{slug}'} or an http(s) URL. Leave blank to use the page booking options. {'{slug}'}, {'{service}'}, and {'{pain}'} are filled in for the visitor.
                    </span>
                  </Field>
                  <Field label="Additional image URLs">
                    <textarea
                      className={`${inputClass} min-h-[88px]`}
                      value={item.gallery_urls || ''}
                      placeholder={'https://example.com/session-room.jpg'}
                      spellCheck={false}
                      onChange={(event) => setItem({ ...item, gallery_urls: event.target.value })}
                    />
                    <span className="mt-1 block text-xs font-normal text-slate-500">
                      Optional. One image per line, up to 8. These appear with the thumbnail when a visitor opens the service. Leave blank to show only the thumbnail.
                    </span>
                  </Field>
                </div>
              ) : null}
              <Field label="Badge (20)"><input className={inputClass} maxLength={20} value={item.badge} onChange={(event) => setItem({ ...item, badge: event.target.value })} /></Field>
              <Field label="Slug (auto-generated if blank)">
                <input className={inputClass} value={item.slug || ''} placeholder={slugifyTitle(item.title) || 'back-pain'} onChange={(event) => setItem({ ...item, slug: event.target.value })} />
                <span className="mt-1 block text-xs font-normal text-slate-500">{item.id ? 'Changing this changes the public URL.' : 'Leave blank to generate it from the title. Duplicates get a unique suffix.'}</span>
              </Field>
              <Field label="Thumbnail alt text (optional)">
                <input className={inputClass} maxLength={255} value={item.image_alt || ''} placeholder={item.title || 'Service thumbnail'} onChange={(event) => setItem({ ...item, image_alt: event.target.value })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Disclaimer">
                  <textarea
                    className={`${inputClass} min-h-[72px]`}
                    value={item.disclaimer || ''}
                    onChange={(event) => setItem({ ...item, disclaimer: event.target.value })}
                  />
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    Shown when a visitor opens the service. Required for cupping, hijama, and chiropractic.
                  </span>
                </Field>
              </div>
            </div>
            <MediaUrlOrUpload
              label="Thumbnail image"
              hint="Shown on the service card (admin list and live page). Uploads go to the existing CMS image library; saving without a new file keeps the current image."
              recommendedSize="800 × 600 px (4:3 ratio)"
              aspectRatio="4/3"
              devicePreview="4:3"
              accent="primary"
              icon="fa-image"
              urlValue={item.image_url || ''}
              onUrlChange={(value) => setItem({ ...item, image_url: value })}
              onUpload={uploadCmsImage}
              accept="image/jpeg,image/png,image/webp"
              maxMb={4}
              preview="image"
            />
            {errors && Object.keys(errors).length > 0 ? (
              <ul className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800" role="alert">{Object.entries(errors).map(([key, message]) => <li key={key}><strong className="capitalize">{key.replace(/_/g, ' ')}:</strong> {message}</li>)}</ul>
            ) : null}
            {warnings.length > 0 ? <ul className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}
            {item.item_type === 'service' ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Duration"><input className={inputClass} placeholder="e.g. 60 mins" value={item.duration_label} onChange={(event) => setItem({ ...item, duration_label: event.target.value })} /></Field>
                <Field label="Regular price (₹)"><input className={inputClass} inputMode="numeric" placeholder="1200" value={item.regular_price} onChange={(event) => setItem({ ...item, regular_price: event.target.value })} /></Field>
                <Field label="Offer price (₹)"><input className={inputClass} inputMode="numeric" placeholder="999" value={item.offer_price} onChange={(event) => setItem({ ...item, offer_price: event.target.value })} /></Field>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Weeks"><input className={inputClass} value={item.weeks_total} onChange={(event) => setItem({ ...item, weeks_total: event.target.value })} /></Field>
                  <Field label="Sessions"><input className={inputClass} value={item.sessions_total} onChange={(event) => setItem({ ...item, sessions_total: event.target.value })} /></Field>
                  <Field label="Full regular price"><input className={inputClass} value={item.plan_regular_price} onChange={(event) => setItem({ ...item, plan_regular_price: event.target.value })} /></Field>
                  <Field label="Full offer price"><input className={inputClass} value={item.plan_offer_price} onChange={(event) => setItem({ ...item, plan_offer_price: event.target.value })} /></Field>
                  <Field label="Reviewed by"><input className={inputClass} value={item.clinically_reviewed_by} onChange={(event) => setItem({ ...item, clinically_reviewed_by: event.target.value })} /></Field>
                  <Field label="Review date"><input type="date" className={inputClass} value={item.clinically_reviewed_at || ''} onChange={(event) => setItem({ ...item, clinically_reviewed_at: event.target.value })} /></Field>
                </div>
                <Field label="Phase name">
                  <input className={inputClass} value={item.phases[0]?.name || ''} onChange={(event) => setItem({ ...item, phases: [{ ...item.phases[0], name: event.target.value }] })} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Week from"><input className={inputClass} value={item.phases[0]?.week_from ?? 0} onChange={(event) => setItem({ ...item, phases: [{ ...item.phases[0], week_from: Number(event.target.value) }] })} /></Field>
                  <Field label="Week to"><input className={inputClass} value={item.phases[0]?.week_to ?? 0} onChange={(event) => setItem({ ...item, phases: [{ ...item.phases[0], week_to: Number(event.target.value) }] })} /></Field>
                  <Field label="Phase price"><input className={inputClass} value={item.phases[0]?.price ?? ''} onChange={(event) => setItem({ ...item, phases: [{ ...item.phases[0], price: event.target.value }] })} /></Field>
                </div>
                <Field label="Eligibility question">
                  <input className={inputClass} value={item.questions[0]?.prompt || ''} onChange={(event) => setItem({ ...item, questions: [{ ...item.questions[0], prompt: event.target.value, answers: item.questions[0].answers }] })} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Answer (ok)">
                    <input className={inputClass} value={item.questions[0]?.answers?.[0]?.label || ''} onChange={(event) => {
                      const answers = [...item.questions[0].answers];
                      answers[0] = { ...answers[0], label: event.target.value, outcome: 'ok' };
                      setItem({ ...item, questions: [{ ...item.questions[0], answers }] });
                    }} />
                  </Field>
                  <Field label="Answer (stop)">
                    <input className={inputClass} value={item.questions[0]?.answers?.[1]?.label || ''} onChange={(event) => {
                      const answers = [...(item.questions[0].answers || [{ outcome: 'ok' }, { outcome: 'stop' }])];
                      answers[1] = { ...(answers[1] || {}), label: event.target.value, outcome: 'stop' };
                      setItem({ ...item, questions: [{ ...item.questions[0], answers }] });
                    }} />
                  </Field>
                </div>
              </div>
            )}
            <Field label="Chips">
              <div className="flex flex-wrap gap-2">
                {data.chips.map((chip) => {
                  const on = item.chip_ids.includes(chip.id);
                  return (
                    <button key={chip.id} type="button" className={`rounded-full px-3 py-1 text-xs ${on ? 'bg-slate-900 text-white' : 'bg-slate-100'}`} onClick={() => setItem({ ...item, chip_ids: on ? item.chip_ids.filter((id) => id !== chip.id) : [...item.chip_ids, chip.id] })}>
                      {chip.label}{chip.warning ? ' · hidden' : ''}
                    </button>
                  );
                })}
              </div>
            </Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!item.ai_guided} onChange={(event) => setItem({ ...item, ai_guided: event.target.checked })} /> AI-guided tag</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.is_visible !== false} onChange={(event) => setItem({ ...item, is_visible: event.target.checked })} /> Visible</label>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="rounded-lg bg-[#376299] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : item.id ? 'Save changes' : 'Save service'}</button>
              <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setItem(null)}>Cancel</button>
            </div>
          </div>
          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Card preview</p>
            <div className="mt-3 overflow-hidden rounded-xl border">
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-[#2a4d79] to-[#5b86c2] text-white">
                {preview.image ? <img src={preview.image} alt="" className="h-full w-full object-cover" /> : <FaIcon icon="fa-video" />}
                {preview.badge ? <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-slate-800">{preview.badge}</span> : null}
              </div>
              <div className="p-3">
                <p className="font-semibold">{preview.title}</p>
                <p className="text-sm text-slate-500">{preview.benefit}</p>
                {preview.duration ? <p className="text-xs text-slate-400">{preview.duration}</p> : null}
                <p className="mt-2 text-lg font-bold">{preview.price != null && !Number.isNaN(preview.price) ? `₹${preview.price.toLocaleString('en-IN')}` : 'Fee confirmed when you book'}{preview.show ? <span className="ml-2 text-sm font-normal text-slate-400 line-through">₹{preview.regular.toLocaleString('en-IN')}</span> : null}</p>
                <span className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#376299] px-3 py-2 text-sm font-semibold text-white">Book now</span>
                {preview.show ? <p className="text-xs text-[#c9483b]">You save ₹{(preview.regular - preview.price).toLocaleString('en-IN')}</p> : null}
              </div>
            </div>
          </aside>
        </form>
      ) : null}

      {tab === 'sections' ? <SectionEditor data={data} onSaved={load} pageKey={pageKey} /> : null}
      {tab === 'chips' ? <ChipEditor data={data} onSaved={load} pageKey={pageKey} /> : null}
      {tab === 'options' ? <OptionEditor data={data} onSaved={load} pageKey={pageKey} /> : null}
      {tab === 'page' ? <PageEditor data={data} onSaved={load} pageKey={pageKey} /> : null}
    </AdminDashboardLayout>
  );
}

function sectionUseCount(section, items) {
  const listed = section.items?.length || 0;
  const linked = (items || []).filter((item) => item.sectionId === section.id).length;
  return Math.max(listed, linked);
}

function chipUseCount(chip, items) {
  const ids = new Set(chip.itemIds || []);
  (items || []).forEach((item) => {
    const keys = item.chipKeys || [];
    if (item.primaryChipKey === chip.key || keys.includes(chip.key)) ids.add(item.id);
  });
  return ids.size;
}

function SectionEditor({ data, onSaved, pageKey }) {
  const [row, setRow] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  function openSection(section) {
    setRow({
      ...section,
      allowed_types: section.allowedTypes,
      is_visible: section.isVisible,
      sort_order: section.sortOrder,
    });
  }
  async function save(event) {
    event.preventDefault();
    const payload = { ...row, page_key: pageKey };
    try {
      if (row.id) await admin.updateServiceSection(row.id, payload);
      else await admin.createServiceSection(payload);
      toast.success(row.id ? 'Section updated' : 'Section added');
      setRow(null);
      onSaved();
    } catch (err) {
      toast.error(err.errors?.title || err.message || 'Could not save the section');
    }
  }
  async function removeSection(section) {
    const count = sectionUseCount(section, data.items);
    if (count > 0) {
      const noun = count === 1 ? '1 service' : `${count} services`;
      const message = `“${section.title}” still has ${noun}. Move or delete those services before deleting this section.`;
      window.alert(message);
      toast.error(message);
      return;
    }
    if (!window.confirm(`Delete “${section.title}”?\n\nThis empty section will be removed from the catalogue. Services are not changed. This cannot be undone from here.`)) return;
    if (deletingId) return;
    setDeletingId(section.id);
    try {
      await admin.deleteServiceSection(section.id, pageKey);
      toast.success(`“${section.title}” deleted`);
      if (row?.id === section.id) setRow(null);
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Could not delete the section');
    } finally {
      setDeletingId(null);
    }
  }
  if (row) {
    return (
      <form onSubmit={save} className="max-w-xl space-y-3 rounded-xl border bg-white p-4">
        <h2 className="text-base font-bold text-slate-900">{row.id ? 'Edit section' : 'Add section'}</h2>
        <Field label="Title"><input className={inputClass} value={row.title} onChange={(event) => setRow({ ...row, title: event.target.value })} required /></Field>
        <Field label="Subtitle"><input className={inputClass} value={row.subtitle || ''} onChange={(event) => setRow({ ...row, subtitle: event.target.value })} /></Field>
        <Field label="Small label"><input className={inputClass} value={row.kicker || ''} onChange={(event) => setRow({ ...row, kicker: event.target.value })} /></Field>
        <Field label="Layout">
          <select className={inputClass} value={row.layout} onChange={(event) => setRow({ ...row, layout: event.target.value })}>
            <option value="carousel">Carousel</option>
            <option value="grid">Grid</option>
          </select>
        </Field>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-lg bg-[#376299] px-3 py-2 text-sm font-semibold text-white" type="submit">{row.id ? 'Save changes' : 'Save section'}</button>
          <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700" onClick={() => setRow(null)}>Cancel</button>
        </div>
      </form>
    );
  }
  return (
    <div className="space-y-2">
      <button type="button" className="rounded-lg bg-[#376299] px-3 py-2 text-sm font-semibold text-white" onClick={() => setRow({ title: '', subtitle: '', kicker: '', layout: pageKey === 'home_physiotherapy' ? 'grid' : 'carousel', allowed_types: pageKey === 'home_physiotherapy' ? 'service' : 'both', status: 'published', is_visible: true, sort_order: data.sections.length })}>Add section</button>
      {data.sections.map((section) => (
        <div key={section.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-3 py-3">
          <span className="min-w-0 font-medium text-slate-900">{section.title}</span>
          <span className="ml-auto flex shrink-0 items-center gap-3">
            <span className="text-xs text-slate-500">{section.items.length} items</span>
            <button type="button" className="font-semibold text-[#376299]" aria-label={`Edit ${section.title}`} onClick={() => openSection(section)}>Edit</button>
            <button type="button" disabled={deletingId === section.id} className="font-semibold text-rose-700 disabled:opacity-50" aria-label={`Delete ${section.title}`} onClick={() => removeSection(section)}>{deletingId === section.id ? 'Deleting…' : 'Delete'}</button>
          </span>
        </div>
      ))}
    </div>
  );
}

function ChipEditor({ data, onSaved, pageKey }) {
  const [row, setRow] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  function openChip(chip) {
    setRow({
      ...chip,
      chip_key: chip.key,
      is_pinned: chip.pinned,
      is_visible: chip.isVisible,
      item_ids: chip.itemIds || [],
    });
  }
  async function save(event) {
    event.preventDefault();
    const payload = { ...row, page_key: pageKey, item_ids: row.item_ids || row.itemIds || [] };
    try {
      if (row.id) await admin.updateServiceChip(row.id, payload);
      else await admin.createServiceChip(payload);
      toast.success(row.id ? 'Chip updated' : 'Chip added');
      setRow(null);
      onSaved();
    } catch (err) {
      toast.error(err.errors?.label || err.message || 'Could not save the chip');
    }
  }
  async function removeChip(chip) {
    const count = chipUseCount(chip, data.items);
    if (count > 0) {
      const noun = count === 1 ? '1 service' : `${count} services`;
      const message = `“${chip.label}” is still used by ${noun}. Unassign it from those services before deleting this chip.`;
      window.alert(message);
      toast.error(message);
      return;
    }
    if (!window.confirm(`Delete “${chip.label}”?\n\nThis chip will be removed from the catalogue. Services that do not use it stay as they are. This cannot be undone from here.`)) return;
    if (deletingId) return;
    setDeletingId(chip.id);
    try {
      await admin.deleteServiceChip(chip.id, pageKey);
      toast.success(`“${chip.label}” deleted`);
      if (row?.id === chip.id) setRow(null);
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Could not delete the chip');
    } finally {
      setDeletingId(null);
    }
  }
  if (row) {
    return (
      <form onSubmit={save} className="max-w-xl space-y-3 rounded-xl border bg-white p-4">
        <h2 className="text-base font-bold text-slate-900">{row.id ? 'Edit chip' : 'Add chip'}</h2>
        <Field label="Label"><input className={inputClass} value={row.label} onChange={(event) => setRow({ ...row, label: event.target.value })} required /></Field>
        <Field label="Key"><input className={inputClass} value={row.chip_key || row.key || ''} onChange={(event) => setRow({ ...row, chip_key: event.target.value })} /></Field>
        <Field label="Keywords"><input className={inputClass} value={row.keywords || ''} onChange={(event) => setRow({ ...row, keywords: event.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!row.is_pinned || !!row.pinned} onChange={(event) => setRow({ ...row, is_pinned: event.target.checked })} /> Pinned</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={(row.is_visible ?? row.isVisible) !== false} onChange={(event) => setRow({ ...row, is_visible: event.target.checked, isVisible: event.target.checked })} /> Visible</label>
        <div className="space-y-1">
          {data.items.map((service) => {
            const on = (row.item_ids || row.itemIds || []).includes(service.id);
            return (
              <label key={service.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={on} onChange={() => {
                  const current = row.item_ids || row.itemIds || [];
                  setRow({ ...row, item_ids: on ? current.filter((id) => id !== service.id) : [...current, service.id] });
                }} />
                {service.title}
              </label>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-lg bg-[#376299] px-3 py-2 text-sm font-semibold text-white" type="submit">{row.id ? 'Save changes' : 'Save chip'}</button>
          <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700" onClick={() => setRow(null)}>Cancel</button>
        </div>
      </form>
    );
  }
  return (
    <div className="space-y-2">
      <button type="button" className="rounded-lg bg-[#376299] px-3 py-2 text-sm font-semibold text-white" onClick={() => setRow({ label: '', chip_key: '', keywords: '', is_pinned: false, is_visible: true, item_ids: [] })}>Add chip</button>
      {data.chips.map((chip) => (
        <div key={chip.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-3 py-3">
          <div className="min-w-0">
            <span className="font-medium text-slate-900">{chip.label}</span>
            {chip.warning ? <span className="mt-1 block text-xs text-amber-700">{chip.warning}</span> : null}
          </div>
          <span className="ml-auto flex shrink-0 items-center gap-3">
            <button type="button" className="font-semibold text-[#376299]" aria-label={`Edit ${chip.label}`} onClick={() => openChip(chip)}>Edit</button>
            <button type="button" disabled={deletingId === chip.id} className="font-semibold text-rose-700 disabled:opacity-50" aria-label={`Delete ${chip.label}`} onClick={() => removeChip(chip)}>{deletingId === chip.id ? 'Deleting…' : 'Delete'}</button>
          </span>
        </div>
      ))}
    </div>
  );
}

function OptionEditor({ data, onSaved, pageKey }) {
  const [row, setRow] = useState(null);
  async function save(event) {
    event.preventDefault();
    try {
      await admin.updateServiceOption(row.id, {
        page_key: pageKey,
        label: row.label,
        sub_label: row.subLabel,
        href_template: row.hrefTemplate,
        phone: row.phone || '',
        whatsapp_number: row.whatsappNumber || '',
        whatsapp_message: row.whatsappMessage || '',
        is_visible: row.isVisible,
        icon: row.icon,
      });
      toast.success('Booking option saved');
      setRow(null);
      onSaved();
    } catch (err) {
      toast.error(err.errors?.href_template || err.errors?.label || err.message || 'Could not save');
    }
  }
  if (row) {
    return (
      <form onSubmit={save} className="max-w-xl space-y-3 rounded-xl border bg-white p-4">
        <Field label="Label"><input className={inputClass} value={row.label} onChange={(event) => setRow({ ...row, label: event.target.value })} /></Field>
        <Field label="Sub-label"><input className={inputClass} value={row.subLabel || ''} onChange={(event) => setRow({ ...row, subLabel: event.target.value })} /></Field>
        <Field label="Link"><input className={inputClass} value={row.hrefTemplate || ''} onChange={(event) => setRow({ ...row, hrefTemplate: event.target.value })} /></Field>
        <Field label="Phone"><input className={inputClass} value={row.phone || ''} onChange={(event) => setRow({ ...row, phone: event.target.value })} /></Field>
        <Field label="WhatsApp number"><input className={inputClass} value={row.whatsappNumber || ''} onChange={(event) => setRow({ ...row, whatsappNumber: event.target.value })} /></Field>
        <button className="rounded-lg bg-[#376299] px-3 py-2 text-sm font-semibold text-white" type="submit">Save option</button>
      </form>
    );
  }
  return (
    <div className="space-y-2">
      {data.options.map((option) => (
        <button key={option.id} type="button" className="block w-full rounded-xl border bg-white px-3 py-3 text-left" onClick={() => setRow(option)}>
          <span className="font-medium">{option.label}</span>
          <span className="mt-1 block text-xs text-slate-500">{option.hrefTemplate || option.phone || option.whatsappNumber || 'Uses the site contact number'}</span>
        </button>
      ))}
    </div>
  );
}

function PageEditor({ data, onSaved, pageKey }) {
  const [blocks, setBlocks] = useState(data.blocks || {});
  const [phone, setPhone] = useState(data.supportPhone || '');
  const [whatsapp, setWhatsapp] = useState(data.defaultWhatsapp || '');
  async function save(event) {
    event.preventDefault();
    try {
      await admin.updateServicePage({ page_key: pageKey, blocks, support_phone: phone, default_whatsapp: whatsapp });
      toast.success('Page settings saved');
      onSaved();
    } catch (err) {
      toast.error(err.errors?.blocks || err.message || 'Could not save page settings');
    }
  }
  return (
    <form onSubmit={save} className="max-w-xl space-y-3 rounded-xl border bg-white p-4">
      <Field label="Chip heading"><input className={inputClass} value={blocks.chipHeading || ''} onChange={(event) => setBlocks({ ...blocks, chipHeading: event.target.value })} /></Field>
      <Field label="Quick picks heading"><input className={inputClass} value={blocks.quickPicksHeading || ''} onChange={(event) => setBlocks({ ...blocks, quickPicksHeading: event.target.value })} /></Field>
      <Field label="New visitor reason"><input className={inputClass} value={blocks.reasonNew || ''} onChange={(event) => setBlocks({ ...blocks, reasonNew: event.target.value })} /></Field>
      <Field label="Support phone"><input className={inputClass} value={phone} onChange={(event) => setPhone(event.target.value)} /></Field>
      <Field label="WhatsApp number"><input className={inputClass} value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={blocks.showChips !== false} onChange={(event) => setBlocks({ ...blocks, showChips: event.target.checked })} /> Show filters</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={blocks.showQuickPicks !== false} onChange={(event) => setBlocks({ ...blocks, showQuickPicks: event.target.checked })} /> Show quick picks</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!blocks.showAiBanner} onChange={(event) => setBlocks({ ...blocks, showAiBanner: event.target.checked })} /> Show AI banner</label>
      <p className="text-xs text-slate-500">Do not add HIPAA or GDPR wording. The booking form still charges the physiotherapist&apos;s online fee.</p>
      <button className="rounded-lg bg-[#376299] px-3 py-2 text-sm font-semibold text-white" type="submit">Save page</button>
    </form>
  );
}
