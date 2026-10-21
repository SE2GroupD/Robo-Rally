import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { neon } from '../features/auth/lib/neon';
import { WebSocketContext } from '../app/WebSocketContext';

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [stompClient, setStompClient] = useState<Client | null>(null);

  const { data } = neon.useSession();
  const token = data?.session?.token;

  useEffect(() => {
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
