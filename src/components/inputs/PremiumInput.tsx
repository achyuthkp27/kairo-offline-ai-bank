/**
 * Kairo — Premium Text Input
 * Elegant input field with focus states, error states, and icon support
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  Pressable,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

interface PremiumInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: boolean;
  errorMessage?: string;
  icon?: React.ReactNode;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: ViewStyle;
}

export const PremiumInput: React.FC<PremiumInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error = false,
  errorMessage,
  icon,
  autoCapitalize = 'none',
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const actualSecure = secureTextEntry && !isPasswordVisible;

  return (
    <View style={[styles.wrapper, style]}>
      <Text style={[styles.label, error && styles.labelError]}>
        {label}
      </Text>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={actualSecure}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={Colors.accentCyan}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeButton}
            hitSlop={8}
          >
            {isPasswordVisible ? (
              <EyeOff size={18} color={Colors.textTertiary} strokeWidth={1.8} />
            ) : (
              <Eye size={18} color={Colors.textTertiary} strokeWidth={1.8} />
            )}
          </Pressable>
        )}
      </View>
      {error && errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  labelError: {
    color: Colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: Spacing.base,
    height: 56,
  },
  inputFocused: {
    borderColor: Colors.accentBlue,
    backgroundColor: 'rgba(46, 91, 255, 0.06)',
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: 'rgba(255, 77, 109, 0.06)',
  },
  iconContainer: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    height: '100%',
  },
  eyeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  errorText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    marginTop: Spacing.sm,
  },
});
