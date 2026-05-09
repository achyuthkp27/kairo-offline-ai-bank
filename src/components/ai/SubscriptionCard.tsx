import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Typography, Spacing, BorderRadius } from '../../theme';
import { useThemeColors } from '../../hooks/useTheme';
import { Subscription } from '../../services/SubscriptionService';
import { formatCurrency } from '../../utils/formatters';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Play, 
  Music, 
  ShoppingBag, 
  Smartphone, 
  Tv, 
  Video, 
  Cpu,
  Code,
  Coffee,
  Zap,
  Globe
} from 'lucide-react-native';

interface Props {
  subscription: Subscription;
  onSimulateCancel: (sub: Subscription) => void;
}

const MERCHANT_CONFIG: Record<string, { color: string, icon: any, domain?: string }> = {
  'netflix': { color: '#E50914', icon: Play, domain: 'netflix.com' },
  'spotify': { color: '#1DB954', icon: Music, domain: 'spotify.com' },
  'amazon': { color: '#FF9900', icon: ShoppingBag, domain: 'amazon.com' },
  'apple': { color: '#A2AAAD', icon: Smartphone, domain: 'apple.com' },
  'icloud': { color: '#007AFF', icon: Globe, domain: 'icloud.com' },
  'youtube': { color: '#FF0000', icon: Video, domain: 'youtube.com' },
  'chatgpt': { color: '#74AA9C', icon: Cpu, domain: 'openai.com' },
  'github': { color: '#24292F', icon: Code, domain: 'github.com' },
  'swiggy': { color: '#FC8019', icon: Coffee, domain: 'swiggy.com' },
  'zomato': { color: '#CB202D', icon: Coffee, domain: 'zomato.com' },
  'jio': { color: '#0F3D95', icon: Zap, domain: 'jio.com' },
  'airtel': { color: '#ED1C24', icon: Zap, domain: 'airtel.in' },
  'google': { color: '#4285F4', icon: Globe, domain: 'google.com' },
  'notion': { color: '#000000', icon: Globe, domain: 'notion.so' },
  'linkedin': { color: '#0077B5', icon: Globe, domain: 'linkedin.com' },
};

export function SubscriptionCard({ subscription, onSimulateCancel }: Props) {
  const { Colors, isDark } = useThemeColors();
  const [imageError, setImageError] = useState(false);
  const daysUntilRenewal = Math.ceil((subscription.nextRenewalDate - Date.now()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysUntilRenewal <= 3;

  const config = useMemo(() => {
    const name = subscription.merchantName.toLowerCase();
    for (const key in MERCHANT_CONFIG) {
      if (name.includes(key)) return MERCHANT_CONFIG[key];
    }
    return { color: Colors.accentBlue, icon: RefreshCw };
  }, [subscription.merchantName, Colors]);

  const logoUrl = config.domain ? `https://logo.clearbit.com/${config.domain}?size=128` : null;
  const BrandIcon = config.icon;

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
      backgroundColor: '#FFFFFF', // White background for logos to pop
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      padding: 4,
    },
    logoImage: {
      width: '100%',
      height: '100%',
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
            {logoUrl && !imageError ? (
              <Image 
                source={{ uri: logoUrl }} 
                style={styles.logoImage} 
                onError={() => setImageError(true)}
              />
            ) : (
              <BrandIcon size={22} color={config.color} />
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