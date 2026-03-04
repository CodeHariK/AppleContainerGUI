import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { checkSystemStatus, startSystem, stopSystem } from '../lib/container';

interface SystemContextType {
    systemRunning: boolean;
    isSystemLoading: boolean;
    isInitialLoading: boolean;
    refreshStatus: () => Promise<boolean>;
    start: () => Promise<void>;
    stop: () => Promise<void>;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [systemRunning, setSystemRunning] = useState<boolean>(false);
    const [isSystemLoading, setIsSystemLoading] = useState<boolean>(false);
    const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

    const refreshStatus = useCallback(async () => {
        try {
            const isRunning = await checkSystemStatus();
            setSystemRunning(isRunning);
            return isRunning;
        } catch (error) {
            console.error('Failed to check system status:', error);
            setSystemRunning(false);
            return false;
        } finally {
            setIsInitialLoading(false);
        }
    }, []);

    const start = useCallback(async () => {
        setIsSystemLoading(true);
        try {
            await startSystem();
            await refreshStatus();
        } catch (error) {
            console.error('Failed to start system:', error);
            throw error;
        } finally {
            setIsSystemLoading(false);
        }
    }, [refreshStatus]);

    const stop = useCallback(async () => {
        setIsSystemLoading(true);
        try {
            await stopSystem();
            await refreshStatus();
        } catch (error) {
            console.error('Failed to stop system:', error);
            throw error;
        } finally {
            setIsSystemLoading(false);
        }
    }, [refreshStatus]);

    useEffect(() => {
        refreshStatus();
        // Poll every 10 seconds to keep it in sync if changed elsewhere
        const interval = setInterval(refreshStatus, 10000);
        return () => clearInterval(interval);
    }, [refreshStatus]);

    return (
        <SystemContext.Provider value={{
            systemRunning,
            isSystemLoading,
            isInitialLoading,
            refreshStatus,
            start,
            stop
        }}>
            {children}
        </SystemContext.Provider>
    );
};

export const useSystem = () => {
    const context = useContext(SystemContext);
    if (context === undefined) {
        throw new Error('useSystem must be used within a SystemProvider');
    }
    return context;
};
