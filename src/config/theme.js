export const FONTS = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semiBold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
};

export const colors = {
  primary: '#FF69B4', // Пример основного цвета
  text: '#333',
  lightGray: '#f5f5f5',
  white: '#fff',
  black: '#000',
  error: '#FF0000',
  success: '#28a745',
  info: '#17a2b8',
};
 
export const globalStyles = {
  text: {
    fontFamily: FONTS.regular,
    color: colors.text,
  },
  title: {
    fontFamily: FONTS.bold,
    color: colors.text,
  },
};