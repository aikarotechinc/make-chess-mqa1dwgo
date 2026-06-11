import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const BOARD_SIZE = width - 32;
const SQUARE_SIZE = BOARD_SIZE / 8;

const INITIAL_BOARD = [
  ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'],
  ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
  ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr'],
];

const PIECE_ICONS = {
  'p': 'chess-pawn',
  'r': 'chess-rook',
  'n': 'chess-knight',
  'b': 'chess-bishop',
  'q': 'chess-queen',
  'k': 'chess-king',
};

const COLORS = {
  background: '#121214',
  lightSquare: '#EBECD0',
  darkSquare: '#739552',
  highlight: 'rgba(255, 255, 0, 0.4)',
  validMove: 'rgba(0, 0, 0, 0.15)',
  validMoveCapture: 'rgba(0, 0, 0, 0.25)',
  whitePiece: '#FFFFFF',
  blackPiece: '#222222',
  text: '#FFFFFF',
  accent: '#739552',
};

export default function App() {
  const [board, setBoard] = useState(INITIAL_BOARD.map(row => [...row]));
  const [turn, setTurn] = useState('w');
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [winner, setWinner] = useState(null);

  const calculateValidMoves = useCallback((currentBoard, r, c, piece) => {
    const color = piece[0];
    const type = piece[1];
    const moves = [];

    const addMove = (nr, nc) => {
      if (nr < 0 || nr > 7 || nc < 0 || nc > 7) return false;
      const target = currentBoard[nr][nc];
      if (!target) {
        moves.push({ r: nr, c: nc });
        return true; 
      }
      if (target[0] !== color) {
        moves.push({ r: nr, c: nc, capture: true });
        return false; 
      }
      return false; 
    };

    if (type === 'p') {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      if (r + dir >= 0 && r + dir <= 7 && !currentBoard[r + dir][c]) {
        moves.push({ r: r + dir, c });
        if (r === startRow && !currentBoard[r + dir * 2][c]) {
          moves.push({ r: r + dir * 2, c });
        }
      }
      if (r + dir >= 0 && r + dir <= 7) {
        if (c - 1 >= 0 && currentBoard[r + dir][c - 1] && currentBoard[r + dir][c - 1][0] !== color) {
          moves.push({ r: r + dir, c: c - 1, capture: true });
        }
        if (c + 1 <= 7 && currentBoard[r + dir][c + 1] && currentBoard[r + dir][c + 1][0] !== color) {
          moves.push({ r: r + dir, c: c + 1, capture: true });
        }
      }
    } else if (type === 'n') {
      const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
      knightMoves.forEach(([dr, dc]) => addMove(r + dr, c + dc));
    } else if (type === 'k') {
      const kingMoves = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
      kingMoves.forEach(([dr, dc]) => addMove(r + dr, c + dc));
    } else {
      const dirs = [];
      if (type === 'r' || type === 'q') dirs.push([0, 1], [0, -1], [1, 0], [-1, 0]);
      if (type === 'b' || type === 'q') dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);

      dirs.forEach(([dr, dc]) => {
        let nr = r + dr;
        let nc = c + dc;
        while (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
          if (!addMove(nr, nc)) break;
          nr += dr;
          nc += dc;
        }
      });
    }
    return moves;
  }, []);

  const handleSquarePress = (r, c) => {
    if (winner) return;

    const piece = board[r][c];
    
    if (selectedSquare) {
      const isMoveValid = validMoves.find(m => m.r === r && m.c === c);
      
      if (isMoveValid) {
        const newBoard = board.map(row => [...row]);
        const movingPiece = newBoard[selectedSquare.r][selectedSquare.c];
        const targetPiece = newBoard[r][c];

        newBoard[r][c] = movingPiece;
        newBoard[selectedSquare.r][selectedSquare.c] = null;

        if (movingPiece[1] === 'p' && (r === 0 || r === 7)) {
          newBoard[r][c] = movingPiece[0] + 'q'; 
        }

        setBoard(newBoard);
        setSelectedSquare(null);
        setValidMoves([]);
        setTurn(turn === 'w' ? 'b' : 'w');

        if (targetPiece && targetPiece[1] === 'k') {
          setWinner(turn === 'w' ? 'White' : 'Black');
        }
      } else if (piece && piece[0] === turn) {
        setSelectedSquare({ r, c });
        setValidMoves(calculateValidMoves(board, r, c, piece));
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } else {
      if (piece && piece[0] === turn) {
        setSelectedSquare({ r, c });
        setValidMoves(calculateValidMoves(board, r, c, piece));
      }
    }
  };

  const resetGame = () => {
    setBoard(INITIAL_BOARD.map(row => [...row]));
    setTurn('w');
    setSelectedSquare(null);
    setValidMoves([]);
    setWinner(null);
  };

  const renderPiece = (piece) => {
    if (!piece) return null;
    const color = piece[0] === 'w' ? COLORS.whitePiece : COLORS.blackPiece;
    const iconName = PIECE_ICONS[piece[1]];
    
    return (
      <View style={styles.pieceContainer}>
        <MaterialCommunityIcons 
          name={iconName} 
          size={SQUARE_SIZE * 0.75} 
          color={color} 
          style={piece[0] === 'w' ? styles.whitePieceShadow : null}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Grandmaster</Text>
        <Text style={styles.subtitle}>
          {winner ? `Game Over - ${winner} Wins!` : `${turn === 'w' ? 'White' : 'Black'} to move`}
        </Text>
      </View>

      <View style={styles.boardContainer}>
        <View style={styles.board}>
          {board.map((row, r) => (
            <View key={`row-${r}`} style={styles.row}>
              {row.map((piece, c) => {
                const isDark = (r + c) % 2 === 1;
                const isSelected = selectedSquare?.r === r && selectedSquare?.c === c;
                const validMove = validMoves.find(m => m.r === r && m.c === c);

                return (
                  <TouchableOpacity
                    key={`square-${r}-${c}`}
                    activeOpacity={0.8}
                    style={[
                      styles.square,
                      { backgroundColor: isDark ? COLORS.darkSquare : COLORS.lightSquare },
                      isSelected && styles.selectedSquare
                    ]}
                    onPress={() => handleSquarePress(r, c)}
                  >
                    {renderPiece(piece)}
                    
                    {validMove && (
                      <View style={[
                        styles.validMoveIndicator,
                        validMove.capture && styles.validMoveCaptureIndicator
                      ]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
          <MaterialCommunityIcons name="refresh" size={24} color={COLORS.text} />
          <Text style={styles.resetText}>New Game</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
    paddingTop: StatusBar.currentHeight || 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  board: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    borderWidth: 4,
    borderColor: '#2A2A35',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: COLORS.lightSquare,
  },
  row: {
    flexDirection: 'row',
    height: SQUARE_SIZE,
  },
  square: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedSquare: {
    backgroundColor: COLORS.highlight,
  },
  pieceContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  whitePieceShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 2,
  },
  validMoveIndicator: {
    position: 'absolute',
    width: SQUARE_SIZE * 0.3,
    height: SQUARE_SIZE * 0.3,
    borderRadius: SQUARE_SIZE,
    backgroundColor: COLORS.validMove,
    zIndex: 3,
  },
  validMoveCaptureIndicator: {
    width: SQUARE_SIZE * 0.85,
    height: SQUARE_SIZE * 0.85,
    backgroundColor: 'transparent',
    borderWidth: 5,
    borderColor: COLORS.validMoveCapture,
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
  },
  resetText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});