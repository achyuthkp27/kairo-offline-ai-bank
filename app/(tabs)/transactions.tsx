/**
 * Kairo — Transactions Screen
 * Premium scrolling transaction feed with filters and search
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ArrowUpDown } from 'lucide-react-native';
import { Typography, Spacing, BorderRadius } from '../../src/theme';
import { useHaptics, useTransactions } from '../../src/hooks';
import { useThemeColors } from '../../src/hooks/useTheme';
import { TransactionItem } from '../../src/components/common/TransactionItem';
import { TransactionCategory } from '../../src/utils/types';
import { withErrorBoundary } from '../../src/components/common/ErrorBoundary';

const CATEGORIES: { label: string; value: TransactionCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Dining', value: 'dining' },
  { label: 'Shopping', value: 'shopping' },
  { label: 'Bills', value: 'bills' },
  { label: 'Travel', value: 'travel' },
  { label: 'Invest', value: 'investment' },
];

function TransactionsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const { trigger } = useHaptics();
  const { transactions, refresh } = useTransactions(50);
  const { Colors } = useThemeColors();

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    trigger('medium');
    await refresh();
    setRefreshing(false);
  }, [trigger, refresh]);

  const filteredTransactions = transactions.filter((t) => {
    const searchLower = searchQuery.toLowerCase();
    const dateStr = t.date instanceof Date ? t.date.toISOString().split('T')[0] : String(t.date);
    const matchesSearch = 
      t.merchantName.toLowerCase().includes(searchLower) ||
      t.description?.toLowerCase().includes(searchLower) ||
      t.amount.toString().includes(searchQuery) ||
      dateStr.includes(searchLower) ||
      t.accountSource.toLowerCase().includes(searchLower);
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
    },
    title: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.xl,
      color: Colors.textPrimary,
    },
    headerActions: {
      flexDirection: 'row',
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.cardSurface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    searchContainer: {
      paddingHorizontal: Spacing.base,
      marginBottom: Spacing.md,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.backgroundTertiary,
      borderRadius: 14,
      height: 48,
      paddingHorizontal: Spacing.base,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    searchIcon: {
      marginRight: Spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.base,
      color: Colors.textPrimary,
    },
    filterWrapper: {
      marginBottom: Spacing.md,
    },
    filterList: {
      paddingHorizontal: Spacing.base,
    },
    filterChip: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: 20,
      backgroundColor: Colors.cardSurface,
      marginRight: Spacing.sm,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    activeFilterChip: {
      backgroundColor: Colors.accentBlue,
      borderColor: Colors.accentBlue,
    },
    filterText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.sm,
      color: Colors.textTertiary,
    },
    activeFilterText: {
      color: Colors.textPrimary,
    },
    listContent: {
      paddingBottom: 100,
    },
    separator: {
      height: 1,
      backgroundColor: Colors.divider,
      marginHorizontal: Spacing.base,
    },
    emptyContainer: {
      padding: Spacing['3xl'],
      alignItems: 'center',
    },
    emptyText: {
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.base,
      color: Colors.textMuted,
    },
  }), [Colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconButton} onPress={() => trigger('light')}>
            <ArrowUpDown size={20} color={Colors.textPrimary} strokeWidth={1.8} />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            selectionColor={Colors.accentBlue}
            returnKeyType="search"
          />
        </View>
      </View>

      <View style={styles.filterWrapper}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setSelectedCategory(item.value);
                trigger('selection');
              }}
              style={[
                styles.filterChip,
                selectedCategory === item.value && styles.activeFilterChip,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === item.value && styles.activeFilterText,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TransactionItem 
            transaction={item} 
            onPress={() => trigger('light')} 
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accentBlue}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

export default withErrorBoundary(TransactionsScreen);