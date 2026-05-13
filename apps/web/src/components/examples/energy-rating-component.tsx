"use client";
import React from 'react';
import { cn } from '@/lib/utils';

export type ColorScheme = 'dpe' | 'ges';

interface EnergyRatingComponentProps {
  displayValue: string | number;
  isActive: boolean;
  colorScheme?: ColorScheme;
}

export const EnergyRatingComponent: React.FC<EnergyRatingComponentProps> = ({
  displayValue,
  isActive,
  colorScheme = 'dpe',
}) => {
  // Color mapping for each DPE rating
  const getColorClassesDpe = (rating: string | number) => {
    const ratingStr = rating.toString().toUpperCase();
    switch (ratingStr) {
      case 'A':
        return {
          bg: 'bg-green-500',
          text: 'text-white',
          border: 'border-green-600',
        };
      case 'B':
        return {
          bg: 'bg-lime-500',
          text: 'text-white',
          border: 'border-lime-600',
        };
      case 'C':
        return {
          bg: 'bg-yellow-500',
          text: 'text-white',
          border: 'border-yellow-600',
        };
      case 'D':
        return {
          bg: 'bg-orange-500',
          text: 'text-white',
          border: 'border-orange-600',
        };
      case 'E':
        return {
          bg: 'bg-red-500',
          text: 'text-white',
          border: 'border-red-600',
        };
      case 'F':
        return {
          bg: 'bg-red-700',
          text: 'text-white',
          border: 'border-red-800',
        };
      case 'G':
        return {
          bg: 'bg-red-900',
          text: 'text-white',
          border: 'border-red-950',
        };
      default:
        return {
          bg: 'bg-gray-500',
          text: 'text-white',
          border: 'border-gray-600',
        };
    }
  };

  // Color mapping for each GES rating
  const getColorClassesGes = (rating: string | number) => {
    const ratingStr = rating.toString().toUpperCase();
    switch (ratingStr) {
      case 'A':
        return {
          bg: 'bg-purple-200',
          text: 'text-black',
          border: 'border-purple-200',
        };
      case 'B':
        return {
          bg: 'bg-purple-300',
          text: 'text-black',
          border: 'border-purple-300',
        };
      case 'C':
        return {
          bg: 'bg-purple-400',
          text: 'text-black',
          border: 'border-purple-400',
        };
      case 'D':
        return {
          bg: 'bg-purple-500',
          text: 'text-white',
          border: 'border-purple-500',
        };
      case 'E':
        return {
          bg: 'bg-purple-600',
          text: 'text-white',
          border: 'border-purple-600',
        };
      case 'F':
        return {
          bg: 'bg-purple-700',
          text: 'text-white',
          border: 'border-purple-700',
        };
      case 'G':
        return {
          bg: 'bg-purple-900',
          text: 'text-white',
          border: 'border-purple-900',
        };
      default:
        return {
          bg: 'bg-gray-500',
          text: 'text-white',
          border: 'border-gray-600',
        };
    }
  };

  const colors = colorScheme === 'ges'
    ? getColorClassesGes(displayValue)
    : getColorClassesDpe(displayValue);

  const rating = displayValue.toString().toUpperCase();

  // Get energy efficiency description
  const getDescription = (rating: string) => {
    switch (rating) {
      case 'A':
        return 'Excellent';
      case 'B':
        return 'Très bien';
      case 'C':
        return 'Bien';
      case 'D':
        return 'Moyen';
      case 'E':
        return 'Médiocre';
      case 'F':
        return 'Mauvais';
      case 'G':
        return 'Très mauvais';
      default:
        return '';
    }
  };

  // Get energy consumption range
  const getEnergyRange = (rating: string) => {
    if (colorScheme === 'ges') {
      // GES ranges in kg CO2/m²/an
      switch (rating) {
        case 'A':
          return '≤ 5';
        case 'B':
          return '6-10';
        case 'C':
          return '11-20';
        case 'D':
          return '21-35';
        case 'E':
          return '36-55';
        case 'F':
          return '56-80';
        case 'G':
          return '> 80';
        default:
          return '';
      }
    } else {
      // DPE ranges in kWh/m²/an
      switch (rating) {
        case 'A':
          return '≤ 50';
        case 'B':
          return '51-90';
        case 'C':
          return '91-150';
        case 'D':
          return '151-230';
        case 'E':
          return '231-330';
        case 'F':
          return '331-420';
        case 'G':
          return '> 420';
        default:
          return '';
      }
    }
  };

  const getUnit = () => {
    return colorScheme === 'ges' ? 'KGeqCO2/m²/an' : 'kWh/m²/an';
  };

  return (
    <div className="flex flex-col items-center space-y-2 transition-all duration-300">
      {/* Energy rating badge */}
      <div
        className={cn(
          'relative flex items-center justify-center',
          'w-12 h-12 rounded-lg border-2 font-bold text-lg',
          'transition-all duration-300 transform',
          colors.bg,
          colors.text,
          colors.border,
          isActive ? [
            'scale-125',
            'ring-2 ring-white ring-opacity-60',
            'z-10'
          ] : [
            'scale-100 hover:scale-110',
          ]
        )}
      >
        {/* Animated background pulse when active */}
        {isActive && (
          <div
            className={cn(
              'absolute inset-0 rounded-lg animate-pulse',
              colors.bg,
              'opacity-20'
            )}
          />
        )}

        {/* Energy icon */}
        <div className="absolute -top-1 -right-1">
          {rating === 'A' ? (
            <div className="w-5 h-5">🤩</div>
          ) : rating === 'B' ? (
            <div className="w-5 h-5">😁</div>
          ) : rating === 'C' ? (
            <div className="w-5 h-5">😅</div>
          ) : rating === 'F' ? (
            <div className="w-5 h-5">😨</div>
          ) : rating === 'G' ? (
            <div className="w-5 h-5">😰</div>
          ) : null}
        </div>

        {rating}
      </div>

      {/* Description and energy range */}
      <div
        className={cn(
          'text-center transition-all duration-300',
          isActive ? 'opacity-100 transform translate-y-0' : 'opacity-60 transform translate-y-1'
        )}
      >
        <div className={cn(
          'text-xs font-medium',
          isActive ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {getDescription(rating)}
        </div>
        {isActive && (
          <div className="text-xs text-muted-foreground mt-1">
            {getEnergyRange(rating)} {getUnit()}
          </div>
        )}
      </div>
    </div>
  );
};