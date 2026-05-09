import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Typography, Spacing } from '../../theme';
import { useThemeColors } from '../../hooks/useTheme';
import { MemoryService, AIMemory } from '../../services/MemoryService';
import { Trash2, Brain } from 'lucide-react-native';

export function MemoryManager() {
  const { Colors } = useThemeColors();
  const [memories, setMemories] = useState<AIMemory[]>([]);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    const data = await MemoryService.getAllMemories();
    setMemories(data);
  };

  const handleDelete = async (id: string) => {
    await MemoryService.deleteMemory(id);
    await loadMemories();
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.base },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
    headerTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, color: Colors.textPrimary, marginLeft: Spacing.sm },
    subtitle: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xl },
    list: { paddingBottom: Spacing['3xl'] },
    card: { backgroundColor: Colors.cardSurface, padding: Spacing.base, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder },
    cardContent: { flex: 1 },
    categoryLabel: { fontFamily: Typography.fontFamily.semiBold, fontSize: 10, color: Colors.accentBlue, marginBottom: 4 },
    memoryValue: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.base, color: Colors.textPrimary },
    deleteBtn: { padding: Spacing.sm },
    emptyText: { fontFamily: Typography.fontFamily.regular, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.xl },
  }), [Colors]);

  const renderItem = ({ item }: { item: AIMemory }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.categoryLabel}>{item.category.toUpperCase()}</Text>
        <Text style={styles.memoryValue}>{item.value}</Text>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
        <Trash2 size={20} color={Colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Brain size={24} color={Colors.accentBlue} />
        <Text style={styles.headerTitle}>Kairo Knows You</Text>
      </View>
      <Text style={styles.subtitle}>These memories help the AI personalize your experience.</Text>

      <FlatList
        data={memories}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No memories saved yet.</Text>}
      />
    </View>
  );
}