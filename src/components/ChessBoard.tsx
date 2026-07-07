import styles from './ChessBoard.module.css'

// Unicode glyphs for the standard starting position, rank 8 (top) down to
// rank 1 (bottom). This is a static, non-interactive placeholder — game
// logic will live here (or in a hook) once the service wiring lands.
const STARTING_POSITION: string[] = [
  '♜♞♝♛♚♝♞♜',
  '♟♟♟♟♟♟♟♟',
  '········',
  '········',
  '········',
  '········',
  '♙♙♙♙♙♙♙♙',
  '♖♘♗♕♔♗♘♖',
]

export default function ChessBoard() {
  return (
    <div className={styles.board} role="img" aria-label="Chess board, starting position">
      {STARTING_POSITION.flatMap((rank, rankIndex) =>
        [...rank].map((piece, fileIndex) => {
          const isDark = (rankIndex + fileIndex) % 2 === 1
          const glyph = piece === '·' ? '' : piece
          return (
            <div
              key={`${rankIndex}-${fileIndex}`}
              className={`${styles.square} ${isDark ? styles.dark : styles.light}`}
            >
              {glyph}
            </div>
          )
        }),
      )}
    </div>
  )
}
