import React from 'react';
import { StyleSheet } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

const CustomButton = ({ 
  label, 
  type = 'primary', 
  icon, 
  iconType = 'material-community',
  onPress, 
  loading = false, 
  disabled = false, 
  fullWidth = false,
  style,
  ...props 
}) => {
  const theme = useTheme();
  
  const getButtonMode = () => {
    switch (type) {
      case 'primary': return 'contained';
      case 'secondary': return 'outlined';
      case 'text': return 'text';
      case 'outline': return 'outlined';
      default: return 'contained';
    }
  };

  const getIcon = () => {
    if (!icon) return undefined;
    
    return ({ size, color }) => {
      const IconComponent = iconType === 'material-community' ? MaterialCommunityIcons : MaterialIcons;
      return <IconComponent name={icon} size={size} color={color} />;
    };
  };

  return (
    <Button
      mode={getButtonMode()}
      onPress={onPress}
      loading={loading}
      disabled={disabled || loading}
      icon={getIcon()}
      style={[
        fullWidth && styles.fullWidth,
        style
      ]}
      contentStyle={styles.content}
      {...props}
    >
      {label}
    </Button>
  );
};

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
    marginVertical: 8,
  },
  content: {
    paddingVertical: 8,
  },
});

export default CustomButton;