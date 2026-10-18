import React from 'react';

const EmptyState = ({ icon: Icon, title, description, action, tone = 'brand' }) => (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
        {Icon && (
            <span className={`mb-4 flex size-14 items-center justify-center rounded-2xl ${tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-brand-soft text-brand-ink'}`}>
                <Icon className="size-7" aria-hidden="true" />
            </span>
        )}
        <h2 className="text-xl font-bold">{title}</h2>
        {description && <p className="mt-2 max-w-md text-muted">{description}</p>}
        {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
);

export default EmptyState;
