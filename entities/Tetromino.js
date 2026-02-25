// Types of Tetrominoes
export const TETROMINO_TYPES = {
    I: 'I', J: 'J', L: 'L', O: 'O', S: 'S', T: 'T', Z: 'Z'
};

// Colors mapping strictly to guideline (Neon variants)
export const TETROMINO_COLORS = {
    [TETROMINO_TYPES.I]: '#00ffff',
    [TETROMINO_TYPES.J]: '#0000ff',
    [TETROMINO_TYPES.L]: '#ffa500',
    [TETROMINO_TYPES.O]: '#ffff00',
    [TETROMINO_TYPES.S]: '#00ff00',
    [TETROMINO_TYPES.T]: '#800080',
    [TETROMINO_TYPES.Z]: '#ff0000'
};

// Matrices list [Spawn(0), Right(1), Double(2), Left(3)]
// Zeros represent empty, ones represent filled blocks
// The arrays are [row][col] => y, x.
export const SHAPES = {
    [TETROMINO_TYPES.T]: [
        [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
        [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
        [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
        [[0, 1, 0], [1, 1, 0], [0, 1, 0]]
    ],
    [TETROMINO_TYPES.J]: [
        [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
        [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
        [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
        [[0, 1, 0], [0, 1, 0], [1, 1, 0]]
    ],
    [TETROMINO_TYPES.L]: [
        [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
        [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
        [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
        [[1, 1, 0], [0, 1, 0], [0, 1, 0]]
    ],
    [TETROMINO_TYPES.S]: [
        [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
        [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
        [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
        [[1, 0, 0], [1, 1, 0], [0, 1, 0]]
    ],
    [TETROMINO_TYPES.Z]: [
        [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
        [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
        [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
        [[0, 1, 0], [1, 1, 0], [1, 0, 0]]
    ],
    [TETROMINO_TYPES.I]: [
        [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
        [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
        [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
        [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]]
    ],
    [TETROMINO_TYPES.O]: [
        [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]],
        [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]],
        [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]],
        [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]]
    ]
};

export class Tetromino {
    constructor(type) {
        this.type = type;
        this.color = TETROMINO_COLORS[type];
        this.rotationIndex = 0; // 0=N, 1=E, 2=S, 3=W
        this.x = Math.floor(10 / 2) - Math.floor(this.getMatrix()[0].length / 2); // Center x
        this.y = 0; // Will be properly positioned taking into account hidden rows in spawn
    }

    getMatrix() {
        return SHAPES[this.type][this.rotationIndex];
    }

    getNextRotationCW() {
        return (this.rotationIndex + 1) % 4;
    }

    getNextRotationCCW() {
        return (this.rotationIndex + 3) % 4;
    }

    rotateCW() {
        this.rotationIndex = this.getNextRotationCW();
    }

    rotateCCW() {
        this.rotationIndex = this.getNextRotationCCW();
    }

    clone() {
        const clone = new Tetromino(this.type);
        clone.x = this.x;
        clone.y = this.y;
        clone.rotationIndex = this.rotationIndex;
        return clone;
    }
}
