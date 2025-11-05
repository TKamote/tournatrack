import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Player } from "../../../types";
import { COLORS } from "../../../constants/colors";

interface PlayerInputProps {
  players: Player[];
  onPlayerAdd: (name: string) => void;
  onPlayerRemove: (playerId: string) => void;
  onPlayerEdit: (playerId: string, newName: string) => void;
}

const PlayerInput: React.FC<PlayerInputProps> = ({
  players,
  onPlayerAdd,
  onPlayerRemove,
  onPlayerEdit,
}) => {
  const [newPlayerName, setNewPlayerName] = useState("");
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      onPlayerAdd(newPlayerName.trim());
      setNewPlayerName("");
    }
  };

  const handleStartEdit = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditingName(player.name);
  };

  const handleSaveEdit = (playerId: string) => {
    if (editingName.trim()) {
      onPlayerEdit(playerId, editingName.trim());
    }
    setEditingPlayerId(null);
    setEditingName("");
  };

  const handleCancelEdit = () => {
    setEditingPlayerId(null);
    setEditingName("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Players ({players.length}/8)</Text>

      {/* Add Player Input */}
      <View style={styles.addPlayerContainer}>
        <TextInput
          style={styles.input}
          value={newPlayerName}
          onChangeText={setNewPlayerName}
          placeholder="Enter player name"
          placeholderTextColor={COLORS.glassmorphism.textSecondary}
          maxLength={20}
        />
        <TouchableOpacity
          style={[
            styles.addButton,
            players.length >= 8 && styles.addButtonDisabled,
          ]}
          onPress={handleAddPlayer}
          disabled={players.length >= 8 || !newPlayerName.trim()}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Players List - 2 Columns */}
      <View style={styles.playersGrid}>
        {players.map((player, index) => (
          <View key={player.id} style={styles.playerItem}>
            <View style={styles.playerInfo}>
              <Text style={styles.playerNumber}>#{index + 1}</Text>

              {editingPlayerId === player.id ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={editingName}
                    onChangeText={setEditingName}
                    autoFocus
                    maxLength={20}
                  />
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => handleSaveEdit(player.id)}
                  >
                    <Text style={styles.saveButtonText}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelEdit}
                  >
                    <Text style={styles.cancelButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.playerNameContainer}
                  onPress={() => handleStartEdit(player)}
                >
                  <Text style={styles.playerName}>{player.name}</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onPlayerRemove(player.id)}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.glassmorphism.background,
    borderRadius: 4,
    padding: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.glassmorphism.text,
    marginBottom: 6,
  },
  addPlayerContainer: {
    flexDirection: "row",
    marginBottom: 6,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.singleElimBackground,
    borderWidth: 1,
    borderColor: COLORS.glassmorphism.border,
    borderRadius: 3,
    padding: 6,
    fontSize: 13,
    color: COLORS.glassmorphism.text,
    marginRight: 4,
  },
  addButton: {
    backgroundColor: "#7f8c8d",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 4,
    justifyContent: "center",
  },
  addButtonDisabled: {
    backgroundColor: COLORS.glassmorphism.textSecondary,
  },
  addButtonText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: "600",
  },
  playersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  playerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: COLORS.singleElimBackground,
    borderRadius: 3,
    marginBottom: 2,
    width: "48%",
  },
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  playerNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.glassmorphism.textSecondary,
    marginRight: 12,
    minWidth: 24,
  },
  playerNameContainer: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    color: COLORS.glassmorphism.text,
    fontWeight: "500",
  },
  editContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  editInput: {
    flex: 1,
    backgroundColor: COLORS.glassmorphism.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    color: COLORS.glassmorphism.text,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 4,
  },
  saveButtonText: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: COLORS.glassmorphism.textSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cancelButtonText: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: "600",
  },
  removeButton: {
    backgroundColor: "#7f8c8d",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  removeButtonText: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: "500",
  },
});

export default PlayerInput;
