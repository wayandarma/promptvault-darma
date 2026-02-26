import { useState, useEffect, useRef } from 'react';

const INITIAL_STATE = { act: '', prompt: '', category: 'Uncategorized', tags: '' };

export default function AddPromptModal({ isOpen, onClose, onSave, categories }) {
    const [form, setForm] = useState(INITIAL_STATE);
    const [errors, setErrors] = useState({ act: '', prompt: '' });
    const actRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setForm(INITIAL_STATE);
            setErrors({ act: '', prompt: '' });
            setTimeout(() => actRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    const handleChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {
            act: form.act.trim() ? '' : 'Title is required',
            prompt: form.prompt.trim() ? '' : 'Prompt text is required',
        };
        setErrors(newErrors);
        if (newErrors.act || newErrors.prompt) return;

        onSave({
            act: form.act.trim(),
            prompt: form.prompt.trim(),
            category: form.category,
            tags: form.tags.trim(),
        });
        setForm(INITIAL_STATE);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full mx-4 rounded-xl overflow-hidden"
                style={{
                    maxWidth: 560,
                    background: 'var(--surface)',
                    border: '1px solid var(--border2)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4">
                    <div>
                        <h2 className="font-serif text-lg" style={{ color: 'var(--text)' }}>
                            Add Custom Prompt
                        </h2>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                            Saved locally · Marked as custom
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                        style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
                    >
                        ✕
                    </button>
                </div>

                <hr className="border-0" style={{ borderTop: '1px solid var(--border)' }} />

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
                    <Field label="Title" error={errors.act}>
                        <input
                            ref={actRef}
                            type="text"
                            value={form.act}
                            onChange={(e) => handleChange('act', e.target.value)}
                            placeholder="e.g. SEO Content Writer"
                            className="w-full bg-transparent text-sm px-3 py-2.5 rounded-lg outline-none font-sans"
                            style={{
                                color: 'var(--text)',
                                border: `1px solid ${errors.act ? '#c46a6a' : 'var(--border)'}`,
                                background: 'var(--card)',
                            }}
                        />
                    </Field>

                    <Field label="Prompt" error={errors.prompt}>
                        <textarea
                            value={form.prompt}
                            onChange={(e) => handleChange('prompt', e.target.value)}
                            placeholder="Write the system prompt here..."
                            className="w-full bg-transparent text-sm px-3 py-2.5 rounded-lg outline-none font-mono resize-none"
                            style={{
                                height: 120,
                                color: 'var(--text)',
                                border: `1px solid ${errors.prompt ? '#c46a6a' : 'var(--border)'}`,
                                background: 'var(--card)',
                            }}
                        />
                    </Field>

                    <Field label="Category">
                        <select
                            value={form.category}
                            onChange={(e) => handleChange('category', e.target.value)}
                            className="w-full text-sm px-3 py-2.5 rounded-lg outline-none font-sans cursor-pointer appearance-none"
                            style={{
                                color: 'var(--text)',
                                border: '1px solid var(--border)',
                                background: 'var(--card)',
                            }}
                        >
                            <option value="Uncategorized">Uncategorized</option>
                            {categories.map(c => (
                                <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Tags" hint="Comma-separated">
                        <input
                            type="text"
                            value={form.tags}
                            onChange={(e) => handleChange('tags', e.target.value)}
                            placeholder="e.g. seo, writing, marketing"
                            className="w-full bg-transparent text-sm px-3 py-2.5 rounded-lg outline-none font-sans"
                            style={{
                                color: 'var(--text)',
                                border: '1px solid var(--border)',
                                background: 'var(--card)',
                            }}
                        />
                    </Field>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer"
                            style={{ color: 'var(--muted2)', border: '1px solid var(--border)' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-90 cursor-pointer"
                            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
                        >
                            Save Prompt
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Field({ label, hint, error, children }) {
    return (
        <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--muted2)' }}>
                {label}
                {hint && <span className="ml-1.5" style={{ color: 'var(--muted)' }}>({hint})</span>}
            </label>
            {children}
            {error && (
                <p className="text-xs mt-1" style={{ color: '#c46a6a' }}>{error}</p>
            )}
        </div>
    );
}
