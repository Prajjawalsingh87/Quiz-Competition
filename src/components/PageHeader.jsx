import React from 'react';

const PageHeader = ({ eyebrow, title, description, actions }) => (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
            {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
            <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
            {description && <p className="mt-2 text-base text-muted sm:text-lg">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
    </header>
);

export default PageHeader;
