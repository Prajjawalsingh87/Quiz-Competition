import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import useDocumentTitle from '../utils/useDocumentTitle';

const NotFound = () => {
    useDocumentTitle('Page not found');
    return (
        <div className="mx-auto max-w-xl pt-8">
            <EmptyState
                icon={Compass}
                title="This page wandered off"
                description="The link may be broken or the page may have moved. Let’s get you back to the game."
                action={<><Link to="/" className="btn btn-primary">Go home</Link><Link to="/quiz" className="btn btn-secondary">Play a quiz</Link></>}
            />
        </div>
    );
};

export default NotFound;
