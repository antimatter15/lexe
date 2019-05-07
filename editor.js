import React from 'react'
import ReactDOM from 'react-dom'
import _ from "lodash"


// const CELL_HORIZONTAL_PADDING = 10
// const CELL_BOTTOM_PADDING = 20

// const DEFAULT_COL_WIDTH = 400
// const DEFAULT_ROW_HEIGHT = 60

// const LEFT_MARGIN = 60
// const TOP_MARGIN = DEFAULT_ROW_HEIGHT

// const RESIZE_HANDLE_WIDTH = 20
// const RESIZE_HANDLE_DRAWN_WIDTH = 4

// const SELECTION_COLOR = '#48f'

// const CONTENT_FONT = (DEFAULT_ROW_HEIGHT - 20) + 'px Helvetica'

// const X_SCROLL_SPEED = 4
// const Y_SCROLL_SPEED = 4

const CELL_HORIZONTAL_PADDING = 6
const CELL_BOTTOM_PADDING = 14

const DEFAULT_COL_WIDTH = 200
const DEFAULT_ROW_HEIGHT = 50

const LEFT_MARGIN = 60
const TOP_MARGIN = DEFAULT_ROW_HEIGHT

const RESIZE_HANDLE_WIDTH = 20
const RESIZE_HANDLE_DRAWN_WIDTH = 4

const SELECTION_COLOR = '#48f'

const CONTENT_FONT = DEFAULT_ROW_HEIGHT - 20 + 'px Helvetica'

const X_SCROLL_SPEED = 4
const Y_SCROLL_SPEED = 4



export default class Lexe extends React.Component {

    componentDidMount(){
        let keygetter = this.keygetter,
            canvas = this.canvas,
            main = this.main;

        let state = this.props.state;

        let StateZ = {
            keygetter: keygetter,
            main: main,
            ctx: canvas.getContext('2d'),
            canvas: canvas,
            mouse_x: 0,
            mouse_y: 0,
            scroll_x: 0,
            scroll_y: 0,
            dragging_col_divider: undefined,
            dragging_row_divider: undefined,
            undo_actions: [], 
            redo_actions: [],

            // user_content: {}, //
            // selected_end_col: 0, //
            // selected_end_row: 0, //
            // selected_row: 0, //
            // selected_col: 0, //
            // col_widths: {}, //
            // row_heights: {}, //
            // viewport_col: 0, // 
            // viewport_row: 0, //

            user_content: _.cloneDeep(state.user_content) || {},
            selected_end_col: state.selected_end_col || undefined,
            selected_end_row: state.selected_end_row || undefined,
            selected_row: state.selected_row || undefined,
            selected_col: state.selected_col || undefined,
            col_widths: _.cloneDeep(state.col_widths) || {},
            row_heights: _.cloneDeep(state.row_heights) || {},
            viewport_col: state.viewport_col || 0,
            viewport_row: state.viewport_row || 0,

            changed: () => {
                let state = {
                    user_content: StateZ.user_content,
                    selected_end_col: StateZ.selected_end_col,
                    selected_end_row: StateZ.selected_end_row,
                    selected_row: StateZ.selected_row,
                    selected_col: StateZ.selected_col,
                    col_widths: StateZ.col_widths,
                    row_heights: StateZ.row_heights,
                    viewport_col: StateZ.viewport_col,
                    viewport_row: StateZ.viewport_row,
                }

                if(!_.isEqual(this.props.state, state)){
                    this.props.updateState(state)
                }
            }
        }

        console.log(StateZ)

        StateZ.keygetter.style.display = 'none';

        canvas.addEventListener('wheel', e => handle_mousewheel(StateZ, e))
        main.addEventListener('cut', e => handle_cut(StateZ, e))
        main.addEventListener('paste', e => handle_paste(StateZ, e))
        main.addEventListener('copy', e => handle_copy(StateZ, e))
        StateZ.keygetter.addEventListener('blur', e => handle_blur(StateZ, e))
        StateZ.keygetter.addEventListener('input', e => sync_canvas_and_keygetter(StateZ))

        main.addEventListener('keyup', e => handle_keyup(e))
        main.addEventListener('keydown', e => handle_keydown(StateZ, e))
        main.addEventListener('keypress', e => handle_keypress(StateZ, e))
        main.addEventListener('mousemove', e => handle_mousemove(StateZ, e))
        StateZ.canvas.addEventListener('mousedown', e => handle_mousedown(StateZ, e))
        main.addEventListener('dblclick', e => handle_dblclick(StateZ, e))

        const tick = () => {
            this.updater = requestAnimationFrame(tick)
            render(StateZ)
        }
        this.updater = requestAnimationFrame(tick)

        render(StateZ)
    }
    forceUpdate(){
        // this fixes a weird hot reloading bug
        // this.updater.enqueueForceUpdate is not a function
    }
    componentWillUnmount(){
        cancelAnimationFrame(this.updater)
    }
    shouldComponentUpdate(){
        return false
    }
    render(){
        return <div tabIndex={1} ref={e => this.main = e} style={{ outline: 0, height: 400 }}>
            <input type="text" ref={e => this.keygetter = e} style={{ display: 'none'}} />
            <canvas ref={e => this.canvas = e} />
        </div>
    }
}




function render(State) {
    State.canvas.width = State.main.clientWidth * devicePixelRatio
    State.canvas.height = State.main.clientHeight * devicePixelRatio

    State.canvas.style.width = (State.canvas.width / devicePixelRatio) + 'px'
    State.canvas.style.height = (State.canvas.height / devicePixelRatio) + 'px'

    State.ctx.clearRect(0, 0, State.canvas.width, State.canvas.height)

    draw_label_backgrounds(State)

    draw_horizontal_lines_and_labels(State)
    draw_vertical_lines_and_labels(State)

    draw_hovered_divider(State)

    draw_cells_text(State)

    draw_selected_cell(State)
    draw_selection_region(State)
}


function draw_label_backgrounds(State) {
    State.ctx.save()
    State.ctx.fillStyle = '#eee'
    State.ctx.fillRect(0, 0, State.canvas.width, TOP_MARGIN)
    State.ctx.fillRect(0, 0, LEFT_MARGIN, State.canvas.height)
    State.ctx.fillStyle = '#222'
    State.ctx.restore()
}



function draw_hovered_divider(State) {
    State.ctx.save()
    State.ctx.fillStyle = SELECTION_COLOR

    let col_divider = defined(State.dragging_col_divider)
        ? State.dragging_col_divider
        : get_hovered_col_divider(State)
    let row_divider = defined(State.dragging_row_divider)
        ? State.dragging_row_divider
        : get_hovered_row_divider(State)

    document.body.style.cursor = 'default'

    if (defined(col_divider) && col_divider >= 0) {
        let vis_col = visible_col_n(State, col_divider);
        if(vis_col){
            document.body.style.cursor = 'col-resize'
            let [, x, width] = vis_col
            State.ctx.fillRect(x + width - RESIZE_HANDLE_DRAWN_WIDTH / 2, 0, RESIZE_HANDLE_DRAWN_WIDTH, TOP_MARGIN)    
        }
    }

    if (defined(row_divider) && row_divider >= 0) {
        let vis_row = visible_row_n(State, row_divider);
        if(vis_row){
            document.body.style.cursor = 'row-resize'
            let [, y, height] = vis_row
            State.ctx.fillRect(0, y + height - RESIZE_HANDLE_DRAWN_WIDTH / 2, LEFT_MARGIN, RESIZE_HANDLE_DRAWN_WIDTH)
        }
    }
    State.ctx.restore()
}





function draw_horizontal_lines_and_labels(State) {
    State.ctx.save()

    State.ctx.font = '25px Avenir'
    State.ctx.strokeStyle = '#ccc'
    State.ctx.lineWidth = 1
    State.ctx.textAlign = 'right'
    State.ctx.textBaseline = 'middle'

    for (let [row, rendered_height, height] of visible_rows(State)) {
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


function draw_vertical_lines_and_labels(State) {
    State.ctx.save()

    State.ctx.font = '20px Avenir'
    State.ctx.strokeStyle = '#ccc'
    State.ctx.lineWidth = 1
    State.ctx.textAlign = 'center'
    State.ctx.textBaseline = 'middle'

    for (let [col, rendered_width, width] of visible_cols(State)) {
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













function draw_cell_text(State, row, col) {
    State.ctx.save()

    State.ctx.font = CONTENT_FONT
    State.ctx.textAlign = 'left'
    State.ctx.textBaseline = 'middle'
    State.ctx.lineWidth = 1
    State.ctx.strokeStyle = '#ccc'

    let [r, y, height] = row
    let [c, x, width] = col

    let text = cell_text(State, r, c)

    if (!text) return;

    let editing_this_cell = is_typing(State) && State.selected_row == r && State.selected_col == c
    let [edit_width, display_width] = cell_text_display_width(State, r, c)
    let cell_width = editing_this_cell
        ? edit_width
        : display_width

    State.ctx.clearRect(x + 1, y + 1, cell_width, height - 2)

    let text_width = measure_text(State, text).width;

    let result = evaluate(text);
    let drawing_result = result != text

    let result_width = measure_text(State, result).width + CELL_HORIZONTAL_PADDING * 2


    function draw_normal_text(State) {
        let cropped_text = text.slice(0, 5 + text.length * cell_width / text_width)
        State.ctx.textAlign = 'start'
        State.ctx.fillStyle = '#222'
        State.ctx.fillText(cropped_text, x + CELL_HORIZONTAL_PADDING, y + height / 2)
    }

    function draw_squished_text(State) {
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

    function draw_result(State) {
        // ctx.clearRect(x+1+cell_width - result_width, y+1, result_width, height - 2)
        State.ctx.textAlign = 'end'
        State.ctx.fillStyle = (result === 'ERROR') ? 'red' : '#007fff'
        State.ctx.fillText(result, x + cell_width - CELL_HORIZONTAL_PADDING, y + height / 2)
    }

    if (drawing_result) {
        draw_result(State)
        if (result_width + text_width < cell_width) {
            draw_normal_text(State)
        } else {
            draw_squished_text(State)
        }

    } else {
        draw_normal_text(State)
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

function draw_cells_text(State) {
    for (let { row, col } of visible_cells(State)) {
        draw_cell_text(State, row, col)
    }
}



function cell_text_display_width(State, r, c) {
    State.ctx.font = CONTENT_FONT
    let text = cell_text(State, r, c)
    var desired_width = measure_text(State, text).width + CELL_HORIZONTAL_PADDING;

    let result = evaluate(text)
    if (result != text) {
        text += result;
        desired_width += measure_text(State, result).width + CELL_HORIZONTAL_PADDING
    }

    let display_width = col_width(State, c)
    let edit_width = display_width
    let next_col = c + 1
    let hit_filled_cell = false
    while (edit_width < desired_width) {
        let next_col_width = col_width(State, next_col)

        if (!cell_text(State, r, next_col) && !hit_filled_cell) display_width += next_col_width
        else hit_filled_cell = true;

        edit_width += next_col_width
        next_col++
    }
    return [edit_width, display_width]
}













function draw_selected_cell(State) {

    // if(defined(selected_end_col) || defined(selected_end_row)) return;

    State.ctx.save()

    let row = visible_row_n(State, State.selected_row),
        col = visible_col_n(State, State.selected_col)

    if (!row || !col) return;

    if (is_typing(State)) draw_cell_text(State, row, col);

    let [edit_width] = cell_text_display_width(State, State.selected_row, State.selected_col)
    let width = is_typing(State)
        ? edit_width
        : col_width(State, State.selected_col)

    let height = State.row_heights[State.selected_row] || DEFAULT_ROW_HEIGHT
    let [selected_x, selected_y] = cell_x_y(State, State.selected_row, State.selected_col)

    State.ctx.strokeStyle = SELECTION_COLOR
    State.ctx.lineWidth = 4
    State.ctx.strokeRect(selected_x, selected_y, width, height)
    // ctx.fillStyle = SELECTION_COLOR
    // ctx.strokeStyle = '#fff'
    // ctx.strokeRect(selected_x + width - 4, selected_y + height - 4, 8,8)
    // ctx.fillRect(selected_x + width - 4, selected_y + height - 4, 8,8)

    State.ctx.restore()
}



function draw_selection_region(State) {
    let region = get_selection_region(State)
    if (region) draw_blue_box(State, ...region)
}


function get_selection_region(State) {
    if (defined(State.selected_end_row) && defined(State.selected_end_col)) return [
        Math.min(State.selected_row, State.selected_end_row),
        Math.min(State.selected_col, State.selected_end_col),
        Math.max(State.selected_row, State.selected_end_row),
        Math.max(State.selected_col, State.selected_end_col)
    ]
}



function draw_blue_box(State, start_row, start_col, end_row, end_col) {
    State.ctx.save()

    let [start_x, start_y] = cell_x_y(
        State,
        Math.max(start_row, State.viewport_row),
        Math.max(start_col, State.viewport_col)
    )

    end_col = visible_col_n(State, Math.min(end_col, last_visible_col(State)[0]))
    end_row = visible_row_n(State, Math.min(end_row, last_visible_row(State)[0]))

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



function handle_mousewheel(State, e) {
    e.preventDefault()

    State.keygetter.blur()
    State.main.focus()

    State.scroll_x += e.deltaX * X_SCROLL_SPEED
    State.scroll_y += e.deltaY * Y_SCROLL_SPEED

    let width = col_width(State, State.viewport_col)
    let height = State.row_heights[State.viewport_row] || DEFAULT_ROW_HEIGHT
    let prev_width = col_width(State, State.viewport_col - 1)
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

    State.changed()
}









function paste(State, text, region = [State.selected_row, State.selected_col]) {
    let row = region[0]
    text.split(/\r\n|\r|\n/).forEach(line => {
        let col = region[1]
        line.split('\t').forEach(entry => {
            State.user_content[[row, col]] = entry
            col++
        })
        row++
    })
    State.changed()
}



function insert_csv(State, data, row = 0, col = 0) {
    let lines = data.split(/\r\n|\r|\n/).map(line => line.split('\t'))

    let region = [
        row,
        col,
        row + lines.length,
        col + Math.max(...lines.map(line => line.length))
    ]

    add_undo_action(State, region)

    paste(State, data, region)
    // auto_fill() 
}

// window.insert_csv = insert_csv

// window.save_csv = save_csv



function handle_paste(State, e) {
    let data = e.clipboardData.getData('text/plain')
    if (data.includes('\n') || data.includes('\t') || !is_typing(State)) {
        e.preventDefault()
        insert_csv(State, data, State.selected_row, State.selected_col)
    }
}


function filled_region(State, region) {
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



function to_text(State, region, method = 'computed') {
    let [start_row, start_col, end_row, end_col] = filled_region(State, region)

    return _.range(start_row, end_row + 1)
        .map(row => _.range(start_col, end_col + 1)
            .map(col => {
                if (method === 'computed') return evaluate(cell_text(State, row, col));
                else if (method === 'autofilled') return cell_text(State, row, col);
                else if (method === 'input') return State.user_content[[row, col]]
                else throw 'on no!'
            })
            .join('\t'))
        .join('\n');
}

function handle_copy(State, e) {

    if (is_typing(State)) return;

    e.preventDefault()

    let region = get_selection_region(State) || [State.selected_row, State.selected_col, State.selected_row, State.selected_col]
    let data = e.shiftKey ? to_text(State, region, 'autofilled') : to_text(State, region, 'computed')

    console.log('copy data', data)
    e.clipboardData.setData('text/plain', data);

}


function handle_cut(State, e) {
    if (is_typing(State)) return;
    e.preventDefault()

    let region = get_selection_region(State) || [State.selected_row, State.selected_col, State.selected_row, State.selected_col]

    let data = to_text(State, region)
    delete_region(State, region)

    e.clipboardData.setData('text/plain', data);
}


function delete_region(State, region) {
    let [start_row, start_col, end_row, end_col] = filled_region(State, region)

    add_undo_action(State, region)

    _.range(start_row, end_row + 1)
        .forEach(row =>
            _.range(start_col, end_col + 1)
                .forEach(col => {
                    delete State.user_content[[row, col]]
                }))

    State.changed()

    // delete all empty columns
    // cleanup_autofill()
    // auto_fill()

}


function handle_blur(State, e) {
    State.keygetter.style.display = 'none';
    State.main.focus()
}


function sync_canvas_and_keygetter(State) {
    State.ctx.save()
    State.ctx.font = CONTENT_FONT
    let desired_width = measure_text(State, State.keygetter.value).width
    State.keygetter.style.width = (measure_text(State, State.keygetter.value).width + CELL_HORIZONTAL_PADDING + 2) / devicePixelRatio
    State.user_content[[State.selected_row, State.selected_col]] = State.keygetter.value
    State.ctx.restore()
    State.changed()
}




function cell_text(State, r, c) {

    if (State.user_content[[r, c]]) {
        return State.user_content[[r, c]];
    }

    return ''
}



function handle_keydown(State, e) {
    if (e.keyCode == 9) { // tab
        e.preventDefault()
        // auto_fill()
        e.shiftKey
            ? bump_selected(State, 0, -1)
            : bump_selected(State, 0, 1)
    }

    if (e.keyCode == 13 && is_typing(State)) { // enter
        // auto_fill()
        bump_selected(State, 1, 0)
    } else if (e.keyCode == 13 && !is_typing(State)) start_typing(State)

    var bump = e.shiftKey ? bump_selected_end : bump_selected
    if (e.keyCode == 37 && (!is_typing(State) || State.keygetter.selectionStart === 0)) bump(State, 0, -1)
    if (e.keyCode == 38) bump(State, -1, 0)
    if (e.keyCode == 39 && (!is_typing(State) || State.keygetter.selectionEnd === State.keygetter.value.length)) bump(State, 0, 1)
    if (e.keyCode == 40) bump(State, 1, 0)


    if ((e.keyCode == 8 || e.keyCode == 46) && !is_typing(State)) {
        e.preventDefault()
        let region = get_selection_region(State) || [State.selected_row, State.selected_col, State.selected_row, State.selected_col]
        delete_region(State, region)
    }

    // if([17, 91].includes(e.keyCode)) e.metaKey = true

    // console.log(e.keyCode)
    if (e.keyCode == 67 && e.metaKey && !is_typing(State)) { //c
        console.log('asdf')
    }


    if (e.keyCode == 90 && e.metaKey && !is_typing(State)) { //z
        e.preventDefault()
        if (e.shiftKey) redo(State)
        else undo(State)
        // auto_fill()
    }
    if (e.keyCode == 65 && e.metaKey && !is_typing(State)) { //a
        set_selected(State, 0, 0)
        State.selected_end_row = Infinity
        State.selected_end_col = Infinity

        State.changed()
    }
}

function handle_keyup(e){
    // if ([17, 91].includes(e.keyCode)) e.metaKey = false
}

function handle_keypress(State, e) {
    if (!is_typing(State) && e.keyCode != 13) {
        // console.log(String.fromCharCode(e.keyCode)
        State.user_content[[State.selected_row, State.selected_col]] = ''
        start_typing(State)
        State.changed()
    }
}


function handle_mousemove(State, e) {
    [State.mouse_x, State.mouse_y] = xy_from_event(State, e)
}



function xy_from_event(State, e){
    let box = State.canvas.getBoundingClientRect();
    return [
        (e.clientX - box.left) * devicePixelRatio, 
        (e.clientY - box.top) * devicePixelRatio
    ]
}

function handle_mousedown(State, e) {

    let [start_x, start_y] = xy_from_event(State, e)

    let [clicked_row, clicked_col] = cell_row_col(State, start_x, start_y)
    let col_divider = get_hovered_col_divider(State)
    let row_divider = get_hovered_row_divider(State)

    var move, up

    if (defined(clicked_row) && defined(clicked_col)) {
        if (e.shiftKey) {
            State.selected_end_row = clicked_row
            State.selected_end_col = clicked_col

            State.changed()
        } else {
            set_selected(State, clicked_row, clicked_col)
        }

        move = function () {
            scroll_into_view(State, State.selected_end_row, State.selected_end_col)
                ;[State.selected_end_row, State.selected_end_col] = cell_row_col(State, State.mouse_x, State.mouse_y)
            if (!defined(State.selected_end_row)) State.selected_end_row = Math.max(State.viewport_row - 1, 0)
            if (!defined(State.selected_end_col)) State.selected_end_col = Math.max(State.viewport_col - 1, 0)

            
        }

        let int = setInterval(move, 30)

        up = function () {
            clearInterval(int)
            State.changed()
        }

    } else if (defined(clicked_row) && defined(row_divider)) {

        let start_row_height = State.row_heights[row_divider] || DEFAULT_ROW_HEIGHT
        State.dragging_row_divider = row_divider

        move = function (e) {
            let dy = xy_from_event(State, e)[1] - start_y
            State.row_heights[row_divider] = Math.max(start_row_height + dy, DEFAULT_ROW_HEIGHT)

        }

        up = function () {
            State.dragging_row_divider = undefined

            State.changed()

        }

    } else if (defined(clicked_col) && defined(col_divider)) {

        let start_col_width = col_width(State, col_divider)
        State.dragging_col_divider = col_divider

        move = function (e) {
            let dx = xy_from_event(State, e)[0] - start_x
            State.col_widths[col_divider] = Math.max(start_col_width + dx, DEFAULT_COL_WIDTH)

            
        }

        up = function () {
            State.dragging_col_divider = undefined
            State.changed()
        }

    } else if (defined(clicked_col)) {

        State.selected_row = 0
        State.selected_col = clicked_col

        State.selected_end_col = undefined
        State.selected_end_row = undefined


        move = function (e) {
            scroll_into_view(State, undefined, State.selected_end_col)
            State.selected_end_row = Infinity
                ;[, State.selected_end_col] = cell_row_col(State, State.mouse_x, State.mouse_y)
            if (!defined(State.selected_end_col)) State.selected_end_col = Math.max(State.viewport_col - 1, 0)

            
        }

        let int = setInterval(move, 30)

        up = function () {
            clearInterval(int)
            State.changed()
        }

        move(e)

        
    } else if (defined(clicked_row)) {

        State.selected_col = 0
        State.selected_row = clicked_row

        State.selected_end_col = undefined
        State.selected_end_row = undefined

        move = function (e) {
            scroll_into_view(State, State.selected_end_row, undefined)
            State.selected_end_col = Infinity
                ;[State.selected_end_row] = cell_row_col(State, State.mouse_x, State.mouse_y)
            if (!defined(State.selected_end_row)) State.selected_end_row = Math.max(State.viewport_row - 1, 0)
        }

        let int = setInterval(move, 30)

        up = function () {
            clearInterval(int)
            State.changed()
        }

        move(e)
    } else {
        State.selected_col = 0
        State.selected_row = 0

        State.selected_end_col = Infinity
        State.selected_end_row = Infinity

        move = function () {            
        }

        up = function () {
            State.changed()
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




function handle_dblclick(State, e) {
    State.ctx.save()
    State.ctx.font = CONTENT_FONT

    let [row, col] = cell_row_col(State, ...xy_from_event(State, e))

    let col_divider = get_hovered_col_divider(State)

    if (defined(row) && defined(col) && !is_typing(State)) {
        start_typing(State)
    } else if (defined(col_divider)) {
        let max_width = DEFAULT_COL_WIDTH - CELL_HORIZONTAL_PADDING * 2
        let max_row = Math.max(...Object.keys(State.user_content).map(k => +k.split(',')[0]), last_visible_row(State)[0])

        for (var r = 0; r < max_row; r++) {
            let text = cell_text(State, r, col_divider)
            let result = evaluate(text)
            let combined = (text == result) ? text : (text + ' ' + result);
            if (combined.length > 1) {
                max_width = Math.max(max_width, measure_text(State, combined).width)
            }
        }
        State.col_widths[col_divider] = max_width + CELL_HORIZONTAL_PADDING * 2
    }

    State.ctx.restore()
}






function get_hovered_col_divider(State) {
    let [row, col] = cell_row_col(State, State.mouse_x, State.mouse_y)

    if (!defined(row) && defined(col)) {

        let [, prev_x, width] = visible_col_n(State, col)
        let next_x = prev_x + width

        if (State.mouse_x - prev_x <= RESIZE_HANDLE_WIDTH / 2) return col - 1
        if (next_x - State.mouse_x <= RESIZE_HANDLE_WIDTH / 2) return col

    }
}

function get_hovered_row_divider(State) {
    let [row, col] = cell_row_col(State, State.mouse_x, State.mouse_y)

    if (!defined(col) && defined(row)) {

        let [, prev_y, height] = visible_row_n(State, row)
        let next_y = prev_y + height

        if (State.mouse_y - prev_y <= RESIZE_HANDLE_WIDTH / 2) return row - 1
        if (next_y - State.mouse_y <= RESIZE_HANDLE_WIDTH / 2) return row

    }
}





/// Utilities after this!


function col_width(State, c) {
    return State.col_widths[c] || DEFAULT_COL_WIDTH
}

function is_typing(State) {
    return document.activeElement === State.keygetter
}

function* visible_cols(State) {
    let rendered_width = LEFT_MARGIN
    let cur_col = State.viewport_col
    while (rendered_width <= State.canvas.width) {
        let width = col_width(State, cur_col)
        yield [cur_col++, rendered_width, width]
        rendered_width += width
    }
}

function* visible_rows(State) {
    let rendered_height = TOP_MARGIN
    let cur_row = State.viewport_row
    while (rendered_height <= State.canvas.height) {
        let height = State.row_heights[cur_row] || DEFAULT_ROW_HEIGHT
        yield [cur_row++, rendered_height, height]
        rendered_height += height
    }
}

function* visible_cells(State) {
    for (let row of visible_rows(State))
        for (let col of visible_cols(State)) {
            yield { row, col }
        }
}

function visible_row_n(State, r) {
    let row
    for (row of visible_rows(State)) if (row[0] === r) return row
}

function visible_col_n(State, c) {
    let col
    for (col of visible_cols(State)) if (col[0] === c) return col
}

function last_visible_row(State) {
    let row
    for (row of visible_rows(State));
    return row
}

function last_visible_col(State) {
    let col
    for (col of visible_cols(State));
    return col
}

function cell_x_y(State, row, col) {
    let cy, cx;
    for (let [r, y, height] of visible_rows(State)) {
        if (r === row) cy = y;
    }
    for (let [c, x, width] of visible_cols(State)) {
        if (c === col) cx = x;
    }
    return [cx, cy]
}

function cell_row_col(State, x, y) {
    let r, c;
    for (let [row, cy] of visible_rows(State)) {
        if (cy > y) break;
        r = row
    }
    for (let [col, cx] of visible_cols(State)) {
        if (cx > x) break;
        c = col
    }
    return [r, c]
}

function set_selected(State, row, col) {

    let old_text = cell_text(State, State.selected_row, State.selected_col)


    row = Math.max(row, 0)
    col = Math.max(col, 0)

    State.selected_col = col
    State.selected_row = row

    State.keygetter.blur()
    State.main.focus()
    State.selected_end_row = undefined
    State.selected_end_col = undefined

    scroll_into_view(State, row, col)
    State.changed()
}


function set_selected_end(State, row, col) {
    row = Math.max(row, 0)
    col = Math.max(col, 0)

    // selected_col = col
    // selected_row = row

    State.keygetter.blur()
    State.main.focus()

    State.selected_end_row = row
    State.selected_end_col = col

    scroll_into_view(State, row, col)
    State.changed()
}


function bump_selected_end(State, rows, cols) {
    set_selected_end(
        State,
        _.defaultTo(State.selected_end_row, State.selected_row) + rows,
        _.defaultTo(State.selected_end_col, State.selected_col) + cols
    )
}

function bump_selected(State, rows, cols) {
    set_selected(State, State.selected_row + rows, State.selected_col + cols)
}

function scroll_into_view(State, r, c) {
    if (defined(r) && r < State.viewport_row) State.viewport_row = r;
    if (defined(c) && c < State.viewport_col) State.viewport_col = c;

    let [last_row] = last_visible_row(State)
    let [last_col] = last_visible_col(State)

    if (defined(r) && r > last_row - 1) State.viewport_row += r - last_row + 1
    if (defined(c) && c > last_col - 1) State.viewport_col += c - last_col + 1

    State.changed()
}



function start_typing(State) {
    // console.log('start typing')
    add_undo_action(
        State,
        [State.selected_row, State.selected_col, State.selected_row, State.selected_col]
    )

    State.selected_end_col = undefined
    State.selected_end_row = undefined

    State.keygetter.style.position = 'absolute'
    State.keygetter.style.padding = 0
    State.keygetter.style.border = 0
    State.keygetter.style.margin = 0
    State.keygetter.style.outline = 0
    State.keygetter.style.background = 'rgba(0,0,0,0)'

    State.keygetter.style.font = CONTENT_FONT;



    State.keygetter.style.display = 'initial'
    State.keygetter.focus()
    State.keygetter.value = State.user_content[[State.selected_row, State.selected_col]] || ''
    let [x, y] = cell_x_y(State, State.selected_row, State.selected_col)
    
    let box = State.canvas.getBoundingClientRect();

    State.keygetter.style.top = (scrollY + (box.top + (y / devicePixelRatio))) + 'px'
    State.keygetter.style.left = (scrollX + (box.left + (x / devicePixelRatio))) + 'px'
    State.keygetter.style['padding-left'] = CELL_HORIZONTAL_PADDING / devicePixelRatio + 'px'
    State.keygetter.style.height = (State.row_heights[State.selected_row] || DEFAULT_ROW_HEIGHT) / devicePixelRatio + 'px'
    State.keygetter.style['font-size'] = (DEFAULT_ROW_HEIGHT - 20) / devicePixelRatio + 'px'
    sync_canvas_and_keygetter(State)

    State.changed()
}

let measure_text_cache = {}
function measure_text(State, text) {

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

function action(State, region) {
    return {
        region,
        data: to_text(State, region, 'input'),
        viewport_row: State.viewport_row, viewport_col: State.viewport_col,
        selected_row: State.selected_row, selected_col: State.selected_col,
        selected_end_row: State.selected_end_row, selected_end_col: State.selected_end_col
    };
}

function add_undo_action(State, region, clear_redo = true) {
    if (clear_redo) State.redo_actions = []
    State.undo_actions.push(action(State, region))
}

function add_redo_action(State, region) {
    State.redo_actions.push(action(State, region))
}

function execute(State, action) {
    State.viewport_row = action.viewport_row; State.viewport_col = action.viewport_col;
    State.selected_row = action.selected_row; State.selected_col = action.selected_col;
    State.selected_end_row = action.selected_end_row; State.selected_end_col = action.selected_end_col;
    paste(State, action.data, action.region)
    // auto_fill()
    State.changed()
}

function undo(State) {
    let action = State.undo_actions.pop()
    if (!action) return;

    add_redo_action(State, action.region)
    execute(State, action)
}


function redo(State) {
    let action = State.redo_actions.pop()

    if (!action) return;

    add_undo_action(State, action.region, false)
    execute(State, action)
}

