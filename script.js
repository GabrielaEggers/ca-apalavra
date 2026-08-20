const gridData = [
  ['E', 'T', 'I', 'O', 'P', 'I', 'A', 'X', 'A', 'R', 'G'],
  ['S', 'A', 'H', 'A', 'R', 'A', 'B', 'Y', 'A', 'Q', 'B'],
  ['E', 'V', 'E', 'R', 'E', 'S', 'T', 'A', 'T', 'W', 'U'],
  ['L', 'Z', 'O', 'K', 'Y', 'O', 'T', 'O', 'L', 'U', 'R'],
  ['M', 'C', 'Y', 'O', 'K', 'O', 'H', 'A', 'M', 'A', 'J'],
  ['P', 'A', 'N', 'T', 'H', 'E', 'O', 'N', 'A', 'V', 'K'],
  ['B', 'X', 'A', 'P', 'A', 'C', 'H', 'E', 'N', 'I', 'L'],
  ['C', 'H', 'I', 'C', 'H', 'E', 'N', 'I', 'T', 'Z', 'A']
];

const targetWords = [
  "ETIOPIA", "SAHARA", "EVEREST", "KYOTO",
  "PANTHEON", "NILO", "CHICHENITZA", "JAPAO"
];

let selectedCells = [];
let isSelecting = false;
let foundWords = new Set();

const gridElement = document.getElementById('grid');
const wordListElement = document.getElementById('word-list');
const resetBtn = document.getElementById('reset-btn');

function initGame() {
  gridElement.innerHTML = '';
  wordListElement.innerHTML = '';
  selectedCells = [];
  foundWords.clear();

  // Renderizar lista de palavras
  targetWords.forEach(word => {
    const li = document.createElement('li');
    li.textContent = word;
    li.id = `word-${word}`;
    wordListElement.appendChild(li);
  });

  // Renderizar grade de letras
  for (let r = 0; r < gridData.length; r++) {
    for (let c = 0; c < gridData[r].length; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.textContent = gridData[r][c];
      cell.dataset.row = r;
      cell.dataset.col = c;

      cell.addEventListener('mousedown', () => startSelection(cell));
      cell.addEventListener('mouseenter', () => enterCell(cell));
      cell.addEventListener('mouseup', endSelection);

      gridElement.appendChild(cell);
    }
  }
}

document.addEventListener('mouseup', endSelection);

function startSelection(cell) {
  isSelecting = true;
  clearSelection();
  selectCell(cell);
}

function enterCell(cell) {
  if (isSelecting) {
    selectCell(cell);
  }
}

function selectCell(cell) {
  if (!selectedCells.includes(cell)) {
    selectedCells.push(cell);
    cell.classList.add('selected');
  }
}

function endSelection() {
  if (!isSelecting) return;
  isSelecting = false;

  const currentWord = selectedCells.map(cell => cell.textContent).join('');
  const reversedWord = currentWord.split('').reverse().join('');

  let matchedWord = null;
  if (targetWords.includes(currentWord)) {
    matchedWord = currentWord;
  } else if (targetWords.includes(reversedWord)) {
    matchedWord = reversedWord;
  }

  if (matchedWord && !foundWords.has(matchedWord)) {
    foundWords.add(matchedWord);
    selectedCells.forEach(cell => {
      cell.classList.remove('selected');
      cell.classList.add('found');
    });
    document.getElementById(`word-${matchedWord}`).classList.add('found');
    
    if (foundWords.size === targetWords.length) {
      setTimeout(() => alert('Parabéns! Você encontrou todas as palavras!'), 300);
    }
  } else {
    clearSelection();
  }

  selectedCells = [];
}

function clearSelection() {
  const cells = document.querySelectorAll('.cell.selected');
  cells.forEach(cell => cell.classList.remove('selected'));
}

resetBtn.addEventListener('click', initGame);

initGame();