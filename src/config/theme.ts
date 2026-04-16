export const theme = {
  primaryColor: '#C4634E',
  primaryColorLight: '#D4856F',
  primaryColorDark: '#A34D3B',
  secondaryColor: '#7A9B76',
  secondaryColorLight: '#95B891',
  secondaryColorDark: '#5C7A58',
  accentColor: '#F5D547',
  accentColorLight: '#F8E06A',
  accentColorDark: '#D4B630',
  backgroundColor: '#EBE8E3',
  backgroundColorWhite: '#FFFFFF',
  backgroundColorGray: '#F5F2ED',
  backgroundColorLight: '#FAFAF9',
  textPrimary: '#2D2A26',
  textSecondary: '#5C5852',
  textTertiary: '#B5B0A8',
  textPlaceholder: '#9A9A9A',
  textLight: '#CCCCCC',
  borderColor: '#D1CCC5',
  borderColorLight: '#EBE8E3',
  borderColorDark: '#2D2A26',
  successColor: '#7A9B76',
  warningColor: '#F5D547',
  errorColor: '#C4634E',
  infoColor: '#5B8DB8'
} as const

export type Theme = typeof theme
