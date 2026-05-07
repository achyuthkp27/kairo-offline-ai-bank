import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '../../theme';
import { Subscription } from '../../services/SubscriptionService';
import { formatCurrency } from '../../utils/formatters';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react-native';

interface Props {
  subscription: Subscription;
  onSimulateCancel: (sub: Subscription) => void;
}

export function SubscriptionCard({ subscription, onSimulateCancel }: Props) {
  const daysUntilRenewal = Math.ceil((subscription.nextRenewalDate - Date.now()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysUntilRenewal <= 3;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <RefreshCw size={16} color={Colors.accentBlue} />
          <Text style={styles.title}>{subscription.merchantName}</Text>
        </View>
        <Text style={styles.amount}>{formatCurrency(subscription.amount)}/{subscription.frequency === 'monthly' ? 'mo' : 'yr'}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <View style={[styles.tag, subscription.aiClassification === 'Duplicate' ? styles.tagRed : styles.tagBlue]}>
          {subscription.aiClassification === 'Duplicate' ? (
            <AlertTriangle size={12} color="#FF4B4B" style={{marginRight: 4}}/>
          ) : (
            <CheckCircle size={12} color={Colors.accentBlue} style={{marginRight: 4}}/>
          )}
          <Text style={[styles.tagText, subscription.aiClassification === 'Duplicate' && styles.tagTextRed]}>
            {subscription.aiClassification}
          </Text>
        </View>
        <Text style={[styles.renewalText, isUrgent && styles.urgentText]}>
          Renews in {daysUntilRenewal} days
        </Text>
      </View>

      <TouchableOpacity style={styles.actionBtn} onPress={() => onSimulateCancel(subscription)}>
        <Text style={styles.actionText}>Simulate Cancellation</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.cardSurface, padding: Spacing.md, borderRadius: 16, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  title: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base, color: Colors.textPrimary },
  amount: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.base, color: Colors.textPrimary },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(46, 91, 255, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  tagRed: { backgroundColor: 'rgba(255, 75, 75, 0.1)' },
  tagBlue: { backgroundColor: 'rgba(46, 91, 255, 0.1)' },
  tagText: { fontFamily: Typography.fontFamily.medium, fontSize: 10, color: Colors.accentBlue },
  tagTextRed: { color: '#FF4B4B' },
  renewalText: { fontFamily: Typography.fontFamily.regular, fontSize: 12, color: Colors.textSecondary },
  urgentText: { color: '#FFA500', fontFamily: Typography.fontFamily.medium },
  actionBtn: { backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: Spacing.sm, borderRadius: 8, alignItems: 'center' },
  actionText: { fontFamily: Typography.fontFamily.medium, fontSize: 12, color: Colors.textSecondary },
});
