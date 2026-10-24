import { useMemo, useRef, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import FaIcon from '../FaIcon';
import { uploadCmsImage } from '../../services/api';
import toast from 'react-hot-toast';

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  [{ size: ['small', false, 'large', 'huge'] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  [{ align: [] }],
  ['blockquote', 'code-block'],
  ['link', 'image'],
  ['clean'],
];

const NOTE_TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['clean'],
];

const FULL_FORMATS = [
  'header', 'size', 'bold', 'italic', 'underline', 'strike', 'color', 'background',
  'list', 'bullet', 'indent', 'align', 'blockquote', 'code-block', 'link', 'image',
];

const NOTE_FORMATS = ['header', 'bold', 'italic', 'color', 'background', 'list'];

/**
 * WYSIWYG editor for CMS — headings, formatting, lists, links, images, tables.
 * variant="note" is the compact toolbar used on service notes.
 */
export default function RichTextEditor({ value, onChange, placeholder = 'Write content…', minHeight = 220, variant = 'full' }) {
  const compact = variant === 'note';
  const quillRef = useRef(null);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/gif';
    input.click();
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 4 * 1024 * 1024) {
        toast.error('Image must be 4MB or smaller');
        return;
      }
      try {
        const res = await uploadCmsImage(file);
        const url = res?.data?.url ?? res?.url ?? '';
        const editor = quillRef.current?.getEditor();
        const range = editor?.getSelection(true);
        if (editor && url) {
          editor.insertEmbed(range?.index ?? 0, 'image', url);
        }
      } catch (e) {
        toast.error(e.response?.data?.message || e.message || 'Image upload failed');
      }
    };
  }, []);

  const insertTable = useCallback(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const range = editor.getSelection(true);
    const idx = range?.index ?? editor.getLength();
    const table =
      '<table class="cms-table"><thead><tr><th>Column 1</th><th>Column 2</th></tr></thead><tbody><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table><p><br></p>';
    editor.clipboard.dangerouslyPasteHTML(idx, table);
  }, []);

  const modules = useMemo(
    () => (compact
      ? { toolbar: NOTE_TOOLBAR }
      : {
        toolbar: {
          container: TOOLBAR,
          handlers: { image: imageHandler },
        },
      }),
    [compact, imageHandler]
  );

  const formats = compact ? NOTE_FORMATS : FULL_FORMATS;

  return (
    <div className={`rich-text-editor rounded-xl border border-slate-200 overflow-hidden bg-white${compact ? ' rich-text-editor--note' : ''}`}>
      {compact ? null : (
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50/80">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mr-1">Tools</span>
        <button
          type="button"
          onClick={insertTable}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-800 transition"
        >
          <FaIcon icon="fa-table" className="text-[10px]" />
          Insert table
        </button>
      </div>
      )}
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={(html) => onChange(html === '<p><br></p>' ? '' : html)}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="cms-quill"
      />
      <style>{`
        .cms-quill .ql-container { min-height: ${minHeight}px; font-size: 15px; }
        .cms-quill .ql-editor { min-height: ${minHeight}px; }
      `}</style>
    </div>
  );
}
