/**
 * Kairo — Transaction Item
 * Premium list item for displaying transaction details
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { 
  Utensils, 
  ShoppingBag, 
  Zap, 
  Car, 
  Film, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight,
  Coffee,
  Smartphone,
  Plane,
} from 'lucide-react-native';
import { Typography, Spacing, BorderRadius } from '../../theme';
import { formatCurrency, formatShortDate } from '../../utils/formatters';
import { Transaction, TransactionCategory } from '../../utils/types';
import { useThemeColors } from '../../hooks/useTheme';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
}

const getCategoryIcon = (category: TransactionCategory, Colors: ReturnType<typeof useThemeColors>['Colors']) => {
  const size = 18;
  const color = Colors.textPrimary;
  const strokeWidth = 1.5;

  switch (category) {
    case 'dining': return <Utensils size={size} color={color} strokeWidth={strokeWidth} />;
    case 'shopping': return <ShoppingBag size={size} color={color} strokeWidth={strokeWidth} />;
    case 'bills': return <Zap size={size} color={color} strokeWidth={strokeWidth} />;
    case 'travel': return <Car size={size} color={color} strokeWidth={strokeWidth} />;
    case 'entertainment': return <Film size={size} color={color} strokeWidth={strokeWidth} />;
    case 'investment': return <TrendingUp size={size} color={color} strokeWidth={strokeWidth} />;
    case 'salary': return <ArrowDownLeft size={size} color={Colors.success} strokeWidth={strokeWidth} />;
    case 'groceries': return <ShoppingBag size={size} color={color} strokeWidth={strokeWidth} />;
    default: return <Smartphone size={size} color={color} strokeWidth={strokeWidth} />;
  }
};

const getCategoryColor = (category: TransactionCategory, Colors: ReturnType<typeof useThemeColors>['Colors']) => {
  switch (category) {
    case 'dining': return Colors.accentBlue;
    case 'shopping': return '#8B5CF6';
    case 'bills': return Colors.error;
    case 'travel': return Colors.accentCyan;
    case 'entertainment': return '#8B5CF6';
    case 'investment': return Colors.success;
    case 'salary': return Colors.success;
    default: return Colors.accentBlue;
  }
};

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onPress,
}) => {
  const { Colors } = useThemeColors();
  const isCredit = transaction.type === 'credit';

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.base,
      backgroundColor: 'transparent',
    },
    pressed: {
      backgroundColor: Colors.cardSurfaceActive || 'rgba(255, 255, 255, 0.03)',
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    details: {
      flex: 1,
    },
    merchantName: {
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: Typography.fontSize.base,
      color: Colors.textPrimary,
      marginBottom: 2,
    },
    subInfo: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: 10,
      color: Colors.textTertiary,
    },
    rightSection: {
      alignItems: 'flex-end',
      marginLeft: Spacing.md,
    },
    amount: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.base,
      marginBottom: 2,
    },
    debitText: {
      color: Colors.textPrimary,
    },
    creditText: {
      color: Colors.success,
    },
    accountSource: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: 9,
      color: Colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  }), [Colors]);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <View style={styles.leftSection}>
        <View style={[styles.iconWrapper, { backgroundColor: `${getCategoryColor(transaction.category, Colors)}20` }]}>
          {getCategoryIcon(transaction.category, Colors)}
        </View>
        <View style={styles.details}>
          <Text style={styles.merchantName} numberOfLines={1}>{transaction.merchantName}</Text>
          <Text style={styles.subInfo}>
            {formatShortDate(transaction.date)} · {transaction.time}
          </Text>
        </View>
      </View>
      
      <View style={styles.rightSection}>
        <Text style={[styles.amount, isCredit ? styles.creditText : styles.debitText]}>
          {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
        </Text>
        <Text style={styles.accountSource}>{transaction.accountSource}</Text>
      </View>
    </Pressable>
  );
};