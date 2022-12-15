import React, { useState } from "react";
import './App.css';
import Grid from './components/grid';
import { PageLayout } from "./components/PageLayout";
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import Button from "react-bootstrap/Button";
import { ProfileData } from "./components/ProfileData";
import { callMsGraph } from "./graph";
import './components/key.css'

function ProfileContent() {
    const { instance, accounts } = useMsal();
    const [graphData, setGraphData] = useState(null);

    const name = accounts[0] && accounts[0].name;

    function RequestProfileData() {
        const request = {
            ...loginRequest,
            account: accounts[0]
        };

        // Silently acquires an access token which is then attached to a request for Microsoft Graph data
        instance.acquireTokenSilent(request).then((response) => {
            console.log(response.accessToken)
            getAccounts(response.accessToken)
        }).catch((e) => {
            instance.acquireTokenPopup(request).then((response) => {
                getAccounts(response.accessToken)
            });
        });
    }

    
    async function getAccounts(token) {
        var options = {  
            method: 'get',
            headers: new Headers({
                'Authorization': 'Bearer '+token,
            }),
        };
        await fetch('https://stage-api-gateway.expedient.com/api/billing/account', options)
        .then((response) => response.json())
        .then((data) => {
            console.log(data)
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }

    return (
        <>
            <h5 className="card-title">Welcome {name}</h5>
            {graphData ? 
                <ProfileData graphData={graphData} />
                :
                <Button variant="secondary" onClick={RequestProfileData}>Request Profile Information</Button>
            }
        </>
    );
};

class App extends React.Component {
    constructor(props) {
        super(props);
        
        let grid = this.initGrid();
        let keys = this.initKeyboard();

        this.state = {
            cursor: {
                row: 0,
                column: 0
            },
            grid: grid,
            keys: keys,
            solved: false,
            numGuesses: 0,
            error: "",
            gameNumber: 1
        };
    }

    initGrid() {
        let grid = [];
        for (let i = 0; i < 6; i++) {
            grid[i] = []
            for (let j = 0; j < 5; j++) {
                grid[i][j] = {
                    state: null,
                    letter: null
                }
            }
        }

        return grid
    }

    initKeyboard() {
        let keyboard = []
        const letters = "abcdefghijklmnopqrstuvwxyz";
        for (let i = 0; i < letters.length; i++) {
            keyboard[letters.charAt(i)] = "not-guessed";
        }

        return keyboard;
    }

    enterLetter(letter) {
        let grid = this.state.grid;
        let cursor = this.state.cursor;
        if(cursor.column >= 5) {
            return
        }

        grid[cursor.row][cursor.column].letter = letter
        if(cursor.column < 5) {
            cursor.column += 1;
        }
        this.setState({
            grid: grid,
            cursor: cursor
        })
    }

    async submitGuesses() {
        let grid = this.state.grid;
        let cursor = this.state.cursor;
        let solved = false;
        let numGuesses = 0;
        let keys = [];
        // get guesses from grid
        let guesses = []
        for (let i = 0; i <= cursor.row; i++) {
            guesses[i] = "";
            for(let j = 0; j < grid[i].length; j++) {
                if(grid[i][j].letter === null) {
                    return
                }
                guesses[i] += grid[i][j].letter
            }
        }

        const data = { guesses: guesses }; 
        var options = {  
            method: 'post',
            headers: new Headers({
                'Authorization': 'Basic dGVzdHVzZXI6dGVzdHBhc3M=',
            }),
            body: JSON.stringify(data)
            }
        await fetch('https://stage-hackathon.expedient.com/api/wordy/'+this.state.gameNumber+'/play', options)
        .then((response) => response.json())
        .then((data) => {
            console.log(data)
            if(data.error){
                this.setState({
                    error: data.error
                })
                return
            }

            // update grid
            for (let i = 0; i < Object.keys(data.data.guesses).length; i++) {
                for(let j = 0; j < Object.keys(data.data.guesses[i].tiles).length; j++) {
                    grid[i][j].state = data.data.guesses[i].tiles[j].state
                }
            }


            // update keyboard
            Object.keys(data.data.letters).forEach(key => {
                keys[key] = data.data.letters[key]
            });

            // update cursor
            cursor.row += 1;
            cursor.column = 0

            // check for success
            if(data.data.state === "solved") {
                solved = true
                numGuesses = data.data.correct_in
            }
            
            this.setState({
                grid: grid,
                cursor: cursor,
                solved: solved,
                numGuesses: numGuesses,
                error: "",
                keys: keys
            })
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }

    removeLetter() {
        let grid = this.state.grid;
        let cursor = this.state.cursor;

        if (cursor.column <= 0) {
            return
        }

        cursor.column -= 1
        grid[cursor.row][cursor.column].letter = null

        this.setState({
            grid: grid,
            cursor: cursor
        })
    }

    nextGame() {
        let grid = this.initGrid();
        let keys = this.initKeyboard();
        let gameNumber = this.state.gameNumber + 1;

        this.setState({
            cursor: {
                row: 0,
                column: 0
            },
            grid: grid,
            keys: keys,
            solved: false,
            gameNumber: gameNumber
        })
    }

    render() {

        const letters1 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
        const keyboardRow1 = letters1.map((letter) =>
            <button className={"key "+this.state.keys[letter.toLowerCase()]} key={letter} onClick={(e) => this.enterLetter(letter)}>{letter}</button>
        );
        const letters2 = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
        const keyboardRow2 = letters2.map((letter) =>
            <button className={"key "+this.state.keys[letter.toLowerCase()]} key={letter} onClick={(e) => this.enterLetter(letter)}>{letter}</button>
        );
        const letters3 = ["Z", "X", "C", "V", "B", "N", "M"];
        const keyboardRow3 = letters3.map((letter) =>
            <button className={"key "+this.state.keys[letter.toLowerCase()]} key={letter} onClick={(e) => this.enterLetter(letter)}>{letter}</button>
        );

        if(this.state.solved) {
            return (
                <PageLayout>
                    <AuthenticatedTemplate>
                        <div className="App">
                            <div className="App-header">
                            <ProfileContent />
                            <br/>
                            <br/>
                            Wordy
                            <Grid grid={this.state.grid}/>
                            <div>Solved in {this.state.numGuesses} {this.state.numGuesses === 1 ? "guess":"guesses"}!!</div>
                            <button onClick={(e) => this.nextGame()}>Next Game</button>
                            </div>
                        </div>
                    </AuthenticatedTemplate>
                    <UnauthenticatedTemplate>
                        <p>You are not signed in! Please sign in.</p>
                    </UnauthenticatedTemplate>
                </PageLayout>
            );
        }
        return (
        <PageLayout>
            
            <AuthenticatedTemplate>
                <div className="App">
                    <div className="App-header">
                    <ProfileContent />
                    <br/>
                    <br/>
                    Wordy
                    <Grid grid={this.state.grid}/>
                    
                    <div className="keyboard">
                        <div id="keyboard-row-1" name="keyboard-row">
                            {keyboardRow1}
                        </div>
                        <div id="keyboard-row-2" name="keyboard-row">
                            {keyboardRow2}
                        </div>
                        <div id="keyboard-row-3" name="keyboard-row">
                            {keyboardRow3}
                            <button style={{height:"50px"}} id="backspace-btn" onClick={(e) => this.removeLetter()}>Backspace</button>
                        </div>
                    </div>

                    <button style={{height:"50px"}} id="submit-attempt-btn" onClick={(e) => this.submitGuesses()}>Enter</button>
                    <div>{this.state.error}</div>
                    </div>
                </div>
            </AuthenticatedTemplate>
            <UnauthenticatedTemplate>
                <p>You are not signed in! Please sign in.</p>
            </UnauthenticatedTemplate>
        </PageLayout>
        );
    }
}

export default App;
