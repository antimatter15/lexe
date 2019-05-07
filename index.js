import Lexe from './editor'


export default class Wumbo extends React.Component {
    state = {
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
    render(){
        return <div>
        	<style jsx global>{`
        		body {
        			margin: 0;
        		}
        	`}</style>
        	<Lexe state={this.state} updateState={e => this.setState(e)} />
        </div>
    }
}