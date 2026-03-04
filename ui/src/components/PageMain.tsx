import React from 'react';
import { NavBar } from './NavBar';
import { useSystem } from '../contexts/SystemContext';
import Offline from '../pages/Offline';
import './components.css';

interface PageMainProps {
    header?: React.ReactNode;
    children: React.ReactNode;
}

export function PageMain({ header, children }: PageMainProps) {
    const { systemRunning } = useSystem();

    return (
        <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col overflow-x-hidden text-slate-900 dark:text-slate-100">
            <NavBar />
            <main className="flex-1 px-4 md:px-10 py-8 max-w-[1400px] mx-auto w-full animate-fade-in font-display">
                {header}
                {systemRunning ? children : <Offline />}
            </main>
        </div>
    );
}
