import React from 'react' ; 
import Task from './Task' ;
import axios from 'axios';
import '../css/Graph.css'
import {Link,withRouter, Route, Switch} from 'react-router-dom' ;
// import '../css/Dashboard.css' ;

class Node extends React.Component{
    constructor(props){
        super(props) ; 
        this.state ={
            taskList:[]
        }
        this.graphManager = null  ; 
    }

    componentDidMount(){
    
    }
    addNewNode = (name)=>{
      
        if (name.toString().trim().length<=0) {
            alert('Cannot Submit Empty Name')
        }
        else{
            var manager = this.props.graphManager ;
            manager.addNode(name) ;
            this.updateParent(manager) ;
        
        }
    }
    addNewTask = (data) =>{
        axios.post(`${this.state.api}/insertTask`,data)
        .then((response) =>{
            if(response.status===400){
                throw Error(response.statusText) ;
            }//else
            console.log('from back end',response)

            const res = response.data;
            console.log(res) ;
            this.setState({
                answer:res.message,
                responseData:res.data //data
            },()=>{
                // alert('res:'+this.state.answer)
                console.log(this.state)
                if (this.state.answer!== null && this.state.answer){
                    //    this.props.changeToDefault() ;
                }
            })

        },(response)=>{
            console.log('rejected',response) ;
        })
        .catch((error)=>{
            console.log(error) ;
        })
    }
    viewAllTasks =()=>{
        
    }
    
    updateParent=()=>{
        if (typeof this.props.updateGraph === 'function'){
            this.props.updateGraph(this.props.graphManager) ;
        }else{
            alert('Could not update Parent graph') ;
        }
    }

    render(){
        const {match} = this.props ;
        var manager = this.props.graphManager ;
        var {project} = this.props ;
        const EditGraphPermissionRoles = ['owner','project manager','developer']

         
        console.log(project) ;

        if (manager === undefined || project === undefined){
            return (<div>
                No Graph Mounted
            </div>)
        }
        else{
            // console.log('Node remounting',manager.getGraph())
            const query = new URLSearchParams(this.props.location.search );
            return (
                <div id="add-node-div">
                    {EditGraphPermissionRoles.indexOf(this.props.project.role.toLowerCase())>=0 ? 
                
                    <div id="add-node">
                        <Link to={`${match.url}/addNode`}>Add Nodes</Link><span> </span>
                        {/* <Link to={`${match.url}/edges`}>Add Edges</Link> */}
                        <br/>
                    </div>
                    :"No perm"
                    }
                    <Switch>
                        <Route path={`${match.url}/addNode`} >
                            
                            <Task addTask={this.addNewNode} 
                            />
                        </Route>
                        <Route path={`${match.url}/task/`} render={()=>{
                            const nodeID = project._id+'_'+query.get('id') ;
                            return <>
                            
                            <Task addTask={this.addNewTask} 
                                fullForm={true}
                                label={query.get('label')}
                                nodeId={nodeID}
                                projectId={project._id}
                                members={project.groupMembers}
                            />

                            </>
                        }} />
                            
                    </Switch>
                
            </div>
        
        )}
    }

    displayTask =()=>{
        alert(this.props.task) ;
    }
}

export default withRouter(Node) ;