import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { TrendingUp, AlertTriangle, X, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Typography, Spacing, BorderRadius } from '../../theme';
import { useBudget } from '../../hooks/useBudget';
import { useThemeColors, useHaptics } from '../../hooks';
import { GlassCard } from '../common/GlassCard';
import { formatCurrency } from '../../utils/formatters';

type ThemeColors = ReturnType<typeof useThemeColors>['Colors'];

interface BudgetProgressBarProps {
  category: string;
  spent: number;
  limit: number;
  percentage: number;
  status: 'safe' | 'warning' | 'over';
  onPress?: () => void;
  Colors: ThemeColors;
}

interface BudgetWidgetProps {
  onCategoryPress?: (category: string) => void;
}

const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  category,
  spent,
  limit,
  percentage,
  status,
  onPress,
  Colors,
}) => {
  const { trigger } = useHaptics();

  const statusColors = useMemo(() => ({
    safe: Colors.success,
    warning: Colors.warning,
    over: Colors.error,
  }), [Colors]);

  const barWidth = Math.min(percentage, 100);

  return (
    <Pressable
      onPress={() => {
        trigger('light');
        onPress?.();
      }}
      style={styles.progressRow}
    >
      <View style={styles.categoryInfo}>
        <View style={styles.categoryHeader}>
          <Text style={[styles.categoryName, { color: Colors.textPrimary }]}>{category}</Text>
          <Text style={[styles.percentageLabel, { color: statusColors[status] }]}>
            {Math.round(percentage)}%
          </Text>
        </View>
        
        <View style={[styles.progressTrack, { backgroundColor: Colors.backgroundTertiary }]}>
          <LinearGradient
            colors={[statusColors[status], statusColors[status] + 'CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressFill,
              { width: `${barWidth}%` },
            ]}
          />
        </View>

        <View style={styles.amountContainer}>
          <Text style={[styles.spentText, { color: Colors.textSecondary }]}>
            {formatCurrency(spent)} <Text style={{ color: Colors.textMuted, fontSize: 10 }}>spent</Text>
          </Text>
          <Text style={[styles.limitText, { color: Colors.textMuted }]}>
            of {formatCurrency(limit)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export const BudgetWidget: React.FC<BudgetWidgetProps> = ({ onCategoryPress }) => {
  const { Colors, isDark } = useThemeColors();
  const { trigger } = useHaptics();
  const { budgets, summary, isLoading, updateLimit } = useBudget();
  
  const [editingCategory, setEditingCategory] = useState<{ category: string, limit: number } | null>(null);
  const [newLimitValue, setNewLimitValue] = useState('');

  const overallStatus = summary.percentage >= 100
    ? 'over'
    : summary.percentage >= 80
      ? 'warning'
      : 'safe';

  const statusColors = {
    safe: Colors.success,
    warning: Colors.warning,
    over: Colors.error,
  };

  const handleEditPress = (category: string, currentLimit: number) => {
    trigger('medium');
    setEditingCategory({ category, limit: currentLimit });
    setNewLimitValue(currentLimit.toString());
  };

  const handleSaveLimit = async () => {
    if (editingCategory && newLimitValue) {
      trigger('heavy');
      const val = parseFloat(newLimitValue);
      if (!isNaN(val)) {
        await updateLimit(editingCategory.category.toLowerCase(), val);
      }
      setEditingCategory(null);
    }
  };

  if (isLoading) {
    return (
      <GlassCard variant="light" style={styles.loadingCard}>
        <ActivityIndicator color={Colors.accentBlue} />
      </GlassCard>
    );
  }

  return (
    <>
      <GlassCard variant="medium" style={styles.mainCard}>
        <View style={styles.container}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.titleGroup}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.accentBlue + '20' }]}>
                <TrendingUp size={16} color={Colors.accentBlue} />
              </View>
              <Text style={[styles.title, { color: Colors.textPrimary }]}>Monthly Budget</Text>
            </View>
            <View style={styles.summaryInfo}>
              <Text style={[styles.summarySpent, { color: Colors.accentCyan }]}>
                {formatCurrency(summary.totalSpent)}
              </Text>
              <Text style={[styles.summaryLimit, { color: Colors.textMuted }]}>
                / {formatCurrency(summary.totalLimit)}
              </Text>
            </View>
          </View>

          {/* Global Progress */}
          <View style={styles.globalProgressSection}>
            <View style={[styles.globalTrack, { backgroundColor: Colors.backgroundTertiary }]}>
              <LinearGradient
                colors={[Colors.accentCyan, Colors.accentBlue]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.globalFill,
                  { width: `${Math.min(summary.percentage, 100)}%` },
                ]}
              />
            </View>
          </View>

          {/* Categories Grid/List */}
          <View style={styles.categoriesList}>
            {budgets.slice(0, 5).map((budget, index) => (
              <React.Fragment key={budget.id}>
                <BudgetProgressBar
                  category={budget.category.charAt(0).toUpperCase() + budget.category.slice(1)}
                  spent={budget.spent_amount}
                  limit={budget.limit_amount}
                  percentage={budget.percentage}
                  status={budget.status}
                  onPress={() => handleEditPress(budget.category, budget.limit_amount)}
                  Colors={Colors}
                />
                {index < 4 && <View style={[styles.separator, { backgroundColor: Colors.border + '30' }]} />}
              </React.Fragment>
            ))}
          </View>

          {/* Over Budget Alert */}
          {summary.overBudgetCategories.length > 0 && (
            <View style={[styles.alertBanner, { backgroundColor: Colors.error + '10' }]}>
              <AlertTriangle size={14} color={Colors.error} />
              <Text style={[styles.alertText, { color: Colors.error }]}>
                Over budget in {summary.overBudgetCategories.join(', ')}
              </Text>
            </View>
          )}
        </View>
      </GlassCard>

      {/* Edit Budget Modal */}
      <Modal
        visible={!!editingCategory}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingCategory(null)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable 
            style={styles.modalBackdrop} 
            onPress={() => setEditingCategory(null)} 
          />
          <GlassCard variant="heavy" style={styles.editModal}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.textPrimary }]}>
                Edit {editingCategory?.category.charAt(0).toUpperCase()}{editingCategory?.category.slice(1)} Budget
              </Text>
              <Pressable onPress={() => setEditingCategory(null)}>
                <X size={20} color={Colors.textTertiary} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: Colors.textSecondary }]}>Set New Limit</Text>
              <View style={[styles.inputContainer, { backgroundColor: Colors.backgroundTertiary }]}>
                <Text style={[styles.currencySymbol, { color: Colors.accentBlue }]}>₹</Text>
                <TextInput
                  style={[styles.modalInput, { color: Colors.textPrimary }]}
                  keyboardType="decimal-pad"
                  value={newLimitValue}
                  onChangeText={setNewLimitValue}
                  autoFocus
                  placeholder="0.00"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: Colors.accentBlue }]}
                onPress={handleSaveLimit}
              >
                <Check size={20} color="#000" strokeWidth={3} />
                <Text style={styles.saveButtonText}>Save Budget</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  mainCard: {
    padding: Spacing.lg,
  },
  loadingCard: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 18,
    letterSpacing: -0.5,
  },
  summaryInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  summarySpent: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 20,
  },
  summaryLimit: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 12,
    opacity: 0.6,
  },
  globalProgressSection: {
    marginBottom: Spacing.sm,
  },
  globalTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  globalFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoriesList: {
    marginTop: Spacing.xs,
  },
  progressRow: {
    paddingVertical: Spacing.sm,
  },
  categoryInfo: {
    gap: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 15,
  },
  percentageLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 13,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spentText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 13,
  },
  limitText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 11,
  },
  separator: {
    height: 1,
    marginVertical: 4,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: 8,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  alertText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  editModal: {
    padding: Spacing.xl,
    borderRadius: BorderRadius['2xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 18,
  },
  modalBody: {
    gap: Spacing.md,
  },
  inputLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 60,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  currencySymbol: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  modalInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.bold,
    fontSize: 24,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  saveButtonText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 16,
    color: '#000',
  },
});