import { createContext, useContext, useEffect, useRef, ReactNode } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useLocation } from "wouter";
import { api, setWorkspaceId, setWalletAddress, useWorkspaceId } from "@/lib/api";

interface AuthContextValue {
  isAuthenticated: boolean;
  walletAddress: string | undefined;
  workspaceId: string | null;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  walletAddress: undefined,
  workspaceId: null,
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [, navigate] = useLocation();
  const workspaceId = useWorkspaceId();
  const prevAddress = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!isConnected || !address) {
      if (prevAddress.current) {
        setWalletAddress(undefined);
        localStorage.removeItem("nv_workspace_id");
        prevAddress.current = undefined;
        navigate("/auth");
      }
      return;
    }

    setWalletAddress(address);

    if (address === prevAddress.current && workspaceId) return;
    prevAddress.current = address;

    api.walletConnect(address).then((res) => {
      if (res?.workspace?.id) setWorkspaceId(res.workspace.id);
    }).catch(() => {});
  }, [address, isConnected]);

  const signOut = () => {
    setWalletAddress(undefined);
    localStorage.removeItem("nv_workspace_id");
    prevAddress.current = undefined;
    disconnect();
    navigate("/auth");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: isConnected && !!address,
        walletAddress: address,
        workspaceId,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
