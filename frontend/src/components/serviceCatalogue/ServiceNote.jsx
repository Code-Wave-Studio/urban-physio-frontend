import { htmlToText, sanitizeHtml } from '../../utils/htmlContent';

/** Formatted service instructions. The sheet footer `note` string is a different field. */
export default function ServiceNote({ html }) {
  const safe = sanitizeHtml(html || '');
  if (!htmlToText(safe).trim()) return null;
  return <div className="svc-note" dangerouslySetInnerHTML={{ __html: safe }} />;
}
