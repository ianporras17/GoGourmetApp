import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput, HelperText, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const FormInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize = 'sentences',
  maxLength,
  validate,
  errorMessage,
  icon,
  disabled = false,
  style,
  ...props
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleChangeText = (text) => {
    onChangeText(text);
    if (validate) {
      setHasError(!validate(text));
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (validate && value) {
      setHasError(!validate(value));
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        label={label}
        value={value}
        onChangeText={handleChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        disabled={disabled}
        error={hasError && !isFocused}
        left={icon ? <TextInput.Icon icon={icon} /> : undefined}
        style={styles.input}
        {...props}
      />
      {hasError && !isFocused && errorMessage && (
        <HelperText type="error" visible={true}>
          {errorMessage}
        </HelperText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  input: {
    backgroundColor: 'transparent',
  },
});

export default FormInput;