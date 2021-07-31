import React from 'react' ; 
import SigmaGraph from './SigmaGraph';
import Node from './Node';
import axios from 'axios';
import ProjectInfo from './ProjectView';
import '../css/common.css' ;
import {BrowserRouter as Router, Switch,Route,Link} from 'react-router-dom' ;
import * as FaIcons from "react-icons/fa";
import Spinner from 'react-spinner-material';


class Graph extends React.Component{

    constructor(props){
        super(props) ; 
        this.originalProjectList = [];
        this.state=  {
            projNodeList: "",
            linkNumber : -1,
            projList: [] ,
            grapRep: {
                nodes : [],
                edges : []
            },
            api: "http://localhost:9001",
            loading:false
        }
    }
    //GET ALL Projects for User
    //Display List of Projects
    //Display  Graph on Click
    emptyGraph = () =>{
        var empty =  {
            nodes : [],
            edges : []
        } ;
        return empty ;
    }

    updateGraphView = (newGraph) =>{
        if (this.state.grapRep === {}){
            // if graph rep from project was not undefined but empty
            this.setState({
                grapRep: this.emptyGraph() 
            }) ;  //make it empty with representation for graph viewing
        // console.log('updated from task: {}',this.state.grapRep) ;

        }
        else if (this.state.linkNumber >= 0 && this.state.projList.length > 0 && this.state.projList[this.state.linkNumber].graph !== undefined  ){
        //if there was a graph existing
            this.setState({
                grapRep:newGraph
            }) ;
        // console.log('updated from task: not empty',this.state.grapRep) ;

        }
        else{
            this.setState({
                grapRep: this.emptyGraph() 
            })
        }
        // console.log('updated from task',this.state.grapRep) ;
        //else keep the default one, from mount
    }
    componentDidMount = ()=>{
        if (this.state.projList.length<1){ // no projects to display? 1 - call from api
            this.viewProjectsFromAPI() ;
        }
        //initialize the original project list
        fetch(`${this.state.api}/project/getAllProjectsByUserEmail/${this.props.userEmail}`)
        .then(res=>res.json())
        .then((res)=>{
            if (res.data !== undefined )
            this.originalProjectList =  res.data ; 
        })
        .catch((err)=>{
            console.log('error in initialization',err)
        })

    }
    validateGraphDifference=(oldG,newG)=>{
        let diff = false ; 
        console.log('finding diff b/w',oldG,'and:',newG) ; 

        if ( newG === undefined ||newG.nodes === undefined || newG.edges === undefined){
            // new Graph should not be undefined .. dont save 
            return diff ;
        }
        if (oldG === undefined){
            //no olg graph? save 
            diff = true
            return diff ;
        }

        if (oldG.nodes === undefined || oldG.edges === undefined || oldG === undefined){
            //old graph was null, then we save the new one
            diff =  true ; 
            return true ; 
        }
        else{
            // the lengths must be different
            let oldGSum = oldG.edges.length + oldG.nodes.length ;
            let newGSSum = newG.edges.length + newG.nodes.length ;
            if (oldGSum !== newGSSum){
                diff = true ;
                return diff ;
            }
            return diff ;
        }
    }

    saveCurrentGraph = ()=>{
        const projNode = this.state.projNodeList ; 
        console.log('Saving to porjec',projNode.projectName,this.state.grapRep) ;
        let linkNumber = this.state.linkNumber ;
        let pName =  projNode.projectName ;
        if (linkNumber>=0 && pName !== undefined ){
            const oldGraph = this.originalProjectList[linkNumber].graph
            
            //send current graph to project
            // var saveGraph =  window.confirm('Save Current Graph?') ;
            var saveGraph = this.validateGraphDifference(oldGraph,this.state.grapRep)
            if ( saveGraph){ // if its not the same graph
                console.log('valid?:',saveGraph,'Saving to porjec',projNode.projectName,this.state.grapRep) ;
                //set the loader while communicating with the server
                this.setState({
                    loading:true
                }) ;
                const data = {
                    graph : this.state.grapRep
                }
                axios.put(`${this.state.api}/project/updateProjectGraph/${projNode.projectName}`,data)
                .then((res)=>{
                    console.log('update graph response',res)
                    if (res.data === undefined) {
                        // didn't save
                        alert(res.message) ; 
                    }
                    //communication happened successfully
                    this.setState({
                        loading:false
                    }) ;
                })
                .catch((err)=>{
                    alert('saving failed',err)
                    console.log(err) ;
                    this.setState({
                        loading:false
                    }) ;
                })
            }
            else{//no difference
                console.log('Node Project',projNode.graph, this.state.grapRep) ;
                alert('no change in graph',projNode.graph, this.state.grapRep)
            }
        }
        else{
            alert('Please select a project to save graph') ;
        }
    }

    changeNodeList = (node,num) =>{
        // console.log(node.projectName) ;
        if (node.graph === {} || node.graph === undefined || node.graph.nodes === undefined ){
            this.setState({
                projNodeList:node,
                grapRep:this.emptyGraph(),
                linkNumber:num
            }) ;
        }
        else{
            if (num >= 0) //valid link number
            this.setState({
                projNodeList:node,
                grapRep:node.graph,
                linkNumber:num
            }) ;
        }
    }

    viewProjectsFromAPI =()=>{
        // console.log('call to api') ;
        // axios.get('http://graphpath.herokuapp.com/Project/Demo_project')
        // fetch(`${this.state.api}/project/list`)
        
        //Display Loading State
        this.setState({
            loading:true
        }) ; 

        fetch(`${this.state.api}/project/getAllProjectsByUserEmail/${this.props.userEmail}`)
        .then(res=>res.json())
        .then(data => {
            // console.log('from api req',data) ;
            const proj = data ;
            if (proj.data !== undefined ){
                this.setState({
                    projList:proj.data,
                    loading:false
                }) ; 
            }
            else{
                //no projects found from api
                this.setState({
                    loading:false
                }) ; 
                //If there was an error in location
                data.message === undefined?
                alert('Error:'+proj.error) 
                :alert(data.message) ; console.log('Server Reason',data.name,'More:',data.reason) ; 
            }
        },(rejected)=>{
            console.log('from backend :rejected ',rejected)
            alert('Server Error, please try again later.'+rejected) ;
        })    
        .catch(err =>{
            this.setState({
                loading:false
            }) ; 
            alert('Error:'+err)
            console.log('error getting from /project/*',err) ; 
        }) ; 
        
        
    }

    deleteProject=(project)=>{
        if(project === undefined){
            alert('Can\'t delete Project. Project Invalid') ;
        }
        else{
            if (this.props.userEmail === undefined){
                alert('Can\'t delete when not signed in')
            }
            else{
                this.setState({
                    loading:true
                }) ;
                axios.delete(`${this.state.api}/project/deleteProject`,{
                    params:{
                        projectName:project,
                        owner:this.props.userEmail
                    },
                    
                
                })
                .then((res)=>{
                    console.log('Delete',res)
                    if(res.data.data === undefined){
                        alert(res.data.message) ;
                        this.setState({
                            loading:false
                        }) ;
                    }
                    else{
                        this.viewProjectsFromAPI() ;
                    }
                })
                .catch(err=>{
                    console.log("error",err)
                    this.setState({
                        loading:false
                    }) ;
                }) ;
                
            }
        }
    }

    closeProjectList = () =>{
        var elem = document.getElementById('userProjects') ; 
        if (elem !== null){
            elem.style.display = 'none' ; 
        }
    }

    openProjectList = () =>{
        var elem = document.getElementById('userProjects') ; 
        if (elem !== null){
            elem.style.display = 'block' ; 
        }
    }


    render(){
        // console.log('Graph rerendering') ;
        /* sigmaKey is used for refreshing common Sigma graph representaion
         if nodes || edges are undefined, put 0 , else make key 
         the combination of node ^ egdes length */
        var SigmaGraphkey = ( this.state.grapRep.nodes === undefined || this.state.grapRep.edges === undefined ) ? "0"  
        :`${this.state.grapRep.nodes.length}${this.state.grapRep.edges.length}`

        let keyNum = -1 ;
        
        //project Name to display on the graph 
        var selectedProjectName =  this.state.projList.length>0 && this.state.linkNumber >= 0 ?
         this.state.projList[this.state.linkNumber].projectName: "No Data Found" ;

        // console.log('sending graph obj ',this.state)
        return (
            <Router basename='viewProjects/graph'>
                <div className="projectView">
                <Spinner color={"#0000f2"} radius={350} visible={this.state.loading} />

                   <Link to={"/viewProjects"} className="dropbtn clickbtn" title={"Click to display projects"} onClick={this.openProjectList}>
                        Projects  
                    </Link>

                    <FaIcons.FaRecycle onClick={this.viewProjectsFromAPI} title={'refresh'}
                    className="icon clickbtn"/>
                </div>
                <Switch>
                    <Route path={"/viewProjects"} >    
                    <div>
                    <div className="projList" id="userProjects">
                        {   this.state.projList !== undefined && Array.isArray(this.state.projList) &&
                            this.state.projList.length>0 ? // validate if it is an array and not empty
                            this.state.projList.map( (node) => {       
                                keyNum = keyNum+1 ;
                                return <div key={keyNum}  data-project={node} className="project-content" > 
                                    <Link data-projnum={keyNum}  
                                    onClick={(e) =>{
                                    this.changeNodeList(node, e.target.getAttribute("data-projnum"))}}
                                    to={`/project/${keyNum}`}>{node.projectName}</Link>
                                    {node.owner === this.props.userEmail ? 
                                        <span title="Delete Project" id="del-proj" onClick={(e)=>this.deleteProject(node.projectName)}>
                                        X
                                        </span>
                                        :
                                        <span/>
                                    }
                                    
                                </div>
                            })
                            : <span>
                                <h1>Project List is empty,<br/>
                                <p>Please refresh</p> or create a new project.</h1>
                            
                            </span>
                            
                        }
                    </div>
                </div>
                </Route>
                    <Route path={`/project/:${this.state.linkNumber}`}> 
                        <SigmaGraph key={SigmaGraphkey}
                            graphToDisplay={this.state.projList === undefined || this.state.projList.length <= 0  || this.state.linkNumber < 0 || this.state.grapRep.nodes ===undefined ? 
                            this.emptyGraph()
                            :this.state.projList[this.state.linkNumber].graph}
                            projectName={ selectedProjectName}
                            sendGraphData={this.saveCurrentGraph}
                            addEdge={this.addEdge}
                        />
                        <ProjectInfo projectToDisplay={this.state.linkNumber<0 ?''
                        :this.state.projList[this.state.linkNumber]} />
                    </Route>
                    <Route path="/addTask">
                        {console.log('When a task is added, state has, ',this.state)}
                        <SigmaGraph key={SigmaGraphkey}
                            graphToDisplay={this.state.grapRep}
                            projectName={selectedProjectName}
                            sendGraphData={this.saveCurrentGraph}
                            addEdge={this.addEdge}

                        />
                        <Node graph={this.state.grapRep}
                            updateGraph={this.updateGraphView}/>
                    </Route>
                </Switch>
            </Router>
            
        ) ; 
    }

}

export default Graph ; 