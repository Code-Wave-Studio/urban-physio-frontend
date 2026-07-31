import FaIcon from '../../FaIcon';

const SAMPLE = {
  patient_name: 'Priya Sharma',
  clinic_name: 'The Urban Physio',
  clinic: 'The Urban Physio',
  date: '01 Aug 2026',
  time: '10:30 AM',
  doctor_name: 'Dr. Hridesh',
  amount: '₹800',
};

function renderVars(text, vars = {}) {
  const merged = { ...SAMPLE, ...vars };
  return String(text || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) =>
    merged[key] != null ? String(merged[key]) : `{{${key}}}`
  );
}

export default function MessagePreview({ channel = 'whatsapp', subject = '', body = '', mediaUrl = '', vars }) {
  const text = renderVars(body, vars);
  const subj = renderVars(subject, vars);

  if (channel === 'email') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden max-w-[360px] mx-auto">
        <div className="bg-slate-100 px-4 py-2 text-[11px] text-slate-500 flex items-center gap-2">
          <FaIcon icon="fa-envelope" /> Email Preview
        </div>
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-[10px] uppercase text-slate-400">Subject</p>
          <p className="text-sm font-semibold text-slate-800">{subj || '—'}</p>
        </div>
        <div className="p-4 text-sm text-slate-700 whitespace-pre-wrap min-h-[180px]">{text || 'Start typing…'}</div>
        {mediaUrl ? <img src={mediaUrl} alt="" className="w-full max-h-40 object-cover" /> : null}
      </div>
    );
  }

  if (channel === 'sms') {
    return (
      <div className="rounded-[2rem] border-4 border-slate-800 bg-slate-900 p-3 max-w-[280px] mx-auto shadow-xl">
        <div className="rounded-[1.5rem] bg-[#e5ddd5] min-h-[320px] p-3 flex flex-col">
          <div className="text-center text-[10px] text-slate-500 mb-3">SMS · Today</div>
          <div className="self-end max-w-[85%] rounded-2xl rounded-br-md bg-[#dcf8c6] px-3 py-2 text-[13px] text-slate-800 shadow-sm whitespace-pre-wrap">
            {text || 'Start typing…'}
          </div>
          <p className="text-[10px] text-slate-500 mt-2 text-right">{text.length}/160</p>
        </div>
      </div>
    );
  }

  // WhatsApp (default)
  return (
    <div className="rounded-[2rem] border-4 border-slate-800 bg-slate-900 p-3 max-w-[280px] mx-auto shadow-xl">
      <div
        className="rounded-[1.5rem] min-h-[360px] p-3 flex flex-col bg-[#0b141a]"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #1f2c34 0, transparent 40%)' }}
      >
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">UP</div>
          <div>
            <p className="text-xs font-semibold text-white">Clinic WhatsApp</p>
            <p className="text-[10px] text-emerald-400">online</p>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-end gap-2">
          <div className="self-end max-w-[90%] rounded-2xl rounded-br-md bg-[#005c4b] px-3 py-2 text-[13px] text-white shadow-sm">
            {mediaUrl ? <img src={mediaUrl} alt="" className="rounded-lg mb-2 max-h-28 w-full object-cover" /> : null}
            <p className="whitespace-pre-wrap">{text || 'Start typing…'}</p>
            <p className="text-[9px] text-white/50 text-right mt-1">10:32 ✓✓</p>
          </div>
        </div>
      </div>
    </div>
  );
}
