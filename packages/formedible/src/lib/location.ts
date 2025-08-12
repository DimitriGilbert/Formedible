import type {
  LocationSearchResult,
  LocationValue,
} from "@/lib/formedible/types";

export const builtInProviders = {
  nominatim: async (
    query: string,
    options: any = {}
  ): Promise<LocationSearchResult[]> => {
    const endpoint =
      options.endpoint || "https://nominatim.openstreetmap.org/search";
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: String(options.limit || 5),
      addressdetails: "1",
      ...options.searchOptions,
    });

    try {
      const response = await fetch(`${endpoint}?${params}`);
      const data = await response.json();

      return data.map((item: any, index: number) => ({
        id: item.place_id || index,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        address: item.display_name,
        city: item.address?.city || item.address?.town || item.address?.village,
        state: item.address?.state,
        country: item.address?.country,
        postalCode: item.address?.postcode,
        relevance: parseFloat(item.importance || 0),
        bounds: item.boundingbox
          ? {
              northeast: {
                lat: parseFloat(item.boundingbox[1]),
                lng: parseFloat(item.boundingbox[3]),
              },
              southwest: {
                lat: parseFloat(item.boundingbox[0]),
                lng: parseFloat(item.boundingbox[2]),
              },
            }
          : undefined,
      }));
    } catch (error) {
      console.error("Nominatim search error:", error);
      return [];
    }
  },

  nominatimReverse: async (
    lat: number,
    lng: number,
    options: any = {}
  ): Promise<LocationValue> => {
    const endpoint =
      options.endpoint || "https://nominatim.openstreetmap.org/reverse";
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: "json",
      addressdetails: "1",
      ...options.searchOptions,
    });

    try {
      const response = await fetch(`${endpoint}?${params}`);
      const data = await response.json();

      return {
        lat,
        lng,
        address: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village,
        state: data.address?.state,
        country: data.address?.country,
        postalCode: data.address?.postcode,
      };
    } catch (error) {
      console.error("Nominatim reverse geocoding error:", error);
      return { lat, lng, address: `${lat}, ${lng}` };
    }
  },
};

export function formatCoordinates(
  lat: number,
  lng: number,
  format: "decimal" | "dms" = "decimal"
): string {
  if (format === "decimal") {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } else {
    const latDeg = Math.floor(Math.abs(lat));
    const latMin = Math.floor((Math.abs(lat) - latDeg) * 60);
    const latSec = ((Math.abs(lat) - latDeg) * 60 - latMin) * 60;
    const latDir = lat >= 0 ? "N" : "S";

    const lngDeg = Math.floor(Math.abs(lng));
    const lngMin = Math.floor((Math.abs(lng) - lngDeg) * 60);
    const lngSec = ((Math.abs(lng) - lngDeg) * 60 - lngMin) * 60;
    const lngDir = lng >= 0 ? "E" : "W";

    return `${latDeg}°${latMin}'${latSec.toFixed(
      2
    )}"${latDir} ${lngDeg}°${lngMin}'${lngSec.toFixed(2)}"${lngDir}`;
  }
}

export const defaultMapRenderer = (params: {
  location: LocationValue | null;
  onLocationSelect: (location: LocationValue) => void;
  mapContainer: HTMLDivElement;
  zoom: number;
  readonly: boolean;
  defaultLocation?: { lat: number; lng: number };
}) => {
  const {
    location,
    onLocationSelect,
    mapContainer,
    zoom,
    readonly,
    defaultLocation,
  } = params;

  const leafletMap = (window as any).L.map(mapContainer, {
    center: [
      location?.lat || defaultLocation?.lat || 51.5074,
      location?.lng || defaultLocation?.lng || -0.1278,
    ],
    zoom: zoom || 10,
    zoomControl: true,
    dragging: !readonly,
    touchZoom: !readonly,
    scrollWheelZoom: !readonly,
    doubleClickZoom: !readonly,
    boxZoom: !readonly,
    keyboard: !readonly,
    tap: !readonly,
  });

  const osmTileLayer = (window as any).L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }
  );

  osmTileLayer.addTo(leafletMap);

  let currentMarker: any = null;

  const updateMarker = (loc: LocationValue | null) => {
    if (currentMarker) {
      leafletMap.removeLayer(currentMarker);
      currentMarker = null;
    }

    if (loc) {
      const customIcon = (window as any).L.divIcon({
        className: "custom-div-icon",
        html: `
          <div style="
            background-color: #ef4444;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            white-space: nowrap;
            position: relative;
            margin-bottom: 8px;
          ">
            📍 ${loc.address || `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`}
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 8px solid #ef4444;
            margin: 0 auto;
            margin-top: -4px;
          "></div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      currentMarker = (window as any).L.marker([loc.lat, loc.lng], {
        icon: customIcon,
      });
      currentMarker.addTo(leafletMap);

      leafletMap.setView([loc.lat, loc.lng], leafletMap.getZoom());
    }
  };

  if (!readonly) {
    leafletMap.on("click", (e: any) => {
      const { lat, lng } = e.latlng;

      onLocationSelect({
        lat: lat,
        lng: lng,
        address: `Map Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      });
    });
  }

  updateMarker(location);

  return {
    updateMarker,
    destroy: () => {
      leafletMap.remove();
    },
    setTileLayer: (tileConfig: {
      url: string;
      attribution: string;
      maxZoom?: number;
    }) => {
      const newTileLayer = (window as any).L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: tileConfig.maxZoom || 18,
      });

      newTileLayer.addTo(leafletMap);
    },
  };
};