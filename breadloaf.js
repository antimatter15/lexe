import Lexe from './editor'
import BreadLoaf from 'breadloaf'

function Slice(props){
    return <div className="slice">
        <div className="slice-header" onMouseDown={props.beginDrag}>
            <div style={{flexGrow: 1, fontSize: '18px'}}>
                
            </div>
            <button onClick={props.fork}>fork</button>
            <button onClick={props.close}>&times;</button>
        </div>
        <Lexe state={props.view.state} updateState={e => props.updateView({ state: e })} />
    </div>
}


export default class Wumbo extends React.Component {
    state = {
        layout: []
    }
    render(){
        return <div>
            <style jsx global>{`

.bread-row > * {
  display: flex;
}

.divider {
    box-sizing: border-box;
    height: 9px;
    
    cursor: vertical-text;
    padding: 2px 0;

    background-clip: padding-box !important;
    border: 2px solid transparent;
    border-left: 0;
    border-right: 0;

    margin: 0 19px;

    opacity: 0;
    transition: opacity 200ms ease-in;
}

.vertical-divider {
    width: 1px;
    padding: 0 2px;

    background: transparent;
    border: 7px solid transparent;
    background-clip: padding-box !important;
    border-bottom: 0;
    border-top: 0;
    flex-shrink: 0;

    opacity: 0;
    transition: opacity 200ms ease-in;

    cursor: text;
}



.vertical-divider::after {
  width:1px;
  background: #D4D4D4;   
  content: " ";
  height: 100%;
  display: block;
}

.divider:hover, .vertical-divider:hover {
  opacity: 1;
}

.divider::after {
    height:1px;
    background: #D4D4D4;   
    content: " ";
    width: 100%;
    display: block;
}


.bread-row.insert-top .divider.divider-top,
.bread-row.insert-bottom .divider.divider-bottom,
.bread-col.insert-left .vertical-divider.divider-left,
.bread-col.insert-right .vertical-divider.divider-right {
  background: #585858;
  opacity: 1;
}

.bread-row.insert-top .divider.divider-top::after, 
.bread-row.insert-bottom .divider.divider-bottom::after,
.bread-col.insert-left .vertical-divider.divider-left::after,
.bread-col.insert-right .vertical-divider.divider-right::after {
  background: transparent;
}

.bread-col {
  flex-basis: 0;
  flex-grow: 1;

  /*border-right: 5px solid transparent;*/
  /*padding:  5px 5px 7px 5px;*/
  overflow: hidden;
  transition: border-color 200ms ease-in;
  display: flex;

  padding: 5px 0;
}


.bread-enter {
  /* 0 does not work so we have to use a small number */
  /* Start our small */
  flex: .00001;

  -webkit-animation: flexGrow 300ms ease forwards;
  -o-animation: flexGrow 300ms ease forwards;
  animation: flexGrow 300ms ease forwards;
}


.bread-leave {
  flex: 1;

  -webkit-animation: flexShrink 300ms ease forwards;
  -o-animation: flexShrink 300ms ease forwards;
  animation: flexShrink 300ms ease forwards;
}

.bread-leave > * {
  min-width: 200px;
}


@-webkit-keyframes flexGrow {
  to { flex: 1; }
}
@-o-keyframes flexGrow {
  to { flex: 1; }
}
@keyframes flexGrow {
  to { flex: 1; }
}

@-webkit-keyframes flexShrink {
  to {
    flex: .01;
    flex: .00001;
  }
}
@-o-keyframes flexShrink {
  to {
    flex: .01;
    flex: .00001;
  }
}
@keyframes flexShrink {
  to {
    flex: .01;
    flex: .00001;
  }
}



body {
    font-family: sans-serif;
    font-weight: 300;
    background: #e8e8e8;
    margin: 0;
}


.header {
    max-width: 70vw;
    margin-left: auto;
    margin-right: auto;

    padding: 0 18px;
    box-sizing: border-box;
}

.header h1 {
    font-weight: 100;
}

.slice {
    /*border: 1px solid #d8d8d8;*/
    min-height: 100px;
    box-shadow: 1px 2px 7px rgba(0, 0, 0, 0.17);
    transition: opacity 200ms ease-in;
    margin-right: auto;
    margin-left: auto;
    height: 100%;
    background: white;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    flex-shrink: 1;
    overflow: hidden;
}



.bread-col.dragging .slice {
  opacity: 0.3;
}


.slice.dragging {
    opacity: 0.3;
}

.slice .body {
    padding: 10px;
    overflow: hidden;
    flex-grow: 1;
}

.slice-header {
    padding: 10px 15px;
     color: white; 
    background: #353535;
    cursor: pointer;
    display: flex;
    white-space: nowrap;
}

.slice-header button {
    border: 0;
    background: transparent;
    cursor: pointer;
    border-radius: 3px;
    color: white;
}

.slice-header button:hover {
    background: rgba(255, 0, 0, 0.35);
}

.slice-header .button-toggle {
    font-size: 11px;
    margin-top: 5px;
    display: inline-block;
    position: relative;
    cursor: pointer;
    color: gray;
    margin-right: 5px;
    -webkit-user-select: none;
}

.slice-header .button-toggle.active {
    color: purple;
}

.slice-header .button:hover {
  color: black;
}

.slice-header .button.active {
    color: purple;
}





.fake-slice {
  border: 2px dashed #d8d8d8;
  border-radius: 2px;
  min-height: 30px;
  padding-bottom: 20px;
  text-align: center;
  font-size: 100px;
  color: #d8d8d8;
  -webkit-user-select: none;
  cursor: pointer;
  flex-grow: 1;
  transition: all 200ms ease-in;
    margin: 0 19px;
}

.fake-slice:hover {
  border: 2px dashed gray;
  color: gray;
}



@media (max-width: 700px) {
    .bread-row > span {
        display: block;
    }

    .vertical-divider {
        display: none;
    }

    .bread-col {
      padding: 5px 10px;
    }
}

@media (min-width: 700px) {
  .row-1 {
    max-width: 70vw;
    margin-left: auto;
    margin-right: auto;
  }
}




            `}</style>
            <BreadLoaf 
                ref={e => this.loaf = e} 
                layout={this.state.layout}
                updateLayout={e => this.setState({ layout: e })}
                makeSlice={e => ({
                  state: {
                      user_content: {}, //
                      selected_end_col: 0, //
                      selected_end_row: 0, //
                      selected_row: 0, //
                      selected_col: 0, //
                      col_widths: {}, //
                      row_heights: {}, //
                      viewport_col: 0, // 
                      viewport_row: 0, //
                  }
                })}
                element={ <Slice /> }
                footer={
        <div className="fake-row row-1" onClick={e => this.loaf.append({
                  state: {
                      user_content: {}, //
                      selected_end_col: 0, //
                      selected_end_row: 0, //
                      selected_row: 0, //
                      selected_col: 0, //
                      col_widths: {}, //
                      row_heights: {}, //
                      viewport_col: 0, // 
                      viewport_row: 0, //
                  }
                })}>
          <span>
            <div className="bread-col">
              <div className="fake-slice">+</div>
            </div>
          </span>
        </div>
        } />
        </div>
    }
}