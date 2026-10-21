import { createContext, useContext } from 'react';
import { Client } from '@stomp/stompjs';

export const WebSocketContext = createContext<Client | null>(null);

export const useGlobalSocket = () => useContext(WebSocketContext);
