import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useNetwork } from './NetworkContext';

export interface Order {
  id: string;
  userId: string;
  userName: string;
  productType: 'waffle' | 'pancake';
  fraction?: number;
  quantity?: number;
  basePrice: number;
  totalPrice: number;
  notes: string;
  timestamp: string;
  isCancelled: boolean;
  /** true once this order has been successfully confirmed by the GAS backend */
  isSynced: boolean;
  /** true if addOrder was already accepted by server (guards cancel-before-sync race) */
  serverCreated?: boolean;
}

export interface Shift {
  id: string;
  userId: string;
  userName: string;
  startTime: string;
  isActive: boolean;
  /** false = was ended offline and end still needs to be sent to server */
  isSynced: boolean;
}

interface OrdersContextType {
  orders: Order[];
  shifts: Shift[];
  isWorking: boolean;
  todayOrders: Order[];
  addOrder: (
    data: Omit<Order, 'id' | 'userId' | 'userName' | 'timestamp' | 'isCancelled' | 'isSynced' | 'serverCreated'>,
  ) => Promise<Order>;
  cancelOrder: (id: string) => Promise<void>;
  startShift: () => Promise<void>;
  endShift: () => Promise<void>;
}

const OrdersContext = createContext<OrdersContextType | null>(null);

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

async function gasPost(url: string, body: object) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { user, gasUrl } = useAuth();
  const { isOnline } = useNetwork();

  const [orders, setOrders] = useState<Order[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isWorking, setIsWorking] = useState(false);

  // Refs for use inside async functions without stale closures
  const ordersRef = useRef(orders);
  const shiftsRef = useRef(shifts);
  ordersRef.current = orders;
  shiftsRef.current = shifts;

  // ── Hydrate from AsyncStorage on mount / user change ──────────────────────
  useEffect(() => {
    (async () => {
      const [storedOrders, storedShifts] = await Promise.all([
        AsyncStorage.getItem('orders'),
        AsyncStorage.getItem('shifts'),
      ]);
      if (storedOrders) {
        const parsed: Order[] = JSON.parse(storedOrders);
        setOrders(parsed);
        ordersRef.current = parsed;
      }
      if (storedShifts) {
        const parsed: Shift[] = JSON.parse(storedShifts);
        setShifts(parsed);
        shiftsRef.current = parsed;
        if (user) {
          setIsWorking(!!parsed.find((s) => s.userId === user.id && s.isActive));
        }
      }
    })();
  }, [user]);

  // ── Persist helpers ────────────────────────────────────────────────────────
  const saveOrders = useCallback(async (updated: Order[]) => {
    setOrders(updated);
    ordersRef.current = updated;
    await AsyncStorage.setItem('orders', JSON.stringify(updated));
  }, []);

  const saveShifts = useCallback(async (updated: Shift[]) => {
    setShifts(updated);
    shiftsRef.current = updated;
    await AsyncStorage.setItem('shifts', JSON.stringify(updated));
  }, []);

  // ── Background sync (runs when online, retries every 60 s) ────────────────
  const syncPending = useCallback(async () => {
    if (!isOnline || !gasUrl || !user) return;

    /* ---- ORDERS ---- */
    let ordersList = [...ordersRef.current];
    let ordersChanged = false;

    // Phase 1: send creates for any non-cancelled unsynced orders
    for (const order of ordersList.filter((o) => !o.isSynced && !o.isCancelled)) {
      try {
        const data = await gasPost(gasUrl, { action: 'addOrder', order });
        if (data.success) {
          const idx = ordersList.findIndex((o) => o.id === order.id);
          if (idx >= 0) {
            ordersList[idx] = { ...ordersList[idx], isSynced: true, serverCreated: true };
            ordersChanged = true;
          }
        }
      } catch { /* retry next tick */ }
    }

    // Phase 2: send cancelled orders (handle cancel-before-sync race)
    for (const order of ordersList.filter((o) => o.isCancelled && !o.isSynced)) {
      try {
        // If the order was never sent to the server, we must create it first
        if (!order.serverCreated) {
          await gasPost(gasUrl, { action: 'addOrder', order: { ...order, isCancelled: false } });
        }
        const data = await gasPost(gasUrl, { action: 'cancelOrder', orderId: order.id });
        if (data.success) {
          const idx = ordersList.findIndex((o) => o.id === order.id);
          if (idx >= 0) {
            ordersList[idx] = { ...ordersList[idx], isSynced: true, serverCreated: true };
            ordersChanged = true;
          }
        }
      } catch { /* retry next tick */ }
    }

    if (ordersChanged) await saveOrders(ordersList);

    /* ---- SHIFTS ---- */
    let shiftsList = [...shiftsRef.current];
    let shiftsChanged = false;

    for (const shift of shiftsList.filter((s) => !s.isSynced && s.userId === user.id)) {
      try {
        if (shift.isActive) {
          // Unsynced start-shift
          const data = await gasPost(gasUrl, { action: 'startShift', shift });
          if (data.success) {
            const idx = shiftsList.findIndex((s) => s.id === shift.id);
            if (idx >= 0) { shiftsList[idx] = { ...shiftsList[idx], isSynced: true }; shiftsChanged = true; }
          }
        } else {
          // Ended offline — we may need to start+end it on the server
          // Try to create the shift first (in case it was also never started online)
          await gasPost(gasUrl, { action: 'startShift', shift: { ...shift, isActive: true } });
          const data = await gasPost(gasUrl, { action: 'endShift', userId: user.id });
          if (data.success) {
            const idx = shiftsList.findIndex((s) => s.id === shift.id);
            if (idx >= 0) { shiftsList[idx] = { ...shiftsList[idx], isSynced: true }; shiftsChanged = true; }
          }
        }
      } catch { /* retry next tick */ }
    }

    if (shiftsChanged) await saveShifts(shiftsList);
  }, [isOnline, gasUrl, user, saveOrders, saveShifts]);

  // Trigger sync on online/credentials change AND on a 60-second heartbeat
  useEffect(() => {
    if (!isOnline || !gasUrl || !user) return;
    syncPending();
    const handle = setInterval(syncPending, 60_000);
    return () => clearInterval(handle);
  }, [isOnline, gasUrl, user, syncPending]);

  // ── addOrder ──────────────────────────────────────────────────────────────
  const addOrder = useCallback(
    async (
      data: Omit<Order, 'id' | 'userId' | 'userName' | 'timestamp' | 'isCancelled' | 'isSynced' | 'serverCreated'>,
    ): Promise<Order> => {
      const newOrder: Order = {
        ...data,
        id: genId(),
        userId: user?.id ?? '',
        userName: user?.name ?? '',
        timestamp: new Date().toISOString(),
        isCancelled: false,
        isSynced: false,
        serverCreated: false,
      };

      const updated = [newOrder, ...ordersRef.current];
      await saveOrders(updated);

      if (isOnline && gasUrl) {
        try {
          const res = await gasPost(gasUrl, { action: 'addOrder', order: newOrder });
          if (res.success) {
            const synced = ordersRef.current.map((o) =>
              o.id === newOrder.id ? { ...o, isSynced: true, serverCreated: true } : o,
            );
            await saveOrders(synced);
            return { ...newOrder, isSynced: true, serverCreated: true };
          }
        } catch { /* Background sync will retry */ }
      }
      return newOrder;
    },
    [user, isOnline, gasUrl, saveOrders],
  );

  // ── cancelOrder ───────────────────────────────────────────────────────────
  const cancelOrder = useCallback(
    async (id: string) => {
      const target = ordersRef.current.find((o) => o.id === id);
      const wasServerCreated = target?.serverCreated ?? target?.isSynced ?? false;

      const updated = ordersRef.current.map((o) =>
        o.id === id ? { ...o, isCancelled: true, isSynced: false } : o,
      );
      await saveOrders(updated);

      if (isOnline && gasUrl) {
        try {
          // Ensure order exists on server before cancelling
          if (!wasServerCreated && target) {
            await gasPost(gasUrl, { action: 'addOrder', order: { ...target, isCancelled: false } });
          }
          const res = await gasPost(gasUrl, { action: 'cancelOrder', orderId: id });
          if (res.success) {
            const synced = ordersRef.current.map((o) =>
              o.id === id ? { ...o, isSynced: true, serverCreated: true } : o,
            );
            await saveOrders(synced);
          }
        } catch { /* Background sync will retry */ }
      }
    },
    [isOnline, gasUrl, saveOrders],
  );

  // ── startShift ────────────────────────────────────────────────────────────
  const startShift = useCallback(async () => {
    if (!user) return;
    const shift: Shift = {
      id: genId(),
      userId: user.id,
      userName: user.name,
      startTime: new Date().toISOString(),
      isActive: true,
      isSynced: false,
    };
    const updated = [shift, ...shiftsRef.current];
    await saveShifts(updated);
    setIsWorking(true);

    if (isOnline && gasUrl) {
      try {
        const res = await gasPost(gasUrl, { action: 'startShift', shift });
        if (res.success) {
          const synced = shiftsRef.current.map((s) =>
            s.id === shift.id ? { ...s, isSynced: true } : s,
          );
          await saveShifts(synced);
        }
      } catch { /* Background sync will retry */ }
    }
  }, [user, isOnline, gasUrl, saveShifts]);

  // ── endShift ──────────────────────────────────────────────────────────────
  const endShift = useCallback(async () => {
    if (!user) return;
    // Mark the active shift as ended and unsynced so background sync sends endShift
    const updated = shiftsRef.current.map((s) =>
      s.userId === user.id && s.isActive ? { ...s, isActive: false, isSynced: false } : s,
    );
    await saveShifts(updated);
    setIsWorking(false);

    if (isOnline && gasUrl) {
      try {
        await gasPost(gasUrl, { action: 'endShift', userId: user.id });
        const synced = shiftsRef.current.map((s) =>
          s.userId === user.id && !s.isActive ? { ...s, isSynced: true } : s,
        );
        await saveShifts(synced);
      } catch { /* Background sync will retry */ }
    }
  }, [user, isOnline, gasUrl, saveShifts]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (o) => o.userId === user?.id && new Date(o.timestamp).toDateString() === today,
  );

  return (
    <OrdersContext.Provider
      value={{ orders, shifts, isWorking, todayOrders, addOrder, cancelOrder, startShift, endShift }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be within OrdersProvider');
  return ctx;
}
