import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { Match, Player, TournamentType } from '../types';

interface TournamentSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  winner: Player;
  runnerUp?: Player | null; // Update type to allow null
  tournamentType: TournamentType;
  finalMatch: Match;
}

const TournamentSummaryModal: React.FC<TournamentSummaryModalProps> = ({
  visible,
  onClose,
  winner,
  runnerUp,
  tournamentType,
  finalMatch,
}) => {
  if (!winner || !finalMatch) return null;

  const winnerScore = finalMatch.games.filter(g => g.winner?.id === winner.id).length;
  const runnerUpScore = runnerUp ? 
    finalMatch.games.filter(g => g.winner?.id === runnerUp.id).length : 
    0;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible && !!winner}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.titleText}>Tournament Complete!</Text>
          
          <View style={styles.resultContainer}>
            <Text style={styles.winnerText}>Champion</Text>
            <Text style={styles.playerName}>{winner.name}</Text>
            
            {runnerUp && (
              <>
                <Text style={styles.runnerUpText}>Runner-up</Text>
                <Text style={styles.playerName}>{runnerUp.name}</Text>
              </>
            )}

            <Text style={styles.scoreText}>
              Final Score: {winnerScore} - {runnerUpScore}
            </Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: COLORS.backgroundWhite,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    margin: 20,
    minWidth: '80%',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 20,
  },
  resultContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  winnerText: {
    fontSize: 18,
    color: COLORS.success,
    fontWeight: '600',
    marginBottom: 5,
  },
  runnerUpText: {
    fontSize: 16,
    color: COLORS.textLight,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 5,
  },
  playerName: {
    fontSize: 20,
    color: COLORS.textDark,
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 16,
    color: COLORS.textDark,
    marginTop: 10,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  buttonText: {
    color: COLORS.textWhite,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TournamentSummaryModal;