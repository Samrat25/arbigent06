// useArbiGent - React hook for ArbiGent agent management
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  arbiGentService, 
  AgentLog, 
  AgentState, 
  AgentConfig, 
  RiskLevel,
  VaultState 
} from '@/services/ArbiGentService';

export interface UseArbiGentReturn {
  // State
  isRunning: boolean;
  logs: AgentLog[];
  agentState: AgentState;
  runningDuration: string;
  localVaultBalances: VaultState;
  
  // Actions
  startAgent: () => void;
  stopAgent: () => void;
  clearLogs: () => void;
  
  // Configuration
  updateConfig: (config: Partial<AgentConfig>) => void;
  updateVaultBalances: (balances: VaultState) => void;
  updatePrices: (prices: Record<string, number>) => void;
  setWalletAddress: (address: string) => void;
}

export const useArbiGent = (): UseArbiGentReturn => {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [agentState, setAgentState] = useState<AgentState>(arbiGentService.getState());
  const [runningDuration, setRunningDuration] = useState('0m');
  const [localVaultBalances, setLocalVaultBalances] = useState<VaultState>(arbiGentService.getVaultBalances());
  
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    arbiGentService.onLog((log) => {
      setLogs(prev => [...prev.slice(-99), log]);
    });

    arbiGentService.onStateChange((state) => {
      setAgentState(state);
      setIsRunning(state.isRunning);
    });

    arbiGentService.onVaultUpdate((balances) => {
      setLocalVaultBalances({ ...balances });
    });

    setLogs(arbiGentService.getLogs());
    setAgentState(arbiGentService.getState());
    setIsRunning(arbiGentService.getState().isRunning);
    setLocalVaultBalances(arbiGentService.getVaultBalances());

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      durationIntervalRef.current = setInterval(() => {
        setRunningDuration(arbiGentService.getRunningDuration());
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      setRunningDuration('0m');
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isRunning]);

  const startAgent = useCallback(() => {
    arbiGentService.start();
  }, []);

  const stopAgent = useCallback(() => {
    arbiGentService.stop();
  }, []);

  const clearLogs = useCallback(() => {
    arbiGentService.clearLogs();
    setLogs([]);
  }, []);

  const updateConfig = useCallback((config: Partial<AgentConfig>) => {
    arbiGentService.updateConfig(config);
  }, []);

  const updateVaultBalances = useCallback((balances: VaultState) => {
    arbiGentService.updateVaultBalances(balances);
    setLocalVaultBalances({ ...balances });
  }, []);

  const updatePrices = useCallback((prices: Record<string, number>) => {
    arbiGentService.updatePrices(prices);
  }, []);

  const setWalletAddress = useCallback((address: string) => {
    arbiGentService.setWalletAddress(address);
  }, []);

  return {
    isRunning,
    logs,
    agentState,
    runningDuration,
    localVaultBalances,
    startAgent,
    stopAgent,
    clearLogs,
    updateConfig,
    updateVaultBalances,
    updatePrices,
    setWalletAddress,
  };
};

export default useArbiGent;
