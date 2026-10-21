import { createContext, useContext, useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { neon } from '../features/auth/lib/neon';

const WebSocketContext = createContext<Client | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [stompClient, setStompClient] = useState<Client | null>(null);

  // Destructure data without aliasing it to avoid confusion
  const { data } = neon.useSession();

  // Safely extract the token from the nested session object
  const token = data?.session?.token;

  useEffect(() => {
    // Only connect if the token exists
    if (!token) return;

    const socketUrl = `${import.meta.env.VITE_API_BASE_URL}/api/ws-roborally`;

    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      onConnect: () => {
        setStompClient(client);
      },
      onDisconnect: () => setStompClient(null),
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [token]);

  return <WebSocketContext.Provider value={stompClient}>{children}</WebSocketContext.Provider>;
}

export const useGlobalSocket = () => useContext(WebSocketContext);
