import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Protein, Recipe, SideType } from '../types';

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
  | 'check'
  // UI chrome
  | 'cart'
  | 'dice'
  | 'lock'
  | 'unlock'
  | 'swap'
  | 'ban'
  | 'pot'
  | 'refresh'
  | 'close'
  | 'list'
  | 'play'
  | 'alert'
  | 'key'
  | 'plus'
  | 'minus'
  // food categories (recipe tiles)
  | 'drumstick'
  | 'steak'
  | 'fish'
  | 'apple'
  | 'bread'
  | 'bowl'
  | 'cheese';

// Map a recipe to its category icon (mains by protein, sides by type).
export function recipeIconName(recipe: Recipe): IconName {
  if (recipe.role === 'side') return sideIcon(recipe.sideType);
  return proteinIcon(recipe.protein);
}
function proteinIcon(p?: Protein): IconName {
  switch (p) {
    case 'chicken': return 'drumstick';
    case 'beef': return 'steak';
    case 'pork': return 'steak';
    case 'fish': return 'fish';
    case 'seafood': return 'fish';
    default: return 'sprout';
  }
}
function sideIcon(t?: SideType): IconName {
  switch (t) {
    case 'fruit': return 'apple';
    case 'bread': return 'bread';
    case 'starch': return 'bowl';
    case 'dairy': return 'cheese';
    case 'salad': return 'leaf';
    default: return 'leaf';
  }
}

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
    case 'cart':
      return (
        <>
          <Circle {...s} cx={9} cy={20} r={1.4} />
          <Circle {...s} cx={17} cy={20} r={1.4} />
          <Path {...s} d="M3 4h2l2.1 10.5a1.5 1.5 0 0 0 1.5 1.2h7.6a1.5 1.5 0 0 0 1.5-1.2L20.5 8H6" />
        </>
      );
    case 'dice':
      return (
        <>
          <Rect {...s} x={4} y={4} width={16} height={16} rx={3.5} />
          <Circle cx={9} cy={9} r={1.1} fill={color} />
          <Circle cx={15} cy={15} r={1.1} fill={color} />
          <Circle cx={15} cy={9} r={1.1} fill={color} />
          <Circle cx={9} cy={15} r={1.1} fill={color} />
        </>
      );
    case 'lock':
      return (
        <>
          <Rect {...s} x={5} y={10.5} width={14} height={9.5} rx={2.2} />
          <Path {...s} d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
        </>
      );
    case 'unlock':
      return (
        <>
          <Rect {...s} x={5} y={10.5} width={14} height={9.5} rx={2.2} />
          <Path {...s} d="M8 10.5V8a4 4 0 0 1 7.6-1.8" />
        </>
      );
    case 'swap':
      return (
        <>
          <Path {...s} d="M4 8h13l-3.5-3.5M4 8l3.5 3.5" />
          <Path {...s} d="M20 16H7l3.5-3.5M20 16l-3.5 3.5" />
        </>
      );
    case 'ban':
      return (
        <>
          <Circle {...s} cx={12} cy={12} r={8.5} />
          <Path {...s} d="M6.2 6.2l11.6 11.6" />
        </>
      );
    case 'pot':
      return (
        <>
          <Path {...s} d="M3.5 9.5h17V15a4.5 4.5 0 0 1-4.5 4.5H8A4.5 4.5 0 0 1 3.5 15z" />
          <Path {...s} d="M2 9.5h20" />
          <Path {...s} d="M9 6c0 1 .6 1.5.6 2.6M15 6c0 1-.6 1.5-.6 2.6" />
        </>
      );
    case 'refresh':
      return (
        <>
          <Path {...s} d="M20 11a8 8 0 0 0-13.7-4.5L3.5 9" />
          <Path {...s} d="M4 13a8 8 0 0 0 13.7 4.5L20.5 15" />
          <Path {...s} d="M3.5 5v4h4M20.5 19v-4h-4" />
        </>
      );
    case 'close':
      return <Path {...s} d="M6 6l12 12M18 6L6 18" />;
    case 'list':
      return (
        <>
          <Path {...s} d="M8.5 6h11.5M8.5 12h11.5M8.5 18h11.5" />
          <Circle cx={4.5} cy={6} r={1} fill={color} />
          <Circle cx={4.5} cy={12} r={1} fill={color} />
          <Circle cx={4.5} cy={18} r={1} fill={color} />
        </>
      );
    case 'play':
      return <Path d="M7 4.5l13 7.5-13 7.5z" fill={color} stroke={color} strokeWidth={1.5} strokeLinejoin="round" />;
    case 'alert':
      return (
        <>
          <Path {...s} d="M12 4L2.8 20h18.4z" />
          <Path {...s} d="M12 10v4" />
          <Circle cx={12} cy={17.3} r={0.9} fill={color} />
        </>
      );
    case 'key':
      return (
        <>
          <Circle {...s} cx={8} cy={15} r={4} />
          <Path {...s} d="M10.9 12.1l8-8M17 6l2 2M14 9l2 2" />
        </>
      );
    case 'plus':
      return <Path {...s} strokeWidth={2.2} d="M12 5v14M5 12h14" />;
    case 'minus':
      return <Path {...s} strokeWidth={2.2} d="M5 12h14" />;
    case 'drumstick':
      // Filled silhouette: a meaty bulb narrowing to a forked bone (two knobs).
      return (
        <Path
          fill={color}
          d="M17.9 6.1a6 6 0 0 0-9.6 7l-3.1 3.1a1.6 1.6 0 0 0-.4.7l-.5 1.7a1.15 1.15 0 1 0 1.4 1.4l1.7-.5c.27-.08.5-.22.7-.4l3.1-3.1a6 6 0 0 0 7-9.6 6 6 0 0 0-.2-.1z"
        />
      );
    case 'steak':
      return (
        <>
          <Path {...s} d="M4 12.5a7 5 0 0 1 12.5-3 3 3 0 0 1 0 6 7 5 0 0 1-12.5-3z" />
          <Circle {...s} cx={16.5} cy={12.5} r={1.6} />
        </>
      );
    case 'fish':
      return (
        <>
          <Path {...s} d="M3.5 12c3.5-4.5 10.5-4.5 14 0-3.5 4.5-10.5 4.5-14 0z" />
          <Path {...s} d="M17.5 12l3.5-3v6z" />
          <Circle cx={8} cy={10.8} r={0.9} fill={color} />
        </>
      );
    case 'apple':
      return (
        <>
          <Path {...s} d="M12 8.5c-2.2-2-6.5-.8-6.5 4 0 3.7 2.8 7 4.8 7 .8 0 1.2-.4 1.7-.4s.9.4 1.7.4c2 0 4.8-3.3 4.8-7 0-4.8-4.3-6-6.5-4z" />
          <Path {...s} d="M12 8.5c0-1.8 1-3 2.6-3.4" />
        </>
      );
    case 'bread':
      return (
        <>
          <Path {...s} d="M5 11a4.5 3.5 0 0 1 14 0v6.5a1.2 1.2 0 0 1-1.2 1.2H6.2A1.2 1.2 0 0 1 5 17.5z" />
          <Path {...s} d="M9 11v7.5" />
        </>
      );
    case 'bowl':
      return (
        <>
          <Path {...s} d="M3.5 11.5h17a8.5 8 0 0 1-17 0z" />
          <Path {...s} d="M8 11.5c0-3.5 8-3.5 8 0" />
        </>
      );
    case 'cheese':
      return (
        <>
          <Path {...s} d="M4 12l14-6 2.5 6z" />
          <Path {...s} d="M4 12v3.5h16.5V12" />
          <Circle cx={9} cy={13.5} r={0.8} fill={color} />
          <Circle cx={14} cy={14} r={0.8} fill={color} />
        </>
      );
  }
}
