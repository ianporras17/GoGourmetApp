// components/ui/Chip.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export default function Chip({ label, selected, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#999',
    margin: 4,
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: '#6200ee',
    borderColor: '#6200ee',
  },
  text: {
    fontSize: 14,
    color: '#333',
  },
  textSelected: {
    color: '#fff',
  },
});
