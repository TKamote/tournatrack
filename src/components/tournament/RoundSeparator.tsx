import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { BracketType } from '../../types';

interface RoundSeparatorProps {
  round: number;
  bracket: BracketType;
}

export const RoundSeparator = ({ round, bracket }: RoundSeparatorProps) => (
  <View style={styles.roundSeparator}>
    <Text style={styles.roundSeparatorText}>
      {`Round ${round}${bracket !== 'winners' ? ` - ${bracket.toUpperCase()}` : ''}`}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  roundSeparator: {
    backgroundColor: COLORS.backgroundLight,
    padding: 8,
    marginVertical: 8,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  roundSeparatorText: {
    color: COLORS.textPrimary,
    fontWeight: "bold",
    fontSize: 14,
  }
});