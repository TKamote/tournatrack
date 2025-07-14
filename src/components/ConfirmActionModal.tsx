import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

interface ConfirmActionModalProps {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  cancelText?: string;
  confirmText?: string;
}

const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  cancelText = "Cancel",
  confirmText = "YES",
}) => {
  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.modalButtonContainer}>
            <Pressable
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={onCancel}
            >
              <Text style={styles.modalButtonText}>{cancelText}</Text>
            </Pressable>
            <Pressable
              style={[styles.modalButton, styles.modalButtonConfirm]}
              onPress={onConfirm}
            >
              <Text style={styles.modalButtonText}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: COLORS.glassmorphism.modalBackground,
    padding: 20,
    borderRadius: 16,
    width: "80%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: COLORS.textWhite,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: COLORS.textWhite,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
    backgroundColor: COLORS.glassmorphism.background,
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
    marginHorizontal: 4,
  },
  modalButtonCancel: {
    // No extra color, keep glassmorphism
  },
  modalButtonConfirm: {
    // No extra color, keep glassmorphism
  },
  modalButtonText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ConfirmActionModal;
