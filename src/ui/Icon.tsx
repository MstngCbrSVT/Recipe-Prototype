import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'wallet'
  | 'clock'
  | 'leaf'
  | 'sparkle'
  | 'bolt'
  | 'chef'
  | 'box'
  | 'layers'
  | 'utensils'
  | 'user'
  | 'child'
  | 'calendar'
  | 'sprout'
  | 'sliders'
  | 'check';

// Thin-stroke line icons matching the onboarding mock. Single color via `color`;
// a couple of glyphs are filled (sparkle, wallet dot) where that reads cleaner.
export function Icon({
  name,
  size = 22,
  color,
  strokeWidth = 1.75,
}: {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}) {
  const s = {
    stroke: color,
    strokeWidth,
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {glyph(name, s, color)}
    </Svg>
  );
}

type S = ReturnType<() => { stroke: string; strokeWidth: number; fill: string; strokeLinecap: 'round'; strokeLinejoin: 'round' }>;

function glyph(name: IconName, s: S, color: string): React.ReactNode {
  switch (name) {
    case 'wallet':
      return (
        <>
          <Path {...s} d="M4 7.5A2.5 2.5 0 0 1 6.5 5H16v2.5" />
          <Path {...s} d="M4 7.5v9A2.5 2.5 0 0 0 6.5 19h11a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6.5" />
          <Circle cx={16} cy={13} r={1.2} fill={color} />
        </>
      );
    case 'clock':
      return (
        <>
          <Circle {...s} cx={12} cy={12} r={8.5} />
          <Path {...s} d="M12 7.5V12l3.2 2" />
        </>
      );
    case 'leaf':
      return (
        <>
          <Path {...s} d="M20 4C10 4 4.5 9.5 4.5 19c9.5 0 15.5-5.5 15.5-15z" />
          <Path {...s} d="M5 19c3-7 8-11 12.5-12.5" />
        </>
      );
    case 'sparkle':
      return <Path d="M12 3l1.9 5.6L19.5 10l-5.6 1.4L12 17l-1.9-5.6L4.5 10l5.6-1.4z" fill={color} />;
    case 'bolt':
      return <Path {...s} d="M13 2.5 5 13.5h5l-1 8 8.5-11.5H12z" />;
    case 'chef':
      return (
        <Path
          {...s}
          d="M7.5 21h9M8.5 21v-4.5M15.5 21v-4.5M16.5 16.5a3.8 3.8 0 0 0 1-7.5A4.2 4.2 0 0 0 12 5a4.2 4.2 0 0 0-5.5 4 3.8 3.8 0 0 0 1 7.5z"
        />
      );
    case 'box':
      return (
        <>
          <Path {...s} d="M3.5 7.7 12 3.5l8.5 4.2v8.6L12 20.5 3.5 16.3z" />
          <Path {...s} d="M3.5 7.7 12 12l8.5-4.3M12 12v8.5" />
        </>
      );
    case 'layers':
      return (
        <>
          <Path {...s} d="M12 3.5 21 8l-9 4.5L3 8z" />
          <Path {...s} d="M3.5 13 12 17l8.5-4" />
        </>
      );
    case 'utensils':
      return (
        <>
          <Path {...s} d="M7 3v8m0 0a2 2 0 0 0 2-2V3M7 11v10" />
          <Path {...s} d="M17.5 3c-1.6 0-2.5 1.8-2.5 5s1 4 2 4v9" />
        </>
      );
    case 'user':
      return (
        <>
          <Circle {...s} cx={12} cy={8} r={3.6} />
          <Path {...s} d="M5.5 20a6.5 6.5 0 0 1 13 0" />
        </>
      );
    case 'child':
      return (
        <>
          <Circle {...s} cx={12} cy={9.5} r={2.8} />
          <Path {...s} d="M7.5 20a4.5 4.5 0 0 1 9 0" />
        </>
      );
    case 'calendar':
      return (
        <>
          <Rect {...s} x={3.5} y={5} width={17} height={16} rx={2.5} />
          <Path {...s} d="M3.5 9.5h17M8 3v4M16 3v4" />
        </>
      );
    case 'sprout':
      return (
        <>
          <Path {...s} d="M12 21v-7.5" />
          <Path {...s} d="M12 13.5C8.4 13.5 6 11.4 6 7.6c3.6 0 6 2.1 6 5.9z" />
          <Path {...s} d="M12 12.5c0-3.2 2.2-5.4 5.8-5.4 0 3.6-2.4 5.4-5.8 5.4z" />
        </>
      );
    case 'sliders':
      return (
        <>
          <Path {...s} d="M4 8h8M17 8h3M4 16h3M12 16h8" />
          <Circle {...s} cx={14.5} cy={8} r={2.2} />
          <Circle {...s} cx={9.5} cy={16} r={2.2} />
        </>
      );
    case 'check':
      return <Path {...s} strokeWidth={2.4} d="M5 12.5l4.5 4.5L19 7" />;
  }
}
