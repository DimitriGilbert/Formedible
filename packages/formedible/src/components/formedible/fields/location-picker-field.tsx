import { MapPin, Navigation, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { FieldWrapper } from '@/components/formedible/fields/field-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { FormedibleFieldRenderProps, FormedibleFormValues, FormedibleLocationValue } from '@/lib/formedible/types';
import { cn } from '@/lib/utils';

export function LocationPickerField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const config = fieldConfig.locationConfig;
  const value = isLocationValue(field.value) ? field.value : null;
  const draft = isLocationDraftValue(field.value) ? field.value : {};
  const query = value ? value.address ?? `${value.lat}, ${value.lng}` : draft.query ?? '';
  const manualLat = draft.manualLat ?? '';
  const manualLng = draft.manualLng ?? '';
  const [results, setResults] = useState<readonly FormedibleLocationValue[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const enableSearch = config?.enableSearch ?? true;
  const enableGeolocation = config?.enableGeolocation ?? true;
  const enableManualEntry = config?.enableManualEntry ?? true;
  const searchOptions = config?.searchOptions;
  const minQueryLength = searchOptions?.minQueryLength ?? 2;
  const maxResults = searchOptions?.maxResults ?? 5;

  useEffect(() => {
    if (typeof window === 'undefined' || !enableSearch || query.length < minQueryLength || !config?.searchCallback) {
      setResults([]);
      return;
    }

    let isActive = true;
    const timeout = window.setTimeout(() => {
      Promise.resolve(config.searchCallback?.(query, { limit: maxResults }) ?? [])
        .then((nextResults) => {
          if (isActive) {
            setResults(nextResults);
            setShowResults(true);
          }
        })
        .catch(() => {
          if (isActive) {
            setError('Search failed. Please try again.');
          }
        });
    }, searchOptions?.debounceMs ?? 300);

    return () => {
      isActive = false;
      window.clearTimeout(timeout);
    };
  }, [config, enableSearch, maxResults, minQueryLength, query, searchOptions?.debounceMs]);

  async function selectLocation(location: FormedibleLocationValue) {
    let nextLocation = location;
    if (!nextLocation.address && config?.reverseGeocodeCallback) {
      try {
        nextLocation = await config.reverseGeocodeCallback(nextLocation.lat, nextLocation.lng);
      } catch {
        nextLocation = { ...nextLocation, address: `${nextLocation.lat}, ${nextLocation.lng}` };
      }
    }

    field.onChange(nextLocation);
    setShowResults(false);
    setError(undefined);
    field.onBlur();
  }

  function updateDraft(nextDraft: FormedibleLocationDraftValue) {
    field.onChange({ ...draft, ...nextDraft });
  }

  function useCurrentLocation() {
    if (!enableGeolocation || typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        selectLocation({ lat: position.coords.latitude, lng: position.coords.longitude, address: 'Current Location' });
      },
      () => setError('Failed to get location'),
    );
  }

  function submitManualLocation() {
    const lat = Number.parseFloat(manualLat);
    const lng = Number.parseFloat(manualLng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError('Invalid coordinates. Please enter valid numbers.');
      return;
    }

    selectLocation({ lat, lng, address: `${lat}, ${lng}` });
  }

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <div className="space-y-3">
        {enableSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={field.id}
              name={field.name}
              value={query}
              placeholder={fieldConfig.placeholder ?? config?.searchPlaceholder ?? 'Search for an address or place...'}
              disabled={fieldConfig.disabled}
              className={cn('pl-9 pr-9', fieldConfig.inputClassName)}
              onBlur={field.onBlur}
              onFocus={() => setShowResults(results.length > 0)}
              onChange={(event) => updateDraft({ query: event.target.value })}
            />
            {query && (
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground" onClick={() => updateDraft({ query: '' })}>
                <X className="size-4" />
              </Button>
            )}
            {showResults && results.length > 0 && (
              <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
                {results.map((result) => (
                  <Button key={`${result.lat}-${result.lng}-${result.address ?? ''}`} type="button" variant="ghost" className="h-auto w-full justify-start rounded-sm px-3 py-2 text-left text-sm" onMouseDown={() => selectLocation(result)}>
                    <span className="font-medium">{result.address ?? `${result.lat}, ${result.lng}`}</span>
                    <span className="block text-xs text-muted-foreground">{result.lat}, {result.lng}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {enableGeolocation && (
            <Button variant="outline" disabled={fieldConfig.disabled} onClick={useCurrentLocation}>
              <Navigation className="size-4" />
              Current location
            </Button>
          )}
          {value && (
            <Button variant="ghost" disabled={fieldConfig.disabled} onClick={() => field.onChange(null)}>
              Clear location
            </Button>
          )}
        </div>
        {enableManualEntry && (
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <Input value={manualLat} placeholder="Latitude" disabled={fieldConfig.disabled} onChange={(event) => updateDraft({ manualLat: event.target.value })} />
            <Input value={manualLng} placeholder="Longitude" disabled={fieldConfig.disabled} onChange={(event) => updateDraft({ manualLng: event.target.value })} />
            <Button variant="outline" disabled={fieldConfig.disabled} onClick={submitManualLocation}>Use coordinates</Button>
          </div>
        )}
        {value && (
          <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-sm">
            <MapPin className="mt-0.5 size-4 text-primary" />
            <div>
              <div>{value.address ?? 'Selected location'}</div>
              <div className="text-xs text-muted-foreground">{value.lat}, {value.lng}</div>
            </div>
          </div>
        )}
        {error && <div className="text-sm text-destructive">{error}</div>}
      </div>
    </FieldWrapper>
  );
}

interface FormedibleLocationDraftValue {
  readonly query?: string;
  readonly manualLat?: string;
  readonly manualLng?: string;
}

function isLocationValue(value: unknown): value is FormedibleLocationValue {
  return typeof value === 'object' && value !== null && 'lat' in value && 'lng' in value;
}

function isLocationDraftValue(value: unknown): value is FormedibleLocationDraftValue {
  return typeof value === 'object' && value !== null && !isLocationValue(value);
}
