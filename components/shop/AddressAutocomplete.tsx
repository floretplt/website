"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

type Props = {
  id?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  apiKey: string | undefined;
  /** Shown when API key is missing (manual entry only) */
  fallbackHint?: string;
  /** Shown under field when autocomplete is active (e.g. Google attribution) */
  hint?: string;
};

/**
 * Approx. bounding box for Poltava Oblast (Полтавська область), WGS84.
 * Covers city of Poltava and the rest of the oblast; excludes other regions.
 */
function poltavaOblastBounds(): google.maps.LatLngBounds {
  return new google.maps.LatLngBounds(
    { lat: 48.98, lng: 32.05 },
    { lat: 51.65, lng: 35.89 },
  );
}

function loadMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src^="https://maps.googleapis.com/maps/api/js"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=uk&v=weekly`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(s);
  });
}

export function AddressAutocomplete({
  id,
  name,
  value,
  onChange,
  onBlur,
  disabled,
  className,
  placeholder,
  apiKey,
  fallbackHint,
  hint,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onChangeRef = useLatest(onChange);

  useEffect(() => {
    if (!apiKey || !inputRef.current) return;
    let cancelled = false;

    loadMapsScript(apiKey)
      .then(() => {
        if (cancelled || !inputRef.current || !window.google?.maps?.places) return;
        const input = inputRef.current;
        const ac = new google.maps.places.Autocomplete(input, {
          types: ["address"],
          componentRestrictions: { country: "ua" },
          bounds: poltavaOblastBounds(),
          strictBounds: true,
          fields: ["formatted_address", "geometry", "name"],
        });
        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          const addr = place.formatted_address ?? place.name;
          if (addr) onChangeRef.current(addr);
        });
        acRef.current = ac;
      })
      .catch(() => {
        /* plain text fallback — no autocomplete */
      });

    return () => {
      cancelled = true;
      acRef.current = null;
    };
  }, [apiKey, onChangeRef]);

  useEffect(() => {
    if (apiKey && inputRef.current) {
      inputRef.current.value = value ?? "";
    }
  }, [apiKey, value]);

  if (!apiKey) {
    return (
      <div className="space-y-1">
        <input
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="street-address"
          className={cn("form-input", className)}
        />
        {fallbackHint ? (
          <p className="form-hint">{fallbackHint}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <input
        id={id}
        name={name}
        ref={inputRef}
        defaultValue={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        className={cn("form-input", className)}
      />
      {hint ? <p className="form-hint mt-1 leading-relaxed">{hint}</p> : null}
    </div>
  );
}
