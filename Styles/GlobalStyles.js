import { StyleSheet } from 'react-native';

// Definisikan palet warna Anda di satu tempat
export const Colors = {
  primary: '#007BFF',
  danger: '#DC3545',
  light: '#f9f9f9',
  dark: '#333',
  grey: '#999',
  white: '#FFFFFF',
};

// Definisikan style global yang bisa dipakai ulang
export const globalStyles = StyleSheet.create({
  // 'container' yang kita pakai di Login & Register
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: Colors.white,
  },
  // 'title' yang kita pakai di Login & Register
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: Colors.dark,
  },
  // 'input' yang kita pakai di Login, Register, & Home
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
});