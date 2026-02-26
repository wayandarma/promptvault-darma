import { useState } from 'react';

const CATEGORY_COLORS = {
    'Writing & Editing': '#5b9bd5',
    'Development': '#5eb87f',
    'Business': '#e8c97a',
    'Education': '#c47bb0',
    'Creative': '#d4845a',
    'Personal & Wellness': '#4fa8a0',
    'Language': '#8b7acc',
    'Data & Analysis': '#c46a6a',
};

export default function PromptCard({ id, act, prompt, category, tags, source, is_favorite, onFavoriteToggle, onTagClick }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const catColor = CATEGORY_COLORS[category] || '#606870';
    const isCustom = source === 'custom';
    const tagList = tags ? tags.split(',').filter(Boolean) : [];

    const handleCopy = () => {
        navigator.clipboard.writeText(prompt).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div
            className="group relative rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-px animate-fade-up"
            style={{
                background: 'var(--card)',
                border: `1px solid ${isCustom ? 'rgba(94,184,127,0.3)' : 'var(--border)'}`,
            }}
        >
            {/* Top shimmer line */}
            <div
                className="h-px w-full"
                style={{
                    background: isCustom
                        ? 'linear-gradient(90deg, transparent, rgba(94,184,127,0.5), transparent)'
                        : 'linear-gradient(90deg, transparent, var(--border2), transparent)',
                }}
            />

            <div className="p-4">
                {/* Title row */}
                <div className="flex items-start gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: catColor }} />
                    <h3 className="font-serif text-base flex-1 leading-snug" style={{ color: 'var(--text)' }}>
                        {act}
                    </h3>
                    <button
                        onClick={() => onFavoriteToggle(id)}
                        className="shrink-0 text-sm transition-colors cursor-pointer hover:scale-110"
                        style={{ color: is_favorite ? 'var(--accent)' : 'var(--muted)' }}
                        title={is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        ♦
                    </button>
                </div>

                {/* Prompt body */}
                <p
                    className="font-mono text-xs leading-relaxed mb-3 transition-all"
                    style={{
                        color: 'var(--muted2)',
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: isExpanded ? 'unset' : 3,
                        overflow: isExpanded ? 'visible' : 'hidden',
                    }}
                >
                    {prompt}
                </p>

                {/* Footer */}
                <div className="flex items-center flex-wrap gap-1.5">
                    {/* Category badge */}
                    <span
                        className="text-xs font-mono px-2 py-0.5 rounded-md"
                        style={{
                            color: catColor,
                            background: `${catColor}15`,
                            border: `1px solid ${catColor}30`,
                        }}
                    >
                        {category}
                    </span>

                    {/* Custom badge */}
                    {isCustom && (
                        <span
                            className="text-xs font-mono px-2 py-0.5 rounded-md"
                            style={{
                                color: 'var(--green)',
                                background: 'rgba(94,184,127,0.1)',
                                border: '1px solid rgba(94,184,127,0.3)',
                            }}
                        >
                            custom
                        </span>
                    )}

                    {/* Tag chips */}
                    {tagList.map(tag => (
                        <button
                            key={tag}
                            onClick={() => onTagClick(tag)}
                            className="text-xs font-mono px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                            style={{
                                color: 'var(--muted)',
                                background: 'transparent',
                                border: '1px solid var(--border)',
                            }}
                        >
                            {tag}
                        </button>
                    ))}

                    <div className="flex-1" />

                    {/* Expand / Collapse */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-xs px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                        style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}
                    >
                        {isExpanded ? '↑ Collapse' : '↕ Expand'}
                    </button>

                    {/* Copy */}
                    <button
                        onClick={handleCopy}
                        className="text-xs px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                        style={{
                            color: isCopied ? 'var(--green)' : 'var(--muted)',
                            border: `1px solid ${isCopied ? 'rgba(94,184,127,0.4)' : 'var(--border)'}`,
                            background: isCopied ? 'rgba(94,184,127,0.1)' : 'transparent',
                        }}
                    >
                        {isCopied ? '✓ Copied!' : '⌘ Copy'}
                    </button>
                </div>
            </div>
        </div>
    );
}
