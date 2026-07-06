/** OpenStreetMap link for twin feed GPS coordinates. */

export function twinFeedMapUrl(latitude: number | null, longitude: number | null): string | null {
  if (latitude == null || longitude == null) return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const lat = latitude.toFixed(5);
  const lon = longitude.toFixed(5);
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`;
}

export function twinFeedMapLabel(latitude: number | null, longitude: number | null): string {
  if (latitude == null || longitude == null) return 'GPS indisponibil';
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}