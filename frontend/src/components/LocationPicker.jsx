import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = L.divIcon({
  className: "",
  html: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="48"
      viewBox="0 0 40 48"
      aria-hidden="true"
      style="filter:drop-shadow(0 3px 3px rgba(0,0,0,.3))"
    >
      <path
        d="M20 2C10.6 2 3 9.6 3 19c0 12 17 27 17 27s17-15 17-27C37 9.6 29.4 2 20 2Z"
        fill="#EA4335"
        stroke="#FFFFFF"
        stroke-width="2"
      />
      <circle cx="20" cy="19" r="6" fill="#B3261E" />
    </svg>
  `,
  iconSize: [40, 48],
  iconAnchor: [20, 46],
  popupAnchor: [0, -42],
});

function LocationPicker({
  latitude,
  longitude,
  onSelect,
  disabled = false,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    onSelectRef.current = onSelect;
    disabledRef.current = disabled;
  }, [onSelect, disabled]);

  useEffect(() => {
    const map = L.map(containerRef.current, {
      center: [22.5, 79],
      zoom: 5,
      scrollWheelZoom: false,
    });

    mapRef.current = map;

    L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(map);

    map.on("click", (event) => {
      if (disabledRef.current) return;

      onSelectRef.current({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
      });
    });

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const hasCoordinates =
      Number.isFinite(latitude) &&
      Number.isFinite(longitude);

    if (!hasCoordinates) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    const point = [latitude, longitude];

    if (!markerRef.current) {
      const marker = L.marker(point, {
        icon: markerIcon,
        draggable: !disabledRef.current,
        title: "Problem location — drag to adjust",
      }).addTo(map);

      marker.on("dragend", () => {
        if (disabledRef.current) return;

        const position = marker.getLatLng();

        onSelectRef.current({
          latitude: Number(position.lat.toFixed(6)),
          longitude: Number(position.lng.toFixed(6)),
        });
      });

      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng(point);
    }

    map.setView(point, Math.max(map.getZoom(), 16), {
      animate: false,
    });
  }, [latitude, longitude]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    if (disabled) {
      marker.dragging.disable();
    } else {
      marker.dragging.enable();
    }
  }, [disabled, latitude, longitude]);

  return (
    <div>
      <div
        ref={containerRef}
        aria-label="Problem location map"
        className="relative z-0 h-80 w-full rounded-2xl border border-slate-200 md:h-96"
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          const center = mapRef.current?.getCenter();
          if (!center) return;

          onSelect({
            latitude: Number(center.lat.toFixed(6)),
            longitude: Number(center.lng.toFixed(6)),
          });
        }}
        className="mt-3 rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
      >
        Use map centre
      </button>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        Click the map or drag the blue marker to the problem site.
        You can also move the map and choose “Use map centre”.
      </p>
    </div>
  );
}

export default LocationPicker;