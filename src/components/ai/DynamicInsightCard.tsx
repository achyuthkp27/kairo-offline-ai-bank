import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography, Spacing } from '../../theme';
import { useThemeColors } from '../../hooks/useTheme';
import { AIInsight } from '../../services/InsightEngine';
import { TrendingDown, TrendingUp, AlertCircle, RefreshCw, Sparkles } from 'lucide-react-native';

interface Props {
  insight: AIInsight;
  onPress?: () => void;
}

export function DynamicInsightCard({ insight, onPress }: Props) {
  const { Colors } = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: Colors.cardSurface,
      borderRadius: 16,
      padding: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
      borderWidth: 1,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: Colors.cardSurfaceHover,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: Typography.fontSize.base,
      color: Colors.textPrimary,
      marginBottom: 4,
    },
    description: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.sm,
      color: Colors.textSecondary,
      lineHeight: 20,
    },
  }), [Colors]);

  const getIcon = () => {
    switch (insight.type) {
      case 'spending': return <TrendingUp size={24} color="#FF4B4B" />;
      case 'saving': return <TrendingDown size={24} color={Colors.success} />;
      case 'subscription': return <RefreshCw size={24} color={Colors.accentBlue} />;
      case 'alert': return <AlertCircle size={24} color="#FFA500" />;
      default: return <Sparkles size={24} color={Colors.accentBlue} />;
    }
  };

  const getBorderColor = () => {
    switch (insight.severity) {
      case 'positive': return Colors.accentCyan + '50';
      case 'warning': return 'rgba(255, 165, 0, 0.3)';
      case 'alert': return 'rgba(255, 75, 75, 0.3)';
      default: return Colors.cardBorder;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: getBorderColor() }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        {getIcon()}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{insight.title}</Text>
        <Text style={styles.description}>{insight.description}</Text>
      </View>
    </TouchableOpacity>
  );
}