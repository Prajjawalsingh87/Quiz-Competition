import { useEffect } from 'react';

const useDocumentTitle = (title) => {
    useEffect(() => {
        document.title = title ? `${title} · AI Quiz` : 'AI Quiz — Compete, learn, level up';
    }, [title]);
};

export default useDocumentTitle;
