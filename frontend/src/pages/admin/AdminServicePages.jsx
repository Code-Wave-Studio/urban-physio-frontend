import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import FaIcon from '../../components/FaIcon';
import { admin } from '../../services/api';
import toast from 'react-hot-toast';

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
    return { title: item.title || 'Service title', benefit: item.benefit || 'Benefit', price: show ? offer : regular, regular, show };
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
    setSaving(true);
    setErrors({});
    const payload = {
      ...item,
      page_key: pageKey,
      included: lines(item.included),
      good_fit: lines(item.good_fit),
      see_doctor: lines(item.see_doctor),
      regular_price: item.regular_price === '' ? null : Number(item.regular_price),
      offer_price: item.offer_price === '' ? null : Number(item.offer_price),
      plan_regular_price: item.plan_regular_price === '' ? null : Number(item.plan_regular_price),
      plan_offer_price: item.plan_offer_price === '' ? null : Number(item.plan_offer_price),
    };
    try {
      const res = item.id ? await admin.updateServiceItem(item.id, payload) : await admin.createServiceItem(payload);
      setWarnings(res.data?.warnings || []);
      toast.success('Service saved');
      setItem(null);
      load();
    } catch (err) {
      setErrors(err.errors || {});
      toast.error(err.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(row) {
    if (!window.confirm(`Hide “${row.title}” from Tele-Rehab?`)) return;
    try {
      await admin.deleteServiceItem(row.id, pageKey);
      toast.success('Service hidden');
      load();
    } catch (err) {
      toast.error(err.message || 'Could not hide the service');
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
          <button type="button" className="mb-3 rounded-lg bg-[#376299] px-3 py-2 text-sm font-semibold text-white" onClick={() => editItem(null)}>Add service or plan</button>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-3 py-2">Title</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Delivery</th><th className="px-3 py-2">Status</th><th className="px-3 py-2" /></tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium">{row.title}</td>
                    <td className="px-3 py-2">{row.type}</td>
                    <td className="px-3 py-2">{row.deliveryMode}</td>
                    <td className="px-3 py-2">{row.status}</td>
                    <td className="px-3 py-2 text-right">
                      <button type="button" className="mr-2 text-[#376299]" onClick={() => editItem(row)}>Edit</button>
                      <button type="button" className="text-rose-700" onClick={() => removeItem(row)}>Hide</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === 'items' && item ? (
        <form onSubmit={saveItem} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Type">
                <select className={inputClass} value={item.item_type} onChange={(event) => setItem({ ...item, item_type: event.target.value })}>
                  <option value="service">Service</option>
                  <option value="plan">Plan</option>
                </select>
              </Field>
              <Field label="Delivery">
                <select className={inputClass} value={item.delivery_mode} onChange={(event) => setItem({ ...item, delivery_mode: event.target.value })}>
                  <option value="online">Online</option>
                  <option value="both">Both</option>
                  <option value="home">Home</option>
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
              <Field label="Badge (20)"><input className={inputClass} maxLength={20} value={item.badge} onChange={(event) => setItem({ ...item, badge: event.target.value })} /></Field>
            </div>
            {errors && Object.keys(errors).length > 0 ? (
              <ul className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{Object.entries(errors).map(([key, message]) => <li key={key}>{message}</li>)}</ul>
            ) : null}
            {warnings.length > 0 ? <ul className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}
            {item.item_type === 'service' ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Duration"><input className={inputClass} value={item.duration_label} onChange={(event) => setItem({ ...item, duration_label: event.target.value })} /></Field>
                <Field label="Regular price"><input className={inputClass} inputMode="numeric" value={item.regular_price} onChange={(event) => setItem({ ...item, regular_price: event.target.value })} /></Field>
                <Field label="Offer price"><input className={inputClass} inputMode="numeric" value={item.offer_price} onChange={(event) => setItem({ ...item, offer_price: event.target.value })} /></Field>
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
              <button type="submit" disabled={saving} className="rounded-lg bg-[#376299] px-4 py-2 text-sm font-semibold text-white">{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setItem(null)}>Cancel</button>
            </div>
          </div>
          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Card preview</p>
            <div className="mt-3 overflow-hidden rounded-xl border">
              <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[#2a4d79] to-[#5b86c2] text-white"><FaIcon icon="fa-video" /></div>
              <div className="p-3">
                <p className="font-semibold">{preview.title}</p>
                <p className="text-sm text-slate-500">{preview.benefit}</p>
                <p className="mt-2 text-lg font-bold">{preview.price != null ? `₹${preview.price.toLocaleString('en-IN')}` : 'Fee confirmed when you book'}</p>
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

function SectionEditor({ data, onSaved, pageKey }) {
  const [row, setRow] = useState(null);
  async function save(event) {
    event.preventDefault();
    const payload = { ...row, page_key: pageKey };
    try {
      if (row.id) await admin.updateServiceSection(row.id, payload);
      else await admin.createServiceSection(payload);
      toast.success('Section saved');
      setRow(null);
      onSaved();
    } catch (err) {
      toast.error(err.errors?.title || err.message || 'Could not save the section');
    }
  }
  if (row) {
    return (
      <form onSubmit={save} className="max-w-xl space-y-3 rounded-xl border bg-white p-4">
        <Field label="Title"><input className={inputClass} value={row.title} onChange={(event) => setRow({ ...row, title: event.target.value })} /></Field>
        <Field label="Subtitle"><input className={inputClass} value={row.subtitle || ''} onChange={(event) => setRow({ ...row, subtitle: event.target.value })} /></Field>
        <Field label="Small label"><input className={inputClass} value={row.kicker || ''} onChange={(event) => setRow({ ...row, kicker: event.target.value })} /></Field>
        <Field label="Layout">
          <select className={inputClass} value={row.layout} onChange={(event) => setRow({ ...row, layout: event.target.value })}>
            <option value="carousel">Carousel</option>
            <option value="grid">Grid</option>
          </select>
        </Field>
        <button className="rounded-lg bg-[#376299] px-3 py-2 text-sm font-semibold text-white" type="submit">Save section</button>
      </form>
    );
  }
  return (
    <div className="space-y-2">
      <button type="button" className="rounded-lg bg-[#376299] px-3 py-2 text-sm font-semibold text-white" onClick={() => setRow({ title: '', subtitle: '', kicker: '', layout: pageKey === 'home_physiotherapy' ? 'grid' : 'carousel', allowed_types: pageKey === 'home_physiotherapy' ? 'service' : 'both', status: 'published', is_visible: true, sort_order: data.sections.length })}>Add section</button>
      {data.sections.map((section) => (
        <button key={section.id} type="button" className="flex w-full items-center justify-between rounded-xl border bg-white px-3 py-3 text-left" onClick={() => setRow({ ...section, allowed_types: section.allowedTypes, is_visible: section.isVisible, sort_order: section.sortOrder })}>
          <span>{section.title}</span>
          <span className="text-xs text-slate-500">{section.items.length} items</span>
        </button>
      ))}
    </div>
  );
}

function ChipEditor({ data, onSaved, pageKey }) {
  const [row, setRow] = useState(null);
  async function save(event) {
    event.preventDefault();
    const payload = { ...row, page_key: pageKey };
    try {
      if (row.id) await admin.updateServiceChip(row.id, payload);
      else await admin.createServiceChip(payload);
      toast.success('Chip saved');
      setRow(null);
      onSaved();
    } catch (err) {
      toast.error(err.errors?.label || err.message || 'Could not save the chip');
    }
  }
  if (row) {
    return (
      <form onSubmit={save} className="max-w-xl space-y-3 rounded-xl border bg-white p-4">
        <Field label="Label"><input className={inputClass} value={row.label} onChange={(event) => setRow({ ...row, label: event.target.value })} /></Field>
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
        <button className="rounded-lg bg-[#376299] px-3 py-2 text-sm font-semibold text-white" type="submit">Save chip</button>
      </form>
    );
  }
  return (
    <div className="space-y-2">
      <button type="button" className="rounded-lg bg-[#376299] px-3 py-2 text-sm font-semibold text-white" onClick={() => setRow({ label: '', chip_key: '', keywords: '', is_pinned: false, is_visible: true, item_ids: [] })}>Add chip</button>
      {data.chips.map((chip) => (
        <button key={chip.id} type="button" className="block w-full rounded-xl border bg-white px-3 py-3 text-left" onClick={() => setRow({ ...chip, chip_key: chip.key, is_pinned: chip.pinned, is_visible: chip.isVisible, item_ids: chip.itemIds })}>
          <span className="font-medium">{chip.label}</span>
          {chip.warning ? <span className="mt-1 block text-xs text-amber-700">{chip.warning}</span> : null}
        </button>
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
