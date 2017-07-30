
const CELL_HORIZONTAL_PADDING = 6
const CELL_BOTTOM_PADDING = 14

const DEFAULT_COL_WIDTH = 200
const DEFAULT_ROW_HEIGHT = 50

const LEFT_MARGIN = 60
const TOP_MARGIN = 40

const RESIZE_HANDLE_WIDTH = 20
const RESIZE_HANDLE_DRAWN_WIDTH = 4

const SELECTION_COLOR = '#48f'

const CONTENT_FONT = DEFAULT_ROW_HEIGHT - 20 + 'px Helvetica'
const SCALE = 2


const X_SCROLL_SPEED = 4
const Y_SCROLL_SPEED = 4



// let State.ctx = canvas.getContext('2d')

// let State.viewport_row = 0
// let State.viewport_col = 0

// let State.col_widths = {}
// let State.row_heights = {}

// let State.selected_row = 0
// let State.selected_col = 0

// let State.selected_end_row;
// let State.selected_end_col;

// let State.user_content = {}

// let State.undo_actions = []
// let State.redo_actions = []

// let State.dragging_col_divider
// let State.dragging_row_divider

// let State.mouse_x
// let State.mouse_y


// let State.scroll_x = 0
// let State.scroll_y = 0


let State = {
    keygetter: keygetter,
    ctx: canvas.getContext('2d'),
    canvas: canvas,
    mouse_x: 0,
    mouse_y: 0,
    dragging_col_divider: undefined,
    dragging_row_divider: undefined,
    undo_actions: [],
    redo_actions: [],
    user_content: {},
    selected_end_col: 0,
    selected_end_row: 0,
    selected_row: 0,
    selected_col: 0,
    col_widths: {},
    row_heights: {},
    viewport_col: 0,
    viewport_row: 0,
    scroll_x: 0,
    scroll_y: 0
}


State.keygetter.style.display = 'none';


function render() {
    // let State = __State;

    State.canvas.width = innerWidth * SCALE
    State.canvas.height = innerHeight * SCALE

    State.canvas.style.width = innerWidth + 'px'
    State.canvas.style.height = innerHeight + 'px'

    State.ctx.clearRect(0, 0, State.canvas.width, State.canvas.height)

    draw_label_backgrounds()

    draw_horizontal_lines_and_labels()
    draw_vertical_lines_and_labels()

    draw_hovered_divider()

    draw_cells_text()

    draw_selected_cell()
    draw_selection_region()

    // if(Math.random() < 1/60) save()

    // ctx.fillStyle = 'rgba(0,0,0,.1)'
    // if(row > 0) ctx.fillRect(LEFT_MARGIN, TOP_MARGIN, canvas.width, 10);
    // if(col > 0) ctx.fillRect(LEFT_MARGIN, TOP_MARGIN, 10, canvas.height);

}


function draw_label_backgrounds() {
    State.ctx.save()
    State.ctx.fillStyle = '#eee'
    State.ctx.fillRect(0, 0, State.canvas.width, TOP_MARGIN)
    State.ctx.fillRect(0, 0, LEFT_MARGIN, State.canvas.height)
    State.ctx.fillStyle = '#222'
    State.ctx.restore()
}



function draw_hovered_divider() {
    State.ctx.save()
    State.ctx.fillStyle = SELECTION_COLOR

    let col_divider = defined(State.dragging_col_divider)
        ? State.dragging_col_divider
        : get_hovered_col_divider()
    let row_divider = defined(State.dragging_row_divider)
        ? State.dragging_row_divider
        : get_hovered_row_divider()

    document.body.style.cursor = 'default'

    if (defined(col_divider) && col_divider >= 0) {
        document.body.style.cursor = 'col-resize'
        let [, x, width] = visible_col_n(col_divider)
        State.ctx.fillRect(x + width - RESIZE_HANDLE_DRAWN_WIDTH / 2, 0, RESIZE_HANDLE_DRAWN_WIDTH, TOP_MARGIN)
    }

    if (defined(row_divider) && row_divider >= 0) {
        document.body.style.cursor = 'row-resize'
        let [, y, height] = visible_row_n(row_divider)
        State.ctx.fillRect(0, y + height - RESIZE_HANDLE_DRAWN_WIDTH / 2, LEFT_MARGIN, RESIZE_HANDLE_DRAWN_WIDTH)
    }
    State.ctx.restore()
}





function draw_horizontal_lines_and_labels() {
    State.ctx.save()

    State.ctx.font = '20px Avenir'
    State.ctx.strokeStyle = '#ccc'
    State.ctx.lineWidth = 1
    State.ctx.textAlign = 'right'
    State.ctx.textBaseline = 'middle'

    for (let [row, rendered_height, height] of visible_rows()) {
        if (row == State.selected_row || (
            defined(State.selected_end_row)
            && row <= Math.max(State.selected_end_row, State.selected_row)
            && row >= Math.min(State.selected_end_row, State.selected_row))) {
            State.ctx.fillStyle = '#ddd'
            State.ctx.fillRect(0, rendered_height, LEFT_MARGIN, height)
        }
        State.ctx.fillStyle = '#222'
        State.ctx.fillText(row + 1, LEFT_MARGIN - 10, rendered_height + height / 2)

        State.ctx.beginPath()
        State.ctx.moveTo(0, rendered_height)
        State.ctx.lineTo(State.canvas.width, rendered_height)
        State.ctx.stroke()
    }

    State.ctx.restore()
}









function colname(c){
    return c.toString(26).split('').map(c => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'['0123456789abcdefghijklmnop'.indexOf(c)]).join('');
}


function draw_vertical_lines_and_labels() {
    State.ctx.save()

    State.ctx.font = '20px Avenir'
    State.ctx.strokeStyle = '#ccc'
    State.ctx.lineWidth = 1
    State.ctx.textAlign = 'center'
    State.ctx.textBaseline = 'middle'

    for (let [col, rendered_width, width] of visible_cols()) {
        if (col == State.selected_col || (
            defined(State.selected_end_col)
            && col <= Math.max(State.selected_end_col, State.selected_col)
            && col >= Math.min(State.selected_end_col, State.selected_col))) {
            State.ctx.fillStyle = '#ddd'
            State.ctx.fillRect(rendered_width, 0, width, TOP_MARGIN)
        }
        State.ctx.fillStyle = '#222'
        // let letters = 'abcdefghijklmnopqrstuvwxyz'.toUpperCase()
        // let b26 = '0123456789abcdefghijklmnop'
        // let text = col.toString(26).split('').map(c => letters[b26.indexOf(c)]).join('')
        let text = colname(col)
        State.ctx.fillText(text, rendered_width + width / 2, TOP_MARGIN / 2)

        State.ctx.beginPath()
        State.ctx.moveTo(rendered_width, 0)
        State.ctx.lineTo(rendered_width, State.canvas.height)
        State.ctx.stroke()
    }

    State.ctx.restore()
}













function draw_cell_text(row, col) {
    State.ctx.save()

    State.ctx.font = CONTENT_FONT
    State.ctx.textAlign = 'left'
    State.ctx.textBaseline = 'middle'
    State.ctx.lineWidth = 1
    State.ctx.strokeStyle = '#ccc'

    let [r, y, height] = row
    let [c, x, width] = col

    let text = cell_text(r, c)

    if (!text) return;

    let editing_this_cell = is_typing() && State.selected_row == r && State.selected_col == c
    let [edit_width, display_width] = cell_text_display_width(r, c)
    let cell_width = editing_this_cell
        ? edit_width
        : display_width

    State.ctx.clearRect(x + 1, y + 1, cell_width, height - 2)

    let text_width = measure_text(text).width;

    let result = evaluate(text);
    let drawing_result = result != text

    let result_width = measure_text(result).width + CELL_HORIZONTAL_PADDING * 2


    function draw_normal_text() {
        let cropped_text = text.slice(0, 5 + text.length * cell_width / text_width)
        State.ctx.textAlign = 'start'
        State.ctx.fillStyle = '#222'
        State.ctx.fillText(cropped_text, x + CELL_HORIZONTAL_PADDING, y + height / 2)
    }

    function draw_squished_text() {
        let cropped_text = text.slice(-Math.floor(text.length * (cell_width - result_width) / text_width))
        State.ctx.textAlign = 'end'
        State.ctx.fillStyle = '#222'


        var gradient = State.ctx.createLinearGradient(x, 0, x + 30, 0);
        gradient.addColorStop(0.5, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        State.ctx.fillText(cropped_text, x + CELL_HORIZONTAL_PADDING + cell_width - result_width, y + height / 2)

        State.ctx.fillStyle = gradient
        State.ctx.fillRect(x + 1, y + 1, 30, height - 2);
    }

    function draw_result() {
        // ctx.clearRect(x+1+cell_width - result_width, y+1, result_width, height - 2)
        State.ctx.textAlign = 'end'
        State.ctx.fillStyle = (result === 'ERROR') ? 'red' : '#007fff'
        State.ctx.fillText(result, x + cell_width - CELL_HORIZONTAL_PADDING, y + height / 2)
    }

    if (drawing_result) {
        draw_result()
        if (result_width + text_width < cell_width) {
            draw_normal_text()
        } else {
            draw_squished_text()
        }

    } else {
        draw_normal_text()
    }


    State.ctx.beginPath()
    State.ctx.moveTo(x + cell_width, y)
    State.ctx.lineTo(x + cell_width, y + height)
    State.ctx.stroke()

    State.ctx.restore()
}


function evaluate(text) {
    return text
}

function draw_cells_text() {
    for (let { row, col } of visible_cells()) {
        draw_cell_text(row, col)
    }
}



function cell_text_display_width(r, c) {
    State.ctx.font = CONTENT_FONT
    let text = cell_text(r, c)
    var desired_width = measure_text(text).width + CELL_HORIZONTAL_PADDING;

    let result = evaluate(text)
    if (result != text) {
        text += result;
        desired_width += measure_text(result).width + CELL_HORIZONTAL_PADDING
    }

    let display_width = col_width(c)
    let edit_width = display_width
    let next_col = c + 1
    let hit_filled_cell = false
    while (edit_width < desired_width) {
        let next_col_width = col_width(next_col)

        if (!cell_text(r, next_col) && !hit_filled_cell) display_width += next_col_width
        else hit_filled_cell = true;

        edit_width += next_col_width
        next_col++
    }
    return [edit_width, display_width]
}













function draw_selected_cell() {

    // if(defined(selected_end_col) || defined(selected_end_row)) return;

    State.ctx.save()

    let row = visible_row_n(State.selected_row),
        col = visible_col_n(State.selected_col)

    if (!row || !col) return;

    if (is_typing()) draw_cell_text(row, col);

    let [edit_width] = cell_text_display_width(State.selected_row, State.selected_col)
    let width = is_typing()
        ? edit_width
        : col_width(State.selected_col)

    let height = State.row_heights[State.selected_row] || DEFAULT_ROW_HEIGHT
    let [selected_x, selected_y] = cell_x_y(State.selected_row, State.selected_col)

    State.ctx.strokeStyle = SELECTION_COLOR
    State.ctx.lineWidth = 4
    State.ctx.strokeRect(selected_x, selected_y, width, height)
    // ctx.fillStyle = SELECTION_COLOR
    // ctx.strokeStyle = '#fff'
    // ctx.strokeRect(selected_x + width - 4, selected_y + height - 4, 8,8)
    // ctx.fillRect(selected_x + width - 4, selected_y + height - 4, 8,8)

    State.ctx.restore()
}



function draw_selection_region() {

    let region = get_selection_region()
    if (region) draw_blue_box(...region)

}


function get_selection_region() {
    if (defined(State.selected_end_row) && defined(State.selected_end_col)) return [
        Math.min(State.selected_row, State.selected_end_row),
        Math.min(State.selected_col, State.selected_end_col),
        Math.max(State.selected_row, State.selected_end_row),
        Math.max(State.selected_col, State.selected_end_col)
    ]
}



function draw_blue_box(start_row, start_col, end_row, end_col) {
    State.ctx.save()

    let [start_x, start_y] = cell_x_y(Math.max(start_row, State.viewport_row), Math.max(start_col, State.viewport_col))

    end_col = visible_col_n(Math.min(end_col, last_visible_col()[0]))
    end_row = visible_row_n(Math.min(end_row, last_visible_row()[0]))

    if (!end_row || !end_col) return;

    let [, x, width] = end_col
    let [, y, height] = end_row

    State.ctx.lineWidth = 1
    State.ctx.strokeStyle = SELECTION_COLOR
    State.ctx.strokeRect(start_x, start_y, x + width - start_x, y + height - start_y)

    State.ctx.fillStyle = 'rgba(80, 150, 255, .1)'
    State.ctx.fillRect(start_x, start_y, x + width - start_x, y + height - start_y)



    State.ctx.restore()
}










/*\
|*|
|*|
|*|
|*|
|*|
|*|
|*|
|*|       Events
|*|
|*|
|*|
|*|
|*|
|*|
|*|
\*/



function handle_mousewheel(e) {
    e.preventDefault()

    State.keygetter.blur()

    State.scroll_x += e.deltaX * X_SCROLL_SPEED
    State.scroll_y += e.deltaY * Y_SCROLL_SPEED

    let width = col_width(State.viewport_col)
    let height = State.row_heights[State.viewport_row] || DEFAULT_ROW_HEIGHT
    let prev_width = col_width(State.viewport_col - 1)
    let prev_height = State.row_heights[State.viewport_row - 1] || DEFAULT_ROW_HEIGHT

    while (State.scroll_x > width) {
        State.scroll_x -= width
        State.viewport_col++
    }
    while (State.scroll_x < -prev_width) {
        State.scroll_x += prev_width
        State.viewport_col--
    }
    while (State.scroll_y > height) {
        State.scroll_y -= height
        State.viewport_row++
    }
    while (State.scroll_y < -prev_height) {
        State.scroll_y += prev_height
        State.viewport_row--
    }

    State.viewport_row = Math.max(State.viewport_row, 0)
    State.viewport_col = Math.max(State.viewport_col, 0)
}









function paste(text, region = [State.selected_row, State.selected_col]) {
    let row = region[0]
    text.split(/\r\n|\r|\n/).forEach(line => {
        let col = region[1]
        line.split('\t').forEach(entry => {
            State.user_content[[row, col]] = entry
            col++
        })
        row++
    })
}



function insert_csv(data, row = 0, col = 0) {
    let lines = data.split(/\r\n|\r|\n/).map(line => line.split('\t'))

    let region = [
        row,
        col,
        row + lines.length,
        col + Math.max(...lines.map(line => line.length))
    ]

    add_undo_action(region)

    paste(data, region)
    // auto_fill() 
}

// window.insert_csv = insert_csv

// window.save_csv = save_csv



function handle_paste(e) {
    let data = e.clipboardData.getData('text/plain')
    if (data.includes('\n') || data.includes('\t') || !is_typing()) {
        e.preventDefault()
        insert_csv(data, State.selected_row, State.selected_col)
    }
}


function filled_region(region) {
    let [start_row, start_col, end_row, end_col] = region

    if (end_row == Infinity) { // copy ot end of allowed region if finite
        let finite_end_row = start_row
        let finite_end_col = start_col

        Object.keys(State.user_content).forEach(k => {
            let [r, c] = k.split(',')
            finite_end_row = Math.max(finite_end_row, r);
            finite_end_col = Math.max(finite_end_col, c);
        })

        end_row = finite_end_row
        end_col = finite_end_col
    }

    return [start_row, start_col, end_row, end_col]
}



function to_text(region, method = 'computed') {
    let [start_row, start_col, end_row, end_col] = filled_region(region)

    return _.range(start_row, end_row + 1)
        .map(row => _.range(start_col, end_col + 1)
            .map(col => {
                if (method === 'computed') return evaluate(cell_text(row, col))
                else if (method === 'autofilled') return cell_text(row, col)
                else if (method === 'input') return State.user_content[[row, col]]
                else throw 'on no!'
            })
            .join('\t'))
        .join('\n')
}

function handle_copy(e) {

    if (is_typing()) return;

    e.preventDefault()

    let region = get_selection_region() || [State.selected_row, State.selected_col, State.selected_row, State.selected_col]
    let data = e.shiftKey ? to_text(region, 'autofilled') : to_text(region, 'computed')

    console.log('copy data', data)
    e.clipboardData.setData('text/plain', data);

}


function handle_cut(e) {
    if (is_typing()) return;
    e.preventDefault()

    let region = get_selection_region() || [State.selected_row, State.selected_col, State.selected_row, State.selected_col]

    let data = to_text(region)
    delete_region(region)

    e.clipboardData.setData('text/plain', data);
}


function delete_region(region) {
    let [start_row, start_col, end_row, end_col] = filled_region(region)

    add_undo_action(region)

    _.range(start_row, end_row + 1)
        .forEach(row =>
            _.range(start_col, end_col + 1)
                .forEach(col => {
                    delete State.user_content[[row, col]]
                }))

    // delete all empty columns
    // cleanup_autofill()
    // auto_fill()

}


function handle_blur(e){
    State.keygetter.style.display = 'none';
}


function sync_canvas_and_keygetter() {
    State.ctx.save()
    State.ctx.font = CONTENT_FONT
    let desired_width = measure_text(State.keygetter.value).width
    State.keygetter.style.width = (measure_text(State.keygetter.value).width + CELL_HORIZONTAL_PADDING + 2) / SCALE
    State.user_content[[State.selected_row, State.selected_col]] = State.keygetter.value
    State.ctx.restore()
}




function cell_text(r, c) {

    if (State.user_content[[r, c]]) {
        return State.user_content[[r, c]];
    }

    return ''
}



function handle_keydown(e) {
    if (e.keyCode == 9) {
        e.preventDefault()
        // auto_fill()
        e.shiftKey
            ? bump_selected(0, -1)
            : bump_selected(0, 1)
    }

    if (e.keyCode == 13 && is_typing()) {
        // auto_fill()
        bump_selected(1, 0)
    } else if (e.keyCode == 13 && !is_typing()) start_typing()

    var bump = e.shiftKey ? bump_selected_end : bump_selected
    if (e.keyCode == 37 && (!is_typing() || State.keygetter.selectionStart === 0)) bump(0, -1)
    if (e.keyCode == 38) bump(-1, 0)
    if (e.keyCode == 39 && (!is_typing() || State.keygetter.selectionEnd === State.keygetter.value.length)) bump(0, 1)
    if (e.keyCode == 40) bump(1, 0)


    if ((e.keyCode == 8 || e.keyCode == 46) && !is_typing()) {
        let region = get_selection_region() || [State.selected_row, State.selected_col, State.selected_row, State.selected_col]
        delete_region(region)
    }

    // if([17, 91].includes(e.keyCode)) e.metaKey = true

    // console.log(e.keyCode)
    if (e.keyCode == 67 && e.metaKey && !is_typing()) { //c
        console.log('asdf')
    }


    if (e.keyCode == 90 && e.metaKey && !is_typing()) { //z
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        // auto_fill()
    }
    if (e.keyCode == 65 && e.metaKey && !is_typing()) { //a
        set_selected(0, 0)
        State.selected_end_row = Infinity
        State.selected_end_col = Infinity
    }
}

function handle_keyup(e){
    if ([17, 91].includes(e.keyCode)) e.metaKey = false
}

function handle_keypress(e) {
    if (!is_typing() && e.keyCode != 13) {
        // console.log(String.fromCharCode(e.keyCode)
        State.user_content[[State.selected_row, State.selected_col]] = ''
        start_typing()
    }
}


function handle_mousemove(e){
    State.mouse_x = e.clientX * SCALE
    State.mouse_y = e.clientY * SCALE
}

function handle_mousedown(e){

    let start_x = e.clientX * SCALE
    let start_y = e.clientY * SCALE

    let [clicked_row, clicked_col] = cell_row_col(start_x, start_y)
    let col_divider = get_hovered_col_divider()
    let row_divider = get_hovered_row_divider()

    var move, up

    if (defined(clicked_row) && defined(clicked_col)) {
        if (e.shiftKey) {
            State.selected_end_row = clicked_row
            State.selected_end_col = clicked_col
        } else {
            set_selected(clicked_row, clicked_col)
        }

        move = function () {
            scroll_into_view(State.selected_end_row, State.selected_end_col)
                ;[State.selected_end_row, State.selected_end_col] = cell_row_col(State.mouse_x, State.mouse_y)
            if (!defined(State.selected_end_row)) State.selected_end_row = Math.max(State.viewport_row - 1, 0)
            if (!defined(State.selected_end_col)) State.selected_end_col = Math.max(State.viewport_col - 1, 0)
        }

        let int = setInterval(move, 30)

        up = function () {
            clearInterval(int)
        }

    } else if (defined(clicked_row) && defined(row_divider)) {

        let start_row_height = State.row_heights[row_divider] || DEFAULT_ROW_HEIGHT
        State.dragging_row_divider = row_divider

        move = function (e) {
            let dy = e.clientY * SCALE - start_y
            State.row_heights[row_divider] = Math.max(start_row_height + dy, DEFAULT_ROW_HEIGHT)
        }

        up = function () {
            State.dragging_row_divider = undefined
        }

    } else if (defined(clicked_col) && defined(col_divider)) {

        let start_col_width = col_width(col_divider)
        State.dragging_col_divider = col_divider

        move = function (e) {
            let dx = e.clientX * SCALE - start_x
            State.col_widths[col_divider] = Math.max(start_col_width + dx, DEFAULT_COL_WIDTH)
        }

        up = function () {
            State.dragging_col_divider = undefined
        }

    } else if (defined(clicked_col)) {

        State.selected_row = 0
        State.selected_col = clicked_col

        State.selected_end_col = undefined
        State.selected_end_row = undefined

        move = function (e) {
            scroll_into_view(undefined, State.selected_end_col)
            State.selected_end_row = Infinity
                ;[, State.selected_end_col] = cell_row_col(State.mouse_x, State.mouse_y)
            if (!defined(State.selected_end_col)) State.selected_end_col = Math.max(State.viewport_col - 1, 0)
        }

        let int = setInterval(move, 30)

        up = function () {
            clearInterval(int)
        }

    } else if (defined(clicked_row)) {

        State.selected_col = 0
        State.selected_row = clicked_row

        State.selected_end_col = undefined
        State.selected_end_row = undefined

        move = function (e) {
            scroll_into_view(State.selected_end_row, undefined)
            State.selected_end_col = Infinity
                ;[State.selected_end_row] = cell_row_col(State.mouse_x, State.mouse_y)
            if (!defined(State.selected_end_row)) State.selected_end_row = Math.max(State.viewport_row - 1, 0)
        }

        let int = setInterval(move, 30)

        up = function () {
            clearInterval(int)
        }

    }

    function onup() {
        if (up) up();
        document.removeEventListener('mousemove', move)
        document.removeEventListener('mouseup', onup)
    }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', onup)

}




function handle_dblclick(e) {
    State.ctx.save()
    State.ctx.font = CONTENT_FONT

    let [row, col] = cell_row_col(
        e.clientX * SCALE,
        e.clientY * SCALE)

    let col_divider = get_hovered_col_divider()

    if (defined(row) && defined(col) && !is_typing()) {
        start_typing()
    } else if (defined(col_divider)) {
        let max_width = DEFAULT_COL_WIDTH - CELL_HORIZONTAL_PADDING * 2
        let max_row = Math.max(...Object.keys(State.user_content).map(k => +k.split(',')[0]), last_visible_row()[0])

        for (var r = 0; r < max_row; r++) {
            let text = cell_text(r, col_divider)
            let result = evaluate(text)
            let combined = (text == result) ? text : (text + ' ' + result);
            if (combined.length > 1) {
                max_width = Math.max(max_width, measure_text(combined).width)
            }
        }
        State.col_widths[col_divider] = max_width + CELL_HORIZONTAL_PADDING * 2
    }

    State.ctx.restore()
}



canvas.addEventListener('wheel', e => handle_mousewheel(e))
document.addEventListener('cut', e => handle_cut(e))
document.addEventListener('paste', e => handle_paste(e))
document.addEventListener('copy', e => handle_copy(e))
State.keygetter.addEventListener('blur', e => handle_blur(e))
State.keygetter.addEventListener('input', e => sync_canvas_and_keygetter())

document.addEventListener('keyup', e => handle_keyup(e))
document.addEventListener('keydown', e => handle_keydown(e))
document.addEventListener('keypress', e => handle_keypress(e))
document.addEventListener('mousemove', e => handle_mousemove(e))
State.canvas.addEventListener('mousedown', e => handle_mousedown(e))
document.addEventListener('dblclick', e => handle_dblclick(e))






function get_hovered_col_divider() {
    let [row, col] = cell_row_col(State.mouse_x, State.mouse_y)

    if (!defined(row) && defined(col)) {

        let [, prev_x, width] = visible_col_n(col)
        let next_x = prev_x + width

        if (State.mouse_x - prev_x <= RESIZE_HANDLE_WIDTH / 2) return col - 1
        if (next_x - State.mouse_x <= RESIZE_HANDLE_WIDTH / 2) return col

    }
}

function get_hovered_row_divider() {
    let [row, col] = cell_row_col(State.mouse_x, State.mouse_y)

    if (!defined(col) && defined(row)) {

        let [, prev_y, height] = visible_row_n(row)
        let next_y = prev_y + height

        if (State.mouse_y - prev_y <= RESIZE_HANDLE_WIDTH / 2) return row - 1
        if (next_y - State.mouse_y <= RESIZE_HANDLE_WIDTH / 2) return row

    }
}





/// Utilities after this!


function col_width(c){
    return State.col_widths[c] || DEFAULT_COL_WIDTH
}

function is_typing() {
    return document.activeElement === State.keygetter
}

function* visible_cols() {
    let rendered_width = LEFT_MARGIN
    let cur_col = State.viewport_col
    while (rendered_width <= State.canvas.width) {
        let width = col_width(cur_col)
        yield [cur_col++, rendered_width, width]
        rendered_width += width
    }
}

function* visible_rows() {
    let rendered_height = TOP_MARGIN
    let cur_row = State.viewport_row
    while (rendered_height <= State.canvas.height) {
        let height = State.row_heights[cur_row] || DEFAULT_ROW_HEIGHT
        yield [cur_row++, rendered_height, height]
        rendered_height += height
    }
}

function* visible_cells() {
    for (let row of visible_rows())
        for (let col of visible_cols()) {
            yield { row, col }
        }
}

function visible_row_n(r) {
    let row
    for (row of visible_rows()) if (row[0] === r) return row
}

function visible_col_n(c) {
    let col
    for (col of visible_cols()) if (col[0] === c) return col
}

function last_visible_row() {
    let row
    for (row of visible_rows());
    return row
}

function last_visible_col() {
    let col
    for (col of visible_cols());
    return col
}

function cell_x_y(row, col) {
    let cy, cx;
    for (let [r, y, height] of visible_rows()) {
        if (r === row) cy = y;
    }
    for (let [c, x, width] of visible_cols()) {
        if (c === col) cx = x;
    }
    return [cx, cy]
}

function cell_row_col(x, y) {
    let r, c;
    for (let [row, cy] of visible_rows()) {
        if (cy > y) break;
        r = row
    }
    for (let [col, cx] of visible_cols()) {
        if (cx > x) break;
        c = col
    }
    return [r, c]
}

function set_selected(row, col) {

    let old_text = cell_text(State.selected_row, State.selected_col)


    row = Math.max(row, 0)
    col = Math.max(col, 0)

    State.selected_col = col
    State.selected_row = row

    State.keygetter.blur()
    State.selected_end_row = undefined
    State.selected_end_col = undefined

    scroll_into_view(row, col)
}


function set_selected_end(row, col) {
    row = Math.max(row, 0)
    col = Math.max(col, 0)

    // selected_col = col
    // selected_row = row

    State.keygetter.blur()
    State.selected_end_row = row
    State.selected_end_col = col

    scroll_into_view(row, col)
}


function bump_selected_end(rows, cols) {
    set_selected_end(
        _.defaultTo(State.selected_end_row, State.selected_row) + rows,
        _.defaultTo(State.selected_end_col, State.selected_col) + cols)
}

function bump_selected(rows, cols) {
    set_selected(State.selected_row + rows, State.selected_col + cols)
}

function scroll_into_view(r, c) {
    if (defined(r) && r < State.viewport_row) State.viewport_row = r;
    if (defined(c) && c < State.viewport_col) State.viewport_col = c;

    let [last_row] = last_visible_row()
    let [last_col] = last_visible_col()

    if (defined(r) && r > last_row - 1) State.viewport_row += r - last_row + 1
    if (defined(c) && c > last_col - 1) State.viewport_col += c - last_col + 1
}



function start_typing() {
    // console.log('start typing')
    add_undo_action([State.selected_row, State.selected_col, State.selected_row, State.selected_col])

    State.selected_end_col = undefined
    State.selected_end_row = undefined

    State.keygetter.style.display = 'initial'
    State.keygetter.focus()
    State.keygetter.value = State.user_content[[State.selected_row, State.selected_col]] || ''
    let [x, y] = cell_x_y(State.selected_row, State.selected_col)
    State.keygetter.style.top = y / SCALE + 'px'
    State.keygetter.style.left = x / SCALE + 'px'
    State.keygetter.style['padding-left'] = CELL_HORIZONTAL_PADDING / SCALE + 'px'
    State.keygetter.style.height = (State.row_heights[State.selected_row] || DEFAULT_ROW_HEIGHT) / SCALE + 'px'
    State.keygetter.style['font-size'] = (DEFAULT_ROW_HEIGHT - 20) / SCALE + 'px'
    sync_canvas_and_keygetter()
}

let measure_text_cache = {}
function measure_text(text) {

    if (!measure_text_cache[text]) {
        State.ctx.save()
        State.ctx.font = CONTENT_FONT
        measure_text_cache[text] = State.ctx.measureText(text)
        State.ctx.restore()
    }

    return measure_text_cache[text]

}


function defined(x) {
    return typeof x != 'undefined'
}

function action(region) {
    return {
        region,
        data: to_text(region, 'input'),
        viewport_row: State.viewport_row, viewport_col: State.viewport_col,
        selected_row: State.selected_row, selected_col: State.selected_col,
        selected_end_row: State.selected_end_row, selected_end_col: State.selected_end_col
    }
}

function add_undo_action(region, clear_redo = true) {
    if (clear_redo) State.redo_actions = []
    State.undo_actions.push(action(region))
}

function add_redo_action(region) {
    State.redo_actions.push(action(region))
}

function execute(action) {
    State.viewport_row = action.viewport_row; State.viewport_col = action.viewport_col;
    State.selected_row = action.selected_row; State.selected_col = action.selected_col;
    State.selected_end_row = action.selected_end_row; State.selected_end_col = action.selected_end_col;
    paste(action.data, action.region)
    // auto_fill()
}

function undo() {
    let action = State.undo_actions.pop()
    if (!action) return;

    add_redo_action(action.region)
    execute(action)
}


function redo() {
    let action = State.redo_actions.pop()

    if (!action) return;

    add_undo_action(action.region, false)
    execute(action)
}

let tick = () => {
    requestAnimationFrame(tick)
    render()
}
requestAnimationFrame(tick)
