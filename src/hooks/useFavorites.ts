import { Storage } from "@apps-in-toss/framework";
import { useCallback, useEffect, useState } from "react";
import type { StationItem } from "./useStationSearch";

export type FavoriteStation =
  | {
      id: string; // `bus-${arsId}`
      type: "bus";
      arsId: string;
      stNm: string;
      createdAt: number;
    }
  | {
      id: string; // `subway-${subwayId}-${statnNm}`
      type: "subway";
      subwayId: string;
      subwayNm: string;
      statnNm: string;
      createdAt: number;
    };

export type FavoriteStationInput =
  | {
      id: string; // `bus-${arsId}`
      type: "bus";
      arsId: string;
      stNm: string;
    }
  | {
      id: string; // `subway-${subwayId}-${statnNm}`
      type: "subway";
      subwayId: string;
      subwayNm: string;
      statnNm: string;
    };

export const FAVORITES_STORAGE_KEY = "DANGOL_STATION_FAVORITES";

export const getFavoriteId = (
  station:
    | { type: "bus"; arsId: string }
    | { type: "subway"; subwayId?: string; statnNm: string }
    | StationItem
): string => {
  if ("data" in station) {
    if (station.type === "bus") {
      return `bus-${station.data.arsId}`;
    }
    return `subway-${station.data.subwayId}-${station.data.statnNm}`;
  }
  if (station.type === "bus") {
    return `bus-${station.arsId}`;
  }
  return `subway-${station.subwayId ?? ""}-${station.statnNm}`;
};

export const stationItemToFavorite = (
  item: StationItem
): FavoriteStationInput => {
  if (item.type === "bus") {
    return {
      id: `bus-${item.data.arsId}`,
      type: "bus",
      arsId: item.data.arsId,
      stNm: item.data.stNm,
    };
  }
  return {
    id: `subway-${item.data.subwayId}-${item.data.statnNm}`,
    type: "subway",
    subwayId: item.data.subwayId,
    subwayNm: item.data.subwayNm,
    statnNm: item.data.statnNm,
  };
};

let memoryFavorites: FavoriteStation[] = [];
let isInitialized = false;
let initPromise: Promise<void> | null = null;
const listeners = new Set<(favs: FavoriteStation[]) => void>();

async function loadFromStorage() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const raw = await Storage.getItem(FAVORITES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          memoryFavorites = parsed;
        }
      }
    } catch (err) {
      console.warn("Storage.getItem failed:", err);
    } finally {
      isInitialized = true;
      listeners.forEach((l) => l(memoryFavorites));
    }
  })();
  return initPromise;
}

async function saveToStorage(favs: FavoriteStation[]) {
  memoryFavorites = favs;
  listeners.forEach((l) => l(favs));
  try {
    await Storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favs));
  } catch (err) {
    console.warn("Storage.setItem failed:", err);
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteStation[]>(memoryFavorites);
  const [isLoaded, setIsLoaded] = useState(isInitialized);

  useEffect(() => {
    const listener = (favs: FavoriteStation[]) => {
      setFavorites([...favs]);
      setIsLoaded(true);
    };
    listeners.add(listener);

    if (!isInitialized) {
      loadFromStorage().then(() => setIsLoaded(true));
    } else {
      setFavorites([...memoryFavorites]);
      setIsLoaded(true);
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const isFavorite = useCallback(
    (id: string) => memoryFavorites.some((f) => f.id === id),
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (station: FavoriteStationInput) => {
      const exists = memoryFavorites.some((f) => f.id === station.id);
      let next: FavoriteStation[];
      if (exists) {
        next = memoryFavorites.filter((f) => f.id !== station.id);
      } else {
        const newStation = {
          ...station,
          createdAt: Date.now(),
        } as FavoriteStation;
        next = [newStation, ...memoryFavorites];
      }
      await saveToStorage(next);
    },
    []
  );

  const removeFavorite = useCallback(async (id: string) => {
    const next = memoryFavorites.filter((f) => f.id !== id);
    await saveToStorage(next);
  }, []);

  return {
    favorites,
    isLoaded,
    isFavorite,
    toggleFavorite,
    removeFavorite,
  };
}
