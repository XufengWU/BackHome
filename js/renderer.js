'use strict';

/*

Game project sturct:
  - <PROJECT_ROOT>
    - scripts // scritps of the game
    - background // background images of scenes
    - media // sound track resources

*/

class GameState {
    constructor() {
        this.current_scene = ""
        // dialog
        this.current_dialog = 0
    }
}

class Actions extends React.Component {
    constructor(props) {
        super(props)
        this.state = {}
    }

    render() {
        let actions = []
        for (const [k, v] of Object.entries(this.props.actions)) {
            actions.push(<div className="action-item" onClick={ this.props.onActionClick }>{k}</div>)
        }
        return <div className="actions-wrapper">{actions}</div>
    }
}

class GameApp extends React.Component {

    static GAME_ROOT = ""
    static CHARACTER_COLOR = {}

    constructor(props) {
        super(props)
        GameApp.GAME_ROOT = "../games/" + props.game + "/"
        let game_state = new GameState()
        game_state.current_scene = props.start_scene
        this.state = {
            game_state: game_state,
            game_data: {},
            // loading status
            is_loading: true
        }

        this.onBackgroundClick = this.onBackgroundClick.bind(this)
        this.onActionClick = this.onActionClick.bind(this)
    }

    // TODO: move specific logic to managers, e.g. GameManger, SoundManager, etc

    init() {
        // load game data
        fetch(GameApp.GAME_ROOT + "scripts/main.json")
        .then(response => response.json())
        .then(json => {
            this.setState({
                game_data: json,
                is_loading: false
            })
        })
    }

    componentDidMount() {
        this.init()
    }

    getBackgroundUrl() {
        let cur_scene = this.state.game_state.current_scene
        let background_scene = cur_scene
        let scenes = this.state.game_data.scenes
        if (scenes[cur_scene] && scenes[cur_scene]["background"]) {
            background_scene = scenes[cur_scene]["background"]
        }
        return GameApp.GAME_ROOT + "/backgrounds/" + background_scene + ".jpg"
    }

    isEndOfDialogs() {
        let cur_scene = this.state.game_state.current_scene
        return this.state.game_state.current_dialog >= this.state.game_data.scenes[cur_scene].dialogs.length
    }

    getCharacterColor(charaterName) {
        if (GameApp.CHARACTER_COLOR[charaterName]) {
            return GameApp.CHARACTER_COLOR[charaterName]
        }
        let newColor = "rgb(" + (50 + Math.floor(Math.random() * 200)) 
        + ", " + (50 + Math.floor(Math.random() * 200)) 
        + ", " + (50 + Math.floor(Math.random() * 200)) + ")"
        GameApp.CHARACTER_COLOR[charaterName] = newColor
        return newColor
    }

    getCharacter() {
        let raw_dialog = this.getRawDialog()
        if (!raw_dialog)
            return ""
        let split = raw_dialog.split('：')
        let charName = split.length > 1 ? split[0] : null
        if (charName) {
            return <b style={{color: this.getCharacterColor(charName)}}>{charName + ":"}</b>
        }
        return ""
    }

    getRawDialog() {
        let cur_scene = this.state.game_state.current_scene
        let len = this.state.game_data.scenes[cur_scene].dialogs.length
        return this.state.game_data.scenes[cur_scene].dialogs[Math.min(len - 1, this.state.game_state.current_dialog)]
    }

    getDialog() {
        let raw_dialog = this.getRawDialog()
        if (!raw_dialog)
            return ""
        let split = raw_dialog.split('：')
        return <div className="dialog-content-body">
            { split.length > 1 ? split[1] : split[0] }
        </div>
    }

    getActions() {
        return this.state.game_data.scenes[this.state.game_state.current_scene].actions
    }

    onBackgroundClick() {
        let new_game_state = this.state.game_state
        new_game_state.current_dialog++
        this.setState({
            game_state: new_game_state
        })
        let default_next_scene = this.state.game_data.scenes[this.state.game_state.current_scene].default_next
        if (this.isEndOfDialogs() && default_next_scene) {
            this.loadScene(default_next_scene)
        }
    }

    onActionClick(e) {
        let action = e.target.innerText
        e.stopPropagation()

        let next_scene = this.state.game_data.scenes[this.state.game_state.current_scene].actions[action]

        this.loadScene(next_scene)
    }

    loadScene(scene) {
        this.setState({
            game_state: {
                current_scene: scene,
                current_dialog: 0
            }
        })
    }

    render() {
        if (this.state.is_loading) {
            return <div>Loading ...</div>
        }
        return <div onClick={this.onBackgroundClick}>
            <div className="background-canvas">
                <img className="background-img" src={ this.getBackgroundUrl() }/>
            </div>
            {this.state.game_data.scenes[this.state.game_state.current_scene].dialogs ?
            <div className="dialog-back">
                <div className="dialog-content">
                    { this.getCharacter() }
                    { this.getDialog() }
                </div>
                {this.isEndOfDialogs() &&
                <Actions actions={ this.getActions() } onActionClick={ this.onActionClick }/>
                }
            </div> :
            ""
            }
        </div>
    }
}

// entry point
ReactDOM.render(
    <GameApp game="backhome" start_scene="开始"/>,
    document.getElementById('app-wrapper')
);