// app  =========================================

function init(Snake, Food, speed) {
    Food.place()
    if (isIn(Snake.body(), Food.position())) return init(Snake, Food, speed)
    return play(Snake, Food, speed)
}

function play(Snake, Food, speed) {

    document.addEventListener(
        "keydown",
        ({ keyCode: code }) => turn(code, Snake),
        { once: true }
    )

    return setTimeout(game, speed, Snake, Food)

    function game(Snake, Food) {
        const food = Food.position()

        drawBord(Snake, Food)
        Snake.move()

        if (Snake.clash()) return
        if (!Snake.meets(food)) return play(Snake, Food, speed)

        Snake.eats(food)
        return init(Snake, Food, speed - speed * 1 / 54)
    }

    function drawBord(Snake, Food) {
        render()
        Snake.render()
        Food.render()
    }

    function turn(code) {
        if (![37, 38, 39, 40].includes(code)) return
        if (code === 37) Snake.turn('left')  // left  0
        if (code === 38) Snake.turn('down')  // down  1
        if (code === 39) Snake.turn('rigth') // rigth 2
        if (code === 40) Snake.turn('up')    // up    3
    }
}

// models  =========================================

const Food = ((food) => {
    return {
        place: () => { return food = cell() },
        position: () => (food),
        render: () => render('green', food)
    }
})()

const Snake = (() => {

    const _stack = []
    var direction = Math.floor(Math.random() * 4)
    var snake = ((head = cell(), len = 4) => {
        let snake = new Array(len).fill(head)
        if (direction === 0)
            return snake.map(({ x, y }, i) =>
                border({ x: cohor(x) + i, y: cohor(y) }))
        if (direction === 1)
            return snake.map(({ x, y }, i) =>
                border({ x: cohor(x), y: cohor(y) + i }))
        if (direction === 2)
            return snake.map(({ x, y }, i) =>
                border({ x: cohor(x) - i, y: cohor(y) }))
        if (direction === 3)
            return snake.map(({ x, y }, i) =>
                border({ x: cohor(x), y: cohor(y) - i }))
    })()

    return {
        head: () => snake[0],
        body: () => snake,
        move: () => snake = move(),
        turn: (where) => turn(where),
        meets: (thing) => equals(snake[0], thing),
        clash: (thing = snake[0]) => isIn(snake.slice(1), thing),
        eats: (food) => _stack.push(food),
        render: () => snake.forEach(p => render('black', p)),
    }

    function turn(where) {
        if (where === 'left' && direction !== 2) direction = 0
        if (where === 'down' && direction !== 3) direction = 1
        if (where === 'rigth' && direction !== 0) direction = 2
        if (where === 'up' && direction !== 1) direction = 3
    }

    function move() {

        snake.splice(0, 0, ([
            ({ x, y }) => border({ x: cohor(x) - 1, y: cohor(y) }),
            ({ x, y }) => border({ x: cohor(x), y: cohor(y) - 1 }),
            ({ x, y }) => border({ x: cohor(x) + 1, y: cohor(y) }),
            ({ x, y }) => border({ x: cohor(x), y: cohor(y) + 1 })
        ][direction])(snake[0]))

        snake.pop()

        if (_stack.length > 0 && !isIn(snake, _stack[0])) {
            snake.push(_stack.pop())
        }

        return snake
    }
})()

// utils ===================================

function cell(x, y) {
    return {
        x: isNaN(x) ?
            Math.floor(Math.random() * width / length) * length :
            x * length,
        y: isNaN(y) ?
            Math.floor(Math.random() * width / length) * length :
            y * length,
        l: length
    }
}

function render(color = 'white', { x, y, l } = { x: 0, y: 0, l: width }) {
    const canvas = document.getElementById('board').getContext('2d')
    canvas.fillStyle = color
    canvas.fillRect(x, y, l, l)
}

function equals({ x: ax, y: ay }, { x: bx, y: by }) {
    return ax === bx && ay === by
}

function isIn(line, point) {
    return line.some((part) => equals(part, point))
}

function border({ x, y }, max = Math.floor(width / length) - 1) {
    if (x < 0) x = max
    if (y < 0) y = max
    if (x > max) x = 0
    if (y > max) y = 0
    return { x, y, } = cell(x, y)
}

function cohor(n) {
    return Math.floor(n / length)
}

// run =====================================

init(Snake, Food, 150)


