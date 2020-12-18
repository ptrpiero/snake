
// game =========================================

const Game = (() => {

    let listener

    return {
        init
    }

    function init(Snake, Food, speed) {
        Food.place()
        if (isIn(Snake.body(), Food.position()))
            return init(Snake, Food, speed)
        listener = Listener(Snake)
        listener.start()
        return play(Snake, Food, speed)
    }

    function play(Snake, Food, speed) {
        
        return setTimeout(round, speed, Snake, Food)

        function round(Snake, Food) {
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
    }
})()

function Listener(snake){
    const keyHandler = ({ code }) => {
        if (!code.includes('Arrow')) return
        snake.turn(directions[code.replace('Arrow','').toLocaleLowerCase()])
    }
    return {
        start: () => document.addEventListener("keydown",keyHandler),
        stop: () => document.removeEventListener("keydown",keyHandler)
    }
}

// utils ===================================

function render(color = 'white', { x, y, l } = { x: 0, y: 0, l: width }) {
    const canvas = document.getElementById('board').getContext('2d')
    canvas.fillStyle = color
    canvas.fillRect(x, y, l, l)
}

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

function coordinates({ x, y }) {
    return {
        x: Math.floor(x / length),
        y: Math.floor(y / length)
    }
}

const directions = (function (directions = {}) {
    ['left', 'up', 'right', 'down'].forEach((direction, i) => {
        directions[direction] = i
        directions[i] = direction
    })
    return directions
})()

function shift({ x, y }, direction, i = 1) {
    if (direction === directions[0]) return { x: x - i, y } // left
    if (direction === directions[1]) return { x, y: y - i } // up
    if (direction === directions[2]) return { x: x + i, y } // rigth
    if (direction === directions[3]) return { x, y: y + i } // down
}

function place({ x, y }, max = Math.floor(width / length) - 1) {
    if (x < 0) x = max
    if (y < 0) y = max
    if (x > max) x = 0
    if (y > max) y = 0
    return { x, y, } = cell(x, y)
}

function equals({ x: ax, y: ay }, { x: bx, y: by }) {
    return ax === bx && ay === by
}

function isIn(line, point) {
    return line.some((part) => equals(part, point))
}

// models  =========================================

const Food = ((food) => {

    return {
        place: () => { return food = cell() },
        position: () => (food),
        render: () => render('green', food)
    }

})()

const Snake = ((

    direction = Math.floor(Math.random() * 4),
    snake = ((head = cell(), len = 4) => {
        let snake = new Array(len).fill(head)
        return snake.map(({ x, y }, i) => place(
            shift(coordinates({ x, y }), directions[direction], i * -1)))
    })(),
    _stack = []

) => {

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

    function turn(code) {
        if (code === 0 && direction === directions['right'])    return
        if (code === 1 && direction === directions['down'])     return
        if (code === 2 && direction === directions['left'])     return
        if (code === 3 && direction === directions['up'])       return
        direction = directions[directions[code]]
    }

    function move() {
        snake.splice(0, 0,
            place(shift(coordinates(snake[0]), directions[direction]))
        )
        snake.pop()

        if (_stack.length > 0 && !isIn(snake, _stack[0])) {
            snake.push(_stack.pop())
        }
        return snake
    }
})()

// run ===================================

Game.init(Snake, Food, 150)

