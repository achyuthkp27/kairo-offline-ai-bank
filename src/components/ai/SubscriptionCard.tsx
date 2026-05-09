import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Typography, Spacing } from '../../theme';
import { useThemeColors } from '../../hooks/useTheme';
import { Subscription } from '../../services/SubscriptionService';
import { formatCurrency } from '../../utils/formatters';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle
} from 'lucide-react-native';

interface Props {
  subscription: Subscription;
  onSimulateCancel: (sub: Subscription) => void;
}

interface BrandLogoProps {
  size?: number;
  color?: string;
}

const NetflixLogo = ({ size = 32 }: BrandLogoProps) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Path fill="#E50914" d="M8 5h4.2l7.6 16.3V5H24v22h-4.2l-7.6-16.3V27H8z" />
    <Path fill="#B20710" d="M12.2 5h3.4L24 27h-3.5z" opacity="0.9" />
  </Svg>
);

const SpotifyLogo = ({ size = 32 }: BrandLogoProps) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Circle cx="16" cy="16" r="16" fill="#1DB954" />
    <Path d="M9.5 12.1c4.6-1.4 9.1-1 13.2 1.2" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" fill="none" />
    <Path d="M10.9 16.8c3.6-1.1 7-0.8 10.1 0.9" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" fill="none" />
    <Path d="M12.3 21.1c2.5-.7 4.8-.5 6.9.6" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" fill="none" />
  </Svg>
);

const YouTubeLogo = ({ size = 32 }: BrandLogoProps) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Rect x="3" y="6" width="26" height="20" rx="7" fill="#FF0000" />
    <Path fill="#fff" d="M14 12.2 20.6 16 14 19.8z" />
  </Svg>
);

const AppleLogo = ({ size = 32 }: BrandLogoProps) => (
  <Svg width={size} height={size} viewBox="0 0 32 32">
    <Path
      fill="#000"
      d="M21.6 16.9c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.9-1.8-3.5-1.8-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.8-3.2-.8-1.6 0-3.1.9-4 2.3-1.7 3-.4 7.4 1.3 9.8.8 1.2 1.8 2.5 3.1 2.5 1.3-.1 1.7-.8 3.2-.8 1.5 0 1.9.8 3.2.8 1.4 0 2.2-1.2 3-2.4.9-1.4 1.3-2.9 1.3-3-.1 0-2.7-1-2.7-4zm-2.5-7c.7-.9 1.1-2.1 1-3.3-1 .1-2.2.7-2.9 1.5-.6.8-1.2 2-1 3.2 1.1.1 2.2-.5 2.9-1.4z"
    />
  </Svg>
);

const BRAND_LOGOS: Record<string, React.FC<BrandLogoProps>> = {
  'netflix': NetflixLogo,
  'spotify': SpotifyLogo,
  'youtube': YouTubeLogo,
  'apple': AppleLogo,
};

const MERCHANT_CONFIG: Record<string, { color: string }> = {
  'netflix': { color: '#E50914' },
  'spotify': { color: '#1DB954' },
  'amazon': { color: '#FF9900' },
  'apple': { color: '#A2AAAD' },
  'icloud': { color: '#007AFF' },
  'youtube': { color: '#FF0000' },
  'chatgpt': { color: '#74AA9C' },
  'github': { color: '#24292F' },
  'swiggy': { color: '#FC8019' },
  'zomato': { color: '#CB202D' },
  'jio': { color: '#0F3D95' },
  'airtel': { color: '#ED1C24' },
  'google': { color: '#4285F4' },
  'notion': { color: '#000000' },
  'linkedin': { color: '#0077B5' },
};

export function SubscriptionCard({ subscription, onSimulateCancel }: Props) {
  const { Colors, isDark } = useThemeColors();
  const daysUntilRenewal = Math.ceil((subscription.nextRenewalDate - Date.now()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysUntilRenewal <= 3;

  const config = useMemo(() => {
    const name = subscription.merchantName.toLowerCase();
    for (const key in MERCHANT_CONFIG) {
      if (name.includes(key)) return MERCHANT_CONFIG[key];
    }
    return { color: Colors.accentBlue };
  }, [subscription.merchantName, Colors]);

  const brandLogo = useMemo(() => {
    const name = subscription.merchantName.toLowerCase();
    for (const key in BRAND_LOGOS) {
      if (name.includes(key)) return BRAND_LOGOS[key];
    }
    return undefined;
  }, [subscription.merchantName]);

  const BrandLogo = brandLogo;

  const styles = useMemo(() => StyleSheet.create({
    card: { 
      backgroundColor: Colors.cardSurface, 
      padding: Spacing.md, 
      borderRadius: 24, 
      marginBottom: Spacing.md, 
      borderWidth: 1, 
      borderColor: Colors.cardBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    iconWrapper: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      padding: 4,
    },
    fallbackIconWrapper: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: config.color + '15',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: config.color + '30',
    },
    title: { fontFamily: Typography.fontFamily.bold, fontSize: 16, color: Colors.textPrimary },
    amount: { fontFamily: Typography.fontFamily.bold, fontSize: 16, color: Colors.textPrimary },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    tagRed: { backgroundColor: Colors.errorSoft },
    tagBlue: { backgroundColor: Colors.accentBlueSoft },
    tagText: { fontFamily: Typography.fontFamily.semiBold, fontSize: 10, color: Colors.accentBlue },
    tagTextRed: { color: Colors.error },
    renewalText: { fontFamily: Typography.fontFamily.medium, fontSize: 12, color: Colors.textSecondary },
    urgentText: { color: Colors.error, fontFamily: Typography.fontFamily.bold },
    actionBtn: { 
      backgroundColor: Colors.backgroundTertiary, 
      padding: Spacing.md, 
      borderRadius: 14, 
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    actionText: { fontFamily: Typography.fontFamily.bold, fontSize: 12, color: Colors.textPrimary },
  }), [Colors, config]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconWrapper}>
            {BrandLogo ? (
              <BrandLogo size={36} />
            ) : (
              <RefreshCw size={22} color={config.color} />
            )}
          </View>
          <View>
            <Text style={styles.title}>{subscription.merchantName}</Text>
            <Text style={styles.renewalText}>
              {subscription.frequency === 'monthly' ? 'Monthly' : 'Yearly'} Plan
            </Text>
          </View>
        </View>
        <Text style={styles.amount}>{formatCurrency(subscription.amount)}</Text>
      </View>

      <View style={styles.infoRow}>
        <View style={[styles.tag, subscription.aiClassification === 'Duplicate' ? styles.tagRed : styles.tagBlue]}>
          {subscription.aiClassification === 'Duplicate' ? (
            <AlertTriangle size={12} color={Colors.error} style={{marginRight: 4}}/>
          ) : (
            <CheckCircle size={12} color={Colors.accentBlue} style={{marginRight: 4}}/>
          )}
          <Text style={[styles.tagText, subscription.aiClassification === 'Duplicate' && styles.tagTextRed]}>
            {subscription.aiClassification}
          </Text>
        </View>
        <Text style={[styles.renewalText, isUrgent && styles.urgentText]}>
          {isUrgent ? `Renews in ${daysUntilRenewal}d ⚠️` : `Renews in ${daysUntilRenewal} days`}
        </Text>
      </View>

      <TouchableOpacity style={styles.actionBtn} onPress={() => onSimulateCancel(subscription)}>
        <Text style={styles.actionText}>Simulate Cancellation</Text>
      </TouchableOpacity>
    </View>
  );
}
