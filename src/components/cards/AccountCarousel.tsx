/**
 * Kairo — Account Carousel
 * Horizontal snapping carousel for banking cards
 */

import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { AccountCard } from './AccountCard';
import { Account } from '../../store/accountStore';
import { Spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const SNAP_INTERVAL = CARD_WIDTH + (SCREEN_WIDTH - CARD_WIDTH) / 2;

interface AccountCarouselProps {
  accounts: Account[];
  isBalanceVisible: boolean;
  onToggleBalance: () => void;
  onAccountChange: (index: number) => void;
}

export const AccountCarousel: React.FC<AccountCarouselProps> = ({
  accounts,
  isBalanceVisible,
  onToggleBalance,
  onAccountChange,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / SNAP_INTERVAL);
    if (index >= 0 && index < accounts.length) {
      onAccountChange(index);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="center"
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
      >
        {accounts.map((account, index) => (
          <AccountCard
            key={account.id}
            account={account}
            isBalanceVisible={isBalanceVisible}
            onToggleBalance={onToggleBalance}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xl,
  },
  scrollContent: {
    paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 4,
  },
});
