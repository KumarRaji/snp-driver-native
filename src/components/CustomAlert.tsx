import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: {
    text: string;
    onPress: () => void;
    style?: 'default' | 'destructive' | 'cancel';
  }[];
  onClose?: () => void;
};

const CustomAlert = ({
  visible,
  title,
  message,
  type = 'info',
  buttons,
  onClose,
}: Props) => {
  const defaultButtons = buttons && buttons.length > 0 ? buttons : [
    { text: 'Okay, Understood', onPress: onClose || (() => {}), style: 'default' },
  ];

  const typeConfig = {
    success: { icon: 'check-circle' as const, color: '#22c55e' },
    error: { icon: 'alert-triangle' as const, color: '#FF2D3F' },
    warning: { icon: 'alert-triangle' as const, color: '#f59e0b' },
    info: { icon: 'info' as const, color: '#3b82f6' },
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={[styles.header, { backgroundColor: typeConfig[type].color }]}>
            <Feather name={typeConfig[type].icon} size={58} color="#fff" />
          </View>

          <View style={styles.body}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.buttonContainer}>
              {defaultButtons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === 'destructive' && styles.destructiveButton,
                    button.style === 'cancel' && styles.cancelButton,
                    defaultButtons.length > 1 && { flex: 1 },
                  ]}
                  onPress={button.onPress}>
                  <Text style={[styles.buttonText, button.style === 'cancel' && styles.cancelButtonText]}>{button.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CustomAlert;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  container: {
    width: '88%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 10,
  },
  header: {
    backgroundColor: '#FF2D3F',
    height: 105,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: 18,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 18,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    backgroundColor: '#000',
    width: '100%',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  destructiveButton: {
    backgroundColor: '#dc2626',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  cancelButtonText: {
    color: '#374151',
  },
});
