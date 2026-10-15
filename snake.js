
// game =========================================

const Game = (() => {

    const START_DELAY = 150 // ms
    const MIN_DELAY = 60 // ms
    const LABELS = { ready: 'Start', running: 'Pause', paused: 'Resume', over: 'Play again' }

    let snake, food, delay, timer, score, state, note

    return {
        reset,
        command,
        draw
    }

    function reset() {
        clearTimeout(timer)
        snake = Snake()
        food = Food()
        food.place(snake.body())
        delay = START_DELAY
        score = 0
        show('ready', 'Swipe or press an arrow key')
    }

    function play() {
        show('running')
        tick()
    }

    function tick() {
        timer = setTimeout(round, delay)
    }

    function round() {
        const meal = food.position()

        snake.move()

        if (snake.clash()) return end('Game over')
        if (snake.meets(meal)) {
            snake.eats(meal)
            score++
            vibrate(30)
            if (!food.place(snake.body())) return end('You win!')
            delay = Math.max(MIN_DELAY, delay - delay / 54)
        }
        draw()
        tick()
    }

    function pause() {
        if (state !== 'running') return
        clearTimeout(timer)
        show('paused', 'Paused')
    }

    function end(text) {
        vibrate(200)
        show('over', text)
    }

    // primary action: start, pause, resume or play again
    function primary() {
        if (state === 'running') return pause()
        if (state === 'over') reset()
        play()
    }

    function command(name) {
        if (name === 'primary') return primary()
        if (name === 'pause') return pause()
        if (name === 'restart') {
            reset()
            return play()
        }
        if (name === 'tap') return (state === 'ready' || state === 'paused') && play()
        if (!(name in directions)) return
        if (state === 'ready') play()
        if (state === 'running') snake.turn(directions[name])
    }

    function show(next, text) {
        state = next
        note = text
        draw()
    }

    function draw() {
        if (!snake) return
        render()
        snake.render()
        food.render()
        if (note) message(note)
        document.getElementById('score').textContent = `Score: ${score}`
        document.getElementById('primary').textContent = LABELS[state]
        document.getElementById('restart').disabled = state === 'ready'
    }
})()

// input =========================================

// maps keyboard, swipes and buttons to the same commands:
// left, up, right, down, primary, pause, restart, tap
function Input(command) {
    const KEYS = {
        ArrowLeft: 'left', KeyA: 'left',
        ArrowUp: 'up', KeyW: 'up',
        ArrowRight: 'right', KeyD: 'right',
        ArrowDown: 'down', KeyS: 'down',
        Space: 'primary', KeyP: 'primary',
        Escape: 'pause',
        KeyR: 'restart'
    }

    document.addEventListener('keydown', (event) => {
        const name = KEYS[event.code]
        if (!name) return
        // a focused button handles Space itself
        if (event.code === 'Space' && event.target.closest('button')) return
        event.preventDefault()
        command(name)
    })

    Swipe(document.getElementById('stage'), command)

    ;['primary', 'restart'].forEach((id) => {
        document.getElementById(id).addEventListener('click', (event) => {
            event.currentTarget.blur()
            command(id)
        })
    })

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) command('pause')
    })
}

// one direction per gesture, taken from the dominant axis once the
// pointer has moved at least `min` css pixels; no movement is a tap
function Swipe(target, command, min = 24) {
    let origin

    target.addEventListener('pointerdown', (event) => {
        origin = { x: event.clientX, y: event.clientY, id: event.pointerId, done: false }
        target.setPointerCapture(event.pointerId)
    })

    target.addEventListener('pointermove', (event) => {
        if (!origin || origin.done || event.pointerId !== origin.id) return
        const dx = event.clientX - origin.x
        const dy = event.clientY - origin.y
        if (Math.max(Math.abs(dx), Math.abs(dy)) < min) return
        origin.done = true
        command(Math.abs(dx) > Math.abs(dy) ?
            (dx < 0 ? 'left' : 'right') :
            (dy < 0 ? 'up' : 'down'))
    })

    const release = (event) => {
        if (!origin || event.pointerId !== origin.id) return
        if (event.type === 'pointerup' && !origin.done) command('tap')
        origin = undefined
    }
    target.addEventListener('pointerup', release)
    target.addEventListener('pointercancel', release)
}

// utils ===================================

const GRID = 17 // cells per side

let cellSize // css pixels, set by resize()

function context() {
    return document.getElementById('board').getContext('2d')
}

// size the board to the stage, with a backing store scaled by devicePixelRatio
function resize() {
    const stage = document.getElementById('stage')
    const canvas = document.getElementById('board')
    const border = 2
    const room = Math.min(stage.clientWidth, stage.clientHeight) - border
    const ratio = window.devicePixelRatio || 1

    cellSize = Math.max(1, Math.floor(room / GRID))
    const size = cellSize * GRID

    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    canvas.width = Math.round(size * ratio)
    canvas.height = Math.round(size * ratio)
    context().setTransform(ratio, 0, 0, ratio, 0, 0)
}

// x, y and l are in cells; the default clears the whole board
function render(color = 'white', { x, y, l = 1 } = { x: 0, y: 0, l: GRID }) {
    const canvas = context()
    canvas.fillStyle = color
    canvas.fillRect(x * cellSize, y * cellSize, l * cellSize, l * cellSize)
}

function message(text) {
    const canvas = context()
    const size = cellSize * GRID
    canvas.fillStyle = 'rgba(255, 255, 255, 0.8)'
    canvas.fillRect(0, size / 2 - cellSize * 1.5, size, cellSize * 3)
    canvas.fillStyle = 'red'
    canvas.font = `bold ${Math.round(cellSize * 0.9)}px sans-serif`
    canvas.textAlign = 'center'
    canvas.textBaseline = 'middle'
    canvas.fillText(text, size / 2, size / 2, size - cellSize)
}

function vibrate(ms) {
    if (navigator.vibrate) navigator.vibrate(ms)
}

function random(max) {
    return Math.floor(Math.random() * max)
}

function cells() {
    return Array.from({ length: GRID * GRID }, (_, i) => ({ x: i % GRID, y: Math.floor(i / GRID) }))
}

const directions = (function (directions = {}) {
    ['left', 'up', 'right', 'down'].forEach((direction, i) => {
        directions[direction] = i
        directions[i] = direction
    })
    return directions
})()

function shift({ x, y }, direction, i = 1) {
    if (direction === directions['left'])   return { x: x - i, y }
    if (direction === directions['up'])     return { x, y: y - i }
    if (direction === directions['right'])  return { x: x + i, y }
    if (direction === directions['down'])   return { x, y: y + i }
}

function opposite(direction) {
    return (direction + 2) % 4
}

// wrap a cell around the board edges
function place({ x, y }) {
    return {
        x: (x % GRID + GRID) % GRID,
        y: (y % GRID + GRID) % GRID
    }
}

function equals({ x: ax, y: ay }, { x: bx, y: by }) {
    return ax === bx && ay === by
}

function isIn(line, point) {
    return line.some((part) => equals(part, point))
}

// models  =========================================

function Food() {

    let food

    return {
        place: (taken = []) => {
            const free = cells().filter((c) => !isIn(taken, c))
            return food = free[random(free.length)]
        },
        position: () => (food),
        render: () => food && render('green', food)
    }
}

function Snake(direction = random(4), len = 4) {

    const head = { x: random(GRID), y: random(GRID) }
    const pending = [] // eaten food, appended once the tail has passed it
    let moved = direction // direction of the last executed move
    let snake = Array.from({ length: len }, (_, i) => place(shift(head, direction, -i)))

    return {
        head: () => snake[0],
        body: () => snake,
        move: () => snake = move(),
        turn: (where) => turn(where),
        meets: (thing) => equals(snake[0], thing),
        clash: (thing = snake[0]) => isIn(snake.slice(1), thing),
        eats: (food) => pending.push(food),
        render: () => snake.forEach((p) => render('black', p)),
    }

    function turn(where) {
        if (where === opposite(moved)) return
        direction = where
    }

    function move() {
        const body = [place(shift(snake[0], direction)), ...snake.slice(0, -1)]
        moved = direction

        if (pending.length > 0 && !isIn(body, pending[0])) {
            body.push(pending.shift())
        }
        return body
    }
}

// run ===================================

let resizing
function onResize() {
    cancelAnimationFrame(resizing)
    resizing = requestAnimationFrame(() => {
        resize()
        Game.draw()
    })
}

resize()
window.addEventListener('resize', onResize)
window.addEventListener('orientationchange', onResize)
Input(Game.command)
Game.reset()
