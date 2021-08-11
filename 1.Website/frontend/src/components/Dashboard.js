import React from 'react' ; 
import Graph from './Graph';
import NewProject from './NewProject' ;
import TaskList from './TaskList';
import Reports from "./Reports";
import '../css/App.css' ;
import '../css/Dashboard.css'
import scrumBoard from '../images/scrum_board_l.svg'
import * as AiIcons from "react-icons/ai";
// import Sigma from './reactSigmaGraph' ; 
// import axios from 'axios' ;
import { BrowserRouter as Router,Switch,Route,Link} from 'react-router-dom' ;


class Dashboard extends React.Component{
    constructor(props){
        super(props) ; 
        this.views =  ["default", "newProject", "project"] ;
        this.state={
            projects: null ,
            view: this.views[0] 
        } ;
    }
    

    changeToDefault = () =>{
        this.setState({
            projects:null,
            view:this.views[0]
        })
    }

    toggleDisplayOpen = () =>{
        let elem = document.getElementById('modal1') ;
        if (elem !== null){
        // console.log('clicked', elem.style.display)
            elem.style.display='block' ;
            this.props.menuToogleClose() ; 
        }
    }

    toggleDisplayClose = () =>{
        let elem = document.getElementById('modal1') ;
        let navB = document.getElementById('modal2');
        if (elem !== null && navB !== null){
            elem.style.display='none' ;
            navB.style.display='none';
            this.props.menuToogleOpen()
        }
    }        
    

    render(){
        return (
           <div className="GraphDashboard">
            <Router>
                {/*  <div className="DashboardMenu" id="modal1" >
                    <div className="App-link-routes" >
                        <div className="opt">
                        <span onClick={this.toggleDisplayClose}
                        className="close" title="Close Menu">
                        &times;</span>
                    </div>
                    <div className="opt">
                        <Link  to="/newProject">Create Project</Link>
                    </div>
                        <div className="opt">
                        <Link to="/viewProjects">View Projects</Link>
                        </div>

                        <div className="opt">
                            <Link to="TaskList">View Tasks</Link>
                        </div>
                        <div className="opt">
                            <Link to="/reports">Reports</Link>
                        </div>
                    </div>
                </div>*/}

                {/*New Nav Bar*/}
                <span className="closeBtn" id="modal1">
                        <AiIcons.AiOutlineClose onClick={this.toggleDisplayClose} />
                </span>
                <div className="DashboardMenu" id="modal2">


                </div>

                {/* Default route for logging in */}
                
                <Switch>
                <Route path="/dashboard">
                    <div className="imgContainer">
                        <img alt={"Scrum Board"} src={scrumBoard} className="scrumBoard" />

                        {/*<img alt={"Graph Project Example"} src={`${this.props.api}/Dashboard1.png`}/>*/}
                    </div>
                </Route>
                    <Route path="/newProject" exact>
                        <div className="ContentArea">
                            <NewProject  default={this.changeToDefault}
                            userEmail={this.props.loggedUser}/>
                        </div>
                    </Route>
                    
                    <Route path="/viewProjects" >

                    {/* should call api for the projects and be able to display as per list  */}
                        <div className="ContentArea">
                            <Graph userEmail={this.props.loggedUser} /> 
                        </div>

                    </Route>

                    <Route path="/TaskList" >
                        <div className="ContentArea">
                            <TaskList/>
                        </div>
                    </Route>

                    <Route path="/reports">
                        <div className="ContentArea">
                            <Reports/>
                        </div>
                    </Route>
                </Switch>
            
            {this.toggleDisplayOpen()}
            </Router>
            </div>
        )
    }

} 



export default Dashboard ; 