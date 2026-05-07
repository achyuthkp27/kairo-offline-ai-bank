/**
 * Kairo — Logo Component
 * Geometric wireframe K monogram with gold-to-cyan gradient
 * Represents the fusion of AI intelligence and premium banking
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Path,
  G,
  Rect,
} from 'react-native-svg';

interface KairoLogoProps {
  /** Overall size of the logo mark (width & height) */
  size?: number;
  /** Whether to show the outer glow effect */
  glow?: boolean;
}

/**
 * Geometric wireframe "K" monogram rendered in SVG.
 * The left stroke transitions from gold (#D4AF37) at the top to cyan (#00D4FF) at bottom,
 * while the right diagonal arms do the reverse — creating a luminous crossover effect.
 */
export const KairoLogo: React.FC<KairoLogoProps> = ({
  size = 56,
  glow = true,
}) => {
  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {glow && (
        <View
          style={[
            styles.glow,
            {
              width: size * 1.5,
              height: size * 1.5,
              borderRadius: size * 0.75,
              top: -(size * 0.25),
              left: -(size * 0.25),
            },
          ]}
        />
      )}
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          {/* Gold → Cyan vertical gradient (left spine) */}
          <SvgLinearGradient id="goldToCyan" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#D4AF37" stopOpacity="1" />
            <Stop offset="0.5" stopColor="#7DC9A0" stopOpacity="1" />
            <Stop offset="1" stopColor="#00D4FF" stopOpacity="1" />
          </SvgLinearGradient>
          {/* Cyan → Gold diagonal gradient (right arms) */}
          <SvgLinearGradient id="cyanToGold" x1="1" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#00D4FF" stopOpacity="1" />
            <Stop offset="0.5" stopColor="#7DC9A0" stopOpacity="1" />
            <Stop offset="1" stopColor="#D4AF37" stopOpacity="1" />
          </SvgLinearGradient>
          {/* Background subtle radial-like gradient */}
          <SvgLinearGradient id="bgGrad" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor="#0F0F1A" stopOpacity="1" />
            <Stop offset="1" stopColor="#050510" stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>

        {/* Background rounded rect */}
        <Rect x="0" y="0" width="100" height="100" rx="22" ry="22" fill="url(#bgGrad)" />

        <G>
          {/* Left vertical spine of the K */}
          <Path
            d="M 28 18 L 28 82"
            stroke="url(#goldToCyan)"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Upper diagonal arm — going from center junction out to upper right */}
          <Path
            d="M 28 50 L 72 18"
            stroke="url(#cyanToGold)"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Lower diagonal arm — going from center junction out to lower right */}
          <Path
            d="M 28 50 L 72 82"
            stroke="url(#goldToCyan)"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Inner geometric facets — the circuit/AI neural lines */}
          {/* Upper-left facet */}
          <Path
            d="M 28 30 L 42 38 L 28 46"
            stroke="url(#cyanToGold)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={0.6}
          />

          {/* Upper diagonal sub-line */}
          <Path
            d="M 42 38 L 60 24"
            stroke="url(#cyanToGold)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity={0.5}
          />

          {/* Lower-left facet */}
          <Path
            d="M 28 54 L 42 62 L 28 70"
            stroke="url(#goldToCyan)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={0.6}
          />

          {/* Lower diagonal sub-line */}
          <Path
            d="M 42 62 L 60 76"
            stroke="url(#goldToCyan)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity={0.5}
          />

          {/* Center node — junction highlight */}
          <Path
            d="M 36 47 L 38 50 L 36 53"
            stroke="#00D4FF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={0.8}
          />

          {/* Right edge accent lines — circuit traces */}
          <Path
            d="M 60 24 L 66 20"
            stroke="#00D4FF"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity={0.4}
          />
          <Path
            d="M 60 76 L 66 80"
            stroke="#D4AF37"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity={0.4}
          />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
  },
});
