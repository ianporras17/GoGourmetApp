import { DefaultTheme } from 'react-native-paper';

export const userTheme = {
  ...DefaultTheme,
  roundness: 8,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FFD54F', // Amarillo pastel
    accent: '#FF4081',
    surface: '#FFF9C4',
    background: '#FFFFFF',
    text: '#333333',
    placeholder: '#999999',
    disabled: '#CCCCCC',
    error: '#F44336',
    success: '#4CAF50',
  },
};

export const chefTheme = {
  ...DefaultTheme,
  roundness: 8,
  colors: {
    ...DefaultTheme.colors,
    primary: '#64B5F6', // Azul claro
    accent: '#FF4081',
    surface: '#E3F2FD',
    background: '#FFFFFF',
    text: '#333333',
    placeholder: '#999999',
    disabled: '#CCCCCC',
    error: '#F44336',
    success: '#4CAF50',
  },
};