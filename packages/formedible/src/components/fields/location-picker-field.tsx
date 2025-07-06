"use client";
import React, { useState, useEffect, useRef } from "react";
import { BaseFieldProps } from "@/lib/formedible/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LocationValue {
  lat: number;
  lng: number;
  address?: string;
}

interface LocationPickerFieldProps extends BaseFieldProps {
  locationConfig?: {
    apiKey?: string;
    defaultLocation?: { lat: number; lng: number };
    zoom?: number;
    searchPlaceholder?: string;
    enableSearch?: boolean;
    enableGeolocation?: boolean;
    mapProvider?: 'google' | 'openstreetmap';
  };
}

export const LocationPickerField: React.FC<LocationPickerFieldProps> = ({
  fieldApi,
  label,
  description,
  placeholder,
  wrapperClassName,
  labelClassName,
  inputClassName,
  locationConfig = {},
}) => {
  const {
    defaultLocation = { lat: 40.7128, lng: -74.0060 }, // NYC default
    zoom = 13,
    searchPlaceholder = "Search for a location...",
    enableSearch = true,
    enableGeolocation = true,
    mapProvider = 'openstreetmap'
  } = locationConfig;

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationValue | null>(
    fieldApi.state.value || (defaultLocation ? { ...defaultLocation, address: "Default Location" } : null)
  );
  const mapRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize map (simplified version without external dependencies)
  useEffect(() => {
    if (mapRef.current && currentLocation) {
      // This would integrate with a real map library like Leaflet or Google Maps
      // For now, we'll show a placeholder
      mapRef.current.innerHTML = `
        <div class="w-full h-48 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
          <div class="text-center">
            <div class="text-sm font-medium">Location: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}</div>
            ${currentLocation.address ? `<div class="text-xs mt-1">${currentLocation.address}</div>` : ''}
          </div>
        </div>
      `;
    }
  }, [currentLocation]);

  // Handle search with debouncing
  useEffect(() => {
    if (!enableSearch || !searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Mock search results - in real implementation, this would call a geocoding API
        const mockResults = [
          {
            id: 1,
            address: `${searchQuery} Street, New York, NY`,
            lat: 40.7128 + Math.random() * 0.01,
            lng: -74.0060 + Math.random() * 0.01
          },
          {
            id: 2,
            address: `${searchQuery} Avenue, Brooklyn, NY`,
            lat: 40.6782 + Math.random() * 0.01,
            lng: -73.9442 + Math.random() * 0.01
          }
        ];
        
        setSearchResults(mockResults);
        setShowResults(true);
      } catch (error) {
        console.error('Location search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, enableSearch]);

  const handleLocationSelect = (location: LocationValue) => {
    setCurrentLocation(location);
    fieldApi.handleChange(location);
    setShowResults(false);
    setSearchQuery(location.address || `${location.lat}, ${location.lng}`);
  };

  const handleGetCurrentLocation = () => {
    if (!enableGeolocation || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: LocationValue = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: "Current Location"
        };
        handleLocationSelect(location);
      },
      (error) => {
        console.error('Geolocation error:', error);
      }
    );
  };

  const handleManualCoordinates = () => {
    const coords = window.prompt("Enter coordinates (lat, lng):");
    if (coords) {
      const [lat, lng] = coords.split(',').map(s => parseFloat(s.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        const location: LocationValue = {
          lat,
          lng,
          address: `${lat}, ${lng}`
        };
        handleLocationSelect(location);
      }
    }
  };

  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      {label && (
        <Label htmlFor={fieldApi.name} className={labelClassName}>
          {label}
        </Label>
      )}
      
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <div className="space-y-3">
        {enableSearch && (
          <div className="relative">
            <Input
              id={fieldApi.name}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder || searchPlaceholder}
              className={inputClassName}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
            />
            
            {showResults && searchResults.length > 0 && (
              <Card className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto">
                <div className="p-2">
                  {isSearching && (
                    <div className="text-sm text-muted-foreground p-2">
                      Searching...
                    </div>
                  )}
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      className="w-full text-left p-2 hover:bg-muted rounded-sm text-sm"
                      onClick={() => handleLocationSelect({
                        lat: result.lat,
                        lng: result.lng,
                        address: result.address
                      })}
                    >
                      {result.address}
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {enableGeolocation && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetCurrentLocation}
            >
              Use Current Location
            </Button>
          )}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualCoordinates}
          >
            Enter Coordinates
          </Button>
        </div>

        {/* Map placeholder */}
        <div ref={mapRef} className="w-full h-48 border rounded-md">
          {!currentLocation && (
            <div className="w-full h-full bg-muted rounded-md flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="text-sm">No location selected</div>
                <div className="text-xs mt-1">Search or use current location</div>
              </div>
            </div>
          )}
        </div>

        {currentLocation && (
          <div className="text-sm text-muted-foreground">
            Selected: {currentLocation.address || `${currentLocation.lat}, ${currentLocation.lng}`}
          </div>
        )}
      </div>

      {fieldApi.state.meta.errors && fieldApi.state.meta.errors.length > 0 && (
        <p className="text-sm text-destructive">
          {fieldApi.state.meta.errors[0]}
        </p>
      )}
    </div>
  );
};