import {React,Component} from "react";
// import {Sigma,NodeShapes,EdgeShapes,DragNodes} from 'react-sigma' ; 
import Graph from 'react-graph-vis' ;
// import Dagre from 'react-sigma/lib/Dagre' ;
import  PropTypes  from "prop-types";
import { withRouter} from "react-router-dom";
import '../css/Graph.css' ;
import GraphManager from "./Helpers/GraphManager";
import { Popover,Whisper, Button,Form,FormGroup,FormControl,ControlLabel, Modal, Checkbox, IconButton, Icon, Loader, Dropdown} from 'rsuite' ;
import axios from "axios";
import PopUpMessage from "./Reusable/PopUpMessage";
import Task from "./Task";
import {connect} from 'react-redux' ;
import GraphHelp from "./Reusable/GraphHelp";
//import DropdownMenuItem from "rsuite/lib/Dropdown/DropdownMenuItem";

class GraphPath extends Component{
  graphManager = null ;
  initialGraph = {} ;
  
  constructor(props){
    super(props) ;
    this.state ={
      currGraph:{} ,
      showTask:false,
      nodeName:'',
      critical:false,
      showNode:false, 
      loading:false,
      showMsg:false,
      answer:'',
      source:'from',
      target:'to',
      taskList:[], 
      nodeTasks:[],
      currNodeID:'',
      currNodeName:''
    }
  }

  componentDidMount(){
    const {graph} = this.props.project
    var graphObj = JSON.parse(JSON.stringify(graph)) ;
    // const graphObj = {...graph}
    // console.log('created',graphObj)

    if (graph !== undefined ){
      this.initialGraph = graphObj ;
      this.graphManager = new GraphManager(graph)
      this.setState({
        currGraph: this.graphManager.getGraph() 
      })  ;
    }
    else{
        console.log('No Graph Object Mounted')
    }
    this.viewAllTasksForProject() ;
    

  }

  componentWillUnmount(){
    // let semiUpdate = this.props.project ;
    if (this.graphManager !== null){
      var difference =this.validateGraphDifference(this.initialGraph,this.state.currGraph)
        if (difference){
          let save = window.confirm('Save changes before leaving?') ;
          if (save){
            const data = {} ; //{ ...this.props.project}  ;
            data.graph = this.state.currGraph ;
            data.projectID = this.props.project._id ;
            data.email = this.props.loggedUser.email ; 
  
            axios.patch(`${this.props.api}/project/updateProjectGraph`,data,{
              headers:{
                authorization:this.props.loggedUser.token
              }
            })
            .then((res)=>{
              PopUpMessage(res.data.message,'info') ;
            })
            .catch((err)=>{
              console.log('Error:',err) ;
            })
          }
          else{
            this.props.project.graph = this.initialGraph ;
          }
        }
        delete this.graphManager  

      }
    //update parent
    // this.props.updateParent(semiUpdate) ;
    console.log('update parent',this.initialGraph)
    
  }

  viewAllTasksForProject = (callback)=>{
    if (this.props.project !== undefined){
        
      this.setState({
        loading:true
      });
      const projectId = this.props.project._id ;
      
      axios.get(`${this.props.api}/task/getAllTasksByProject/${projectId}`)
      .then((res)=>{
          console.log('Tasklist',res) ;
          const allTasks = res.data.data ;
            if (allTasks !== undefined && Array.isArray(allTasks)){
                this.setState({
                    taskList:res.data.data ,
                    loading:false ,
                    showTask:false
                },()=>{
                  if (typeof callback === 'function'){
                    callback() ;
                  }
                }) ;
                
            }
            else{
                this.setState({
                    loading:false 
                }) ;
            }
      })
      .catch((err)=>{
            console.log('Error',err)
            this.setState({
                loading:false 
            }) ;

        })

        //update the task list if it was already showing
    }
    else{
      this.setState({
        loading:false , //if the project was loading before
      })
    }

}

  showNodeForm = ()=>{
    this.setState({
      showNode:!this.state.showNode
    }) ;
  }

  filterByID=(id,array)=>{
    return array.filter(value=>value.nodeID === id ) ;
  }

  showTaskModal=(nodeId)=>{
    let filter = this.state.nodeTasks ;
    
    if (typeof nodeId === 'string' && nodeId.length>1 &&this.props.project !== undefined){
      filter= this.filterByID(`${this.props.project._id}_${nodeId}`,this.state.taskList) ;
      let selected = this.state.currGraph.nodes.find(node=>node.id === nodeId) ; 
      let nodeLabel = 'No Provided Name' ; 
      if (selected){
        nodeLabel = selected.label ;
      }
      if (nodeId!=='n0'){
        this.setState({
          showTask:!this.state.showTask ,
          nodeTasks:filter,
          currNodeID:nodeId,
          currNodeName:nodeLabel,
        }) ;
      }
            
    }
    else{
      
      this.setState({
        showTask:!this.state.showTask ,
        currNodeId:'',
        currNodeName:'',
        nodeTask:[]
      }) ;
    }

  }

  handleChange =(value)=>{
    this.setState({
      nodeName:value
    }) ;
  }

  handleCritical = (value)=>{
    this.setState({
      critical:!this.state.critical
    }) ;
  }
  
  updateGraph=(withsave)=>{
    
    this.setState({
      currGraph: this.graphManager.getGraph() 
    },()=>{
      if (withsave){
        this.saveProjectGraph(this.props.project._id) ;
      }
    }) ;
  }

  addNewNode = ()=>{
    const name = {
      label:this.state.nodeName ,
      critical:this.state.critical 
    }
      
    if (!name.label.toString().trim().length) {
        // alert('Cannot Submit Empty Name')
        PopUpMessage('Cannot Submit Empty Name','error')
    }
    else{
        this.graphManager.setGraph(this.state.currGraph) ;
        this.graphManager.addNode(name) ;
        this.updateGraph();
        this.cleanUpAfterNodeAddition()   ;
      
    }
  }

  createEdgeBetweenNode=(id) =>{
    if (this.state.source === 'from'){
      this.setState({
        source:id
      }) ;
    }
    else{
      if (this.state.source === id){
        // alert('Cannot make edge to self')
        PopUpMessage('Cannot make edge to self','error')
      }
      else{  
        // this.setState({
        //   target:id
        // }) ; 
        // this.graphManager.setGraph(this.state.currGraph) ;
        let addedEdge = this.graphManager.addEdge(this.state.source,id) ;
        // console.log('adding edge',addedEdge) ;

        if (addedEdge === 1){
          this.updateGraph() ;
          // console.log('adding edge',this.graphManager.getGraph()) ;

        }
        else if (addedEdge === 0 ){
          // alert('Edge Makes graph Cyclic')
          PopUpMessage('Edge Makes graph Cyclic','Error')

        }
        else{
          // alert('Edge Exists')
          PopUpMessage('Edge Exists','warning')
        }
      }
        //save the information
        //send the information to make graph
        //update Graph
        //cleanup
        this.cleanUpAfterEdgeAddition() ;
    }

  }

  removeNode =(id)=>{
    let nodeID = `${this.props.project._id}_${id}` ;
    let filter=this.state.taskList.filter(value=>value.nodeID === nodeID ) ;
    let removeAns ;
    let removeTasks = false;
    if (filter.length > 0){
     removeAns = window.confirm('removing the task will delete all subtasks, continue?') ;
     removeTasks = removeAns ;
    }
    else{
      removeTasks = false ;
      removeAns = true ;
    }

    if (removeAns === true){
      let result = this.graphManager.removeNode(id) ;
      if (result === true){
        this.updateGraph() ;
        if (id !== 'n0'){
          this.deleteAllNodeTask(nodeID,removeTasks) ; 
        }
  
      }
      else{
        if (result === -1){
          PopUpMessage('Cannot delete start node','warning')
        }
      }
      return result ;
    }

   
  }

  removeEdge = (id)=>{
    let result = this.graphManager.removeEdgeWithEdgeId(id) ;
    if (result){
     this.updateGraph()
    }
    else{
      console.log('Error when deleting edge')
    }
  }

  cleanUpAfterEdgeAddition = ()=>{
    this.setState({
    source:'from',
    target:'to'})
  }

  cleanUpAfterNodeAddition = ()=>{
    this.setState({
      nodeName:'',
      critical:false
    }) ;
  }

  /*
  * Takes two graphs and compares them. 
  * the 1st param is old graph ~ current graph
  * the 2nd param is new graph ~ one to be saved
  * If they differ in size of nodes and edges return true
  * If new graph is in wrong format return false
  * If graphs are equal return false
  */
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
        // let oldGSum = oldG.edges.length + oldG.nodes.length ;
        // let newGSSum = newG.edges.length + newG.nodes.length ;
        let oldGSum = JSON.stringify(oldG) ;
        let newGSum = JSON.stringify(newG)
        if (oldGSum !== newGSum){
            diff = true ;
            return diff ;
        }
        return diff ;
    }
  }

  checkSavePermissions =()=>{
    if (this.props.project !== undefined){
      this.saveProjectGraph(this.props.project._id) ;
    }
  }

  saveProjectGraph=(projectId)=>{

      var saveGraph =this.validateGraphDifference(this.initialGraph,this.state.currGraph)
      if ( saveGraph){ // if its not the same graph
          // console.log('valid?:',saveGraph,'Saving to porjec',projNode.projectName,this.state.grapRep) ;
          //set the loader while communicating with the server
          this.setState({
              loading:true
          }) ;
          // const minimalGraph = 
          const minimalNodes = this.state.currGraph.nodes.map((node)=>{
              return {
                  id:node.id,
                  label:node.label,
                  x:node.x,
                  y:node.y,
                  size:node.size,
                  color:node.color,
                  critical:node.critical,
                  status: node.status
              }
          }) ;
          const minimalEdges = this.state.currGraph.edges.map((edge)=>{
              return {
                  id: edge.id,
                  from:  edge.from,
                  to:edge.to,
                  label: edge.label,
                  color: '#eee',
                  width: edge.width,
              }
          })
          const minimalGraph = {
              nodes:minimalNodes,
              edges:minimalEdges
          }

          this.graphManager.resetColorByStatus() ;
          const defaultGraph = this.graphManager.getGraph() ;

          const data = {} ; //{ ...this.props.project}  ;
          data.graph = defaultGraph ;
          data.projectID = projectId ;
          data.email = this.props.loggedUser.email ; 
          console.log('b4',data)

          axios.patch(`${this.props.api}/project/updateProjectGraph`,data,{
            headers:{
              authorization:this.props.loggedUser.token
            }
          })
          .then((res)=>{
              console.log('update graph response',res.data)
              // if (res.data.data === undefined) {
              //     // didn't save
              //     alert(res.data.message) ; 
              // }
              //communication happened successfully
              this.setState({
                  loading:false,
                  answer:res.data.message,
                  
              }) ;
              // this.viewProjectsFromAPI() ;
              PopUpMessage(res.data.message,'info') ;
              this.initialGraph = defaultGraph ;
          })
          .catch((err)=>{ 
            if (err.response){
              console.log(err.response) ;
              PopUpMessage(err.response.data.message,'error')
            }
            else{
              console.log('Some error',err)
            }
              this.setState({
                  loading:false
              }) ;
              
          })
      }
      else{//no difference
          // console.log('Node Project',this.props, this.graphManager) ;
          PopUpMessage('No change to graph','warning')
      }

  }

  saveNodeTask=(nodePreInfo)=>{
    let nodeTask ={...nodePreInfo} ;
    const {project} =this.props ;
    nodeTask.projectID = project._id ;
    nodeTask.nodeID = `${project._id}_${this.state.currNodeID}` ;
    nodeTask.assigner = [{
      email:`${this.props.loggedUser.email}`,
      permissions:['owner']
    }] ;
    nodeTask.email = this.props.loggedUser.email ;
    nodeTask.taskMembers = []

    let label = this.state.currNodeName ;
    if (label.length<1){
      let nodeFound =  this.state.currGraph.nodes.find(node=>node.id === this.state.currNodeID) ;
      nodeTask.title = nodeFound.label ;
    }
    else{
      nodeTask.title = label ;
    }

    console.log('saving',nodeTask)
    this.setState({
      loading:true
    }) ; 

    axios.post(`${this.props.api}/task/insertTask`,nodeTask,{
      headers:{
        authorization:this.props.loggedUser.token,
        
      }
    })
    .then((res)=>{
      let taskRes = res.data ;
      console.log('saved task',taskRes) ;

      if (taskRes.data){
        let nodeId = '' ;
        if (taskRes.data.errors){
          PopUpMessage(taskRes.message,'error')
        }
        else{
         nodeId= nodeTask.nodeID.split('_')[1] ;
          console.log('updated id',nodeId,taskRes.nodeCompletionStatus)
          PopUpMessage(taskRes.message,'success') ;
          this.changeNodeByStats(nodeId,taskRes.nodeCompletionStatus) ;
        }
        this.viewAllTasksForProject() ;
      }
      else{
        PopUpMessage(taskRes.message,'info')
        this.setState({
          loading:false
        }) ;
      }
    })
    .catch((err)=>{
      if (err.response){
        console.log(err.response) ;
        PopUpMessage(err.response.data.message,'warning')
      }
      else{
        PopUpMessage('Something went wrong,please try again','info')
        console.log('Some error',err)
      }
      this.setState({
        loading:false
      })
    }) ;
  }

  clickNodeHandler = (event)=>{
    // console.log(event) ; 
    const nodeAffected = event.data.node.id ;
    // const nameOfNode = event.data.node.label ;

    if (event.data.captor.altKey){
      //delete node or edge
      if (typeof nodeAffected === 'string'){
        this.removeNode(nodeAffected) ;
      }
      // else if()
    }
    else if(event.data.captor.ctrlKey || event.data.captor.shiftKey){
       //add edge between node
      if (typeof nodeAffected === 'string'){
        this.createEdgeBetweenNode(nodeAffected)
      }
      
    }
    else{
      if (typeof nodeAffected === 'string'){
        this.showTaskModal(nodeAffected)
      }
      this.cleanUpAfterEdgeAddition() ;
    }
  }

  deleteOneTask=(taskId,nodeID)=>{
    let deleteAns = window.confirm('Are you sure you want to delete subtask?') ;
    if (deleteAns){
    
      axios.delete(`${this.props.api}/task/deleteTaskByID/${taskId}`,{
        data: { 
          projectID:this.props.project._id ,
          email:this.props.loggedUser.email
        },
        headers:{
          authorization:this.props.loggedUser.token
        }
      })
      .then((res)=>{
        PopUpMessage(res.data.message,'info') ; 
        let nodeId = nodeID.split('_')[1] ;
        this.changeNodeByStats(nodeId,res.data.nodeCompletionStatus) ;
        this.viewAllTasksForProject() ;

      })
      .catch((err)=>{
        if (err.response){
          console.log('Detailed err:',err.response)
          PopUpMessage(err.response.data.message,'info')
        }
        console.log('some error',err) ;
      })
    }
    else{
      PopUpMessage('Task not deleted','info')
    }
  }

  deleteAllNodeTask=(nodeID, preAns)=>{
    let deleteAns ;
    if (preAns === undefined){
      deleteAns = window.confirm('Are you sure you want to delete all tasks?') ;
    }
    else{
      deleteAns = preAns ;
    }
    if (deleteAns){
      axios.delete(`${this.props.api}/task/deleteTaskByNodeID/${nodeID}`,{
        data: { 
          projectID:this.props.project._id ,
          email:this.props.loggedUser.email
        },
        headers:{
          authorization:this.props.loggedUser.token
        }
      })
      .then((res)=>{
        PopUpMessage(res.data.message,'info')
        let nodeId = nodeID.split('_')[1] ;
        // console.log('delete',res,nodeId)
        if (preAns === undefined){
          this.changeNodeByStats(nodeId,res.data.nodeCompletionStatus) ;
        }
        this.viewAllTasksForProject() ;
      })
      .catch((err)=>{
        if (err.response){
          console.log('Detailed err:',err.response)
        }
        console.log('some error',err) ;
      })
      
    }
    else{
      if (preAns === undefined){
        PopUpMessage('All tasks not deleted','info')
      }
    }
  }

  updateNode=(node)=>{
    node.taskID = node._id ;
    console.log('updated ',node) ; 

    axios.patch(`${this.props.api}/task/updateEverythingTask`,node,{
      headers:{
        authorization:this.props.loggedUser.token
      }
    })
    .then((res)=>{
      console.log('update res',res); 
      let nodeId = node.nodeID.split('_')[1] ;
      console.log('updated id',nodeId)
      PopUpMessage(res.data.message,'info')

      this.changeNodeByStats(nodeId,res.data.nodeCompletionStatus)
    })
    .catch((err)=>{
      if(err.response ){
        console.log('err msg',err.response) ;
      }
    })
  }

  newTaskModal=()=>{
    let curr = this.state.currNodeID ;
    let crit = this.graphManager.getNodeCriticality(curr) ; 
    if (crit === undefined){
      crit = false ; 
    }

    return <Modal show={this.state.showTask} 
    keyboard={true}
    onHide={this.showTaskModal}
    overflow={true} backdrop={true} >
      
      <Modal.Header>
        <Modal.Title>
          Provided tasks - {"Node: "+this.state.currNodeName}

        </Modal.Title>
      </Modal.Header>
    <Modal.Body>
      
      <Task nodeTasks={this.state.nodeTasks} 
      members={this.props.project.groupMembers}
      deleteNodeTasks={this.deleteAllNodeTask} 
      deleteTask={this.deleteOneTask} 
      updateNode={this.updateNode}
      sendTaskInfo={this.saveNodeTask}
      editCritical={this.changeNodeCritical}
      critical = {crit} 
      />
    </Modal.Body>
    <Modal.Footer>
    <IconButton icon={<Icon icon={'road'}/>} onClick={(event)=>this.selectCriticalPath('node',curr)}>
      Path to node on the graph.
      </IconButton>

    </Modal.Footer>
    </Modal>

  }

  changeNodeCritical =(value)=>{
    let result = this.graphManager.editNodeCriticality(this.state.currNodeID,value) ; 
    if (result){
      this.updateGraph() ;
    }
    else{

    }

  }

  changeNodeByStats(nodeId,stats){

    let res = this.graphManager.changeColor(nodeId,stats) ; 
    console.log('change color',res) ;
    if (res){
      this.updateGraph(true) ;
    }
    else{
      PopUpMessage('Could not change node color','info') ;
    }

  }

  selectCriticalPath=(key,nodeEnd)=>{
    console.log('critical',key,nodeEnd) ;
    const nodes = this.state.currGraph.nodes ;
    if (nodes !== undefined && nodes.length>0){
      if (key === 'graph'){
        let highlight =  this.graphManager.highlightGraphCritical() ; 
        if (highlight < 0 ){
          PopUpMessage('Please connect the start node to another node','warning') ;
        }
        else if (highlight >= 0){
          this.updateGraph() ;
          PopUpMessage(`${highlight} critical paths found`,'success') ; 
        }
      }
      else if(key === 'reset'){
        let reset = this.graphManager.resetColorByStatus() ;
        if (reset){
          this.updateGraph() ;
        }
      }
      else if (key === 'node'){
        if (nodeEnd === undefined || typeof nodeEnd !== 'string'){
          PopUpMessage('something went wrong, please try again.','error') ;
        }
        else{
        let highlight =  this.graphManager.highlightNodeCritical(nodeEnd) ;
        if (highlight){
          PopUpMessage('Path found','success') ;
          this.updateGraph() ;
        }
        else{
          PopUpMessage('No path found to task, from the start node','warning') ;
        } 
        this.showTaskModal() ;
          
        }

      }
    
    }
    else{
      PopUpMessage('Please create a graph','warning')
    }
    
  }

  render(){
    console.log('project,',this.props.project) 
          
          //start rendering
          if (this.graphManager !== null){
            const graph = this.state.currGraph;
            console.log('curr',this.graphManager)
            const speaker = (
            <Popover visible={this.state.showNode} title="ADD NODE TO GRAPH">
        
             <Form onSubmit={this.addNewNode} data-testid="form">
                <FormGroup>
                    <ControlLabel> Node Name</ControlLabel>
                    <FormControl name="node" type="text" value={this.state.nodeName} onChange={this.handleChange} />
                </FormGroup>

                <FormGroup>
                    <Checkbox checked={this.state.critical} onChange={this.handleCritical}>
                    Critical Node ?
                    </Checkbox>
                </FormGroup>
                <FormGroup>
                    <FormControl type="submit"/>
                 </FormGroup>
            </Form>
        </Popover>) ; 
         const options = {
          layout: {
            randomSeed: undefined,
            improvedLayout:true,
            clusterThreshold: 150,
            // hierarchical: {
            //   enabled:false,
            //   levelSeparation: 150,
            //   nodeSpacing: 100,
            //   treeSpacing: 200,
            //   blockShifting: true,
            //   edgeMinimization: true,
            //   parentCentralization: true,
            //   direction: 'UD',        // UD, DU, LR, RL
            //   sortMethod: 'hubsize',  // hubsize, directed
            //   shakeTowards: 'leaves'  // roots, leaves
            // }
          },
          nodes:{
            physics:false,
            // size:25,
            shape:'box',
            font:{
              color: '#343434',
              size: 30, // px
              face: 'arial',
              background: 'none',
              strokeWidth: 0, // px
              strokeColor: '#ffffff',
              align: 'center'
            }
          },
          edges: {
            color: "#ff0000" , 
            physics:false ,
            font:'false',
            // {
            //   size:20,
            //   face:'calibri',
            //   align:'middle',
            // },
            arrowStrikethrough:false,
            arrows:{
              to:{
                enabled:true,
                imageHeight: 30,
                type:'arrow'
              }
            },
          },
          // physics:{
            // enabled:true ,
            // forceAtlas2Based: {
            //   theta: 1,
            //   gravitationalConstant: -50,
            //   centralGravity: 0.01,
            //   springConstant: 0.08,
            //   springLength: 100,
            //   damping: 0.4,
            //   avoidOverlap: 0
            // }
          // }
        };
        
        const events = {} ;
        events.select =  function(event) {
          //muted this for warnings
           // var { nodes, edges } = event;
            console.log('sel',event)
          }  ;
        events.externalDragUpdate = this.graphManager.updatePosition ;
        events.dragEnd = function (event){
          console.log('drag',event)

          const nodesAffected = event.nodes ;
          if (nodesAffected.length > 0 ){
            let curr = nodesAffected.shift() ;
            let {x,y} = event.pointer.canvas ;

            let update = events.externalDragUpdate(curr,x,y) ;
            console.log('update',update) ;
          }
        }

        events.externalRemoveNode = this.removeNode ;
        events.externalRemoveEdge = this.removeEdge ;
        events.externalCreateEdge = this.createEdgeBetweenNode
        events.viewTaskInfo = this.showTaskModal ;
        events.cleanup = this.cleanUpAfterEdgeAddition ;
        events.click = function(event){
            console.log('clicked',event,'ctrl',event.event.srcEvent.ctrlKey) ;
            const nodesAffected = event.nodes ;
            const edgesAffected = event.edges ;
            if (event.event.srcEvent.altKey){
              //delete node or edge
              if (nodesAffected.length>0){
                let curr = nodesAffected.shift() ;

                events.externalRemoveNode(curr) ;

              }
              else if (edgesAffected.length> 0) {
                let currE = edgesAffected.shift()
                events.externalRemoveEdge(currE)
              }
            }
            else if (event.event.srcEvent.ctrlKey || event.event.srcEvent.shiftKey){
              //add edge between node
              if (nodesAffected.length>0){
                let curr = nodesAffected.shift() ;
                events.externalCreateEdge(curr) ; 
              }

            }
            else{
              //view task information
              if (nodesAffected.length>0){
                let node = nodesAffected[0];
                events.viewTaskInfo(node) ;

              }
              else{
                // cleanup
                events.cleanup() ;
              }
            }
            
        } 
        var message = 'click on the ? for more help details. ' ;
        if (this.state.currGraph.nodes.length > 0){
          this.state.source === 'from'
                ?message = "To make a line, press and hold Ctrl ,then select source task":
                message = "Keep Holding Ctrl and select end task, click graph stage to cancel selection"
        }
      
            return (
              <div >
                {
                  this.state.loading && (<Loader backdrop speed={'fast'} size={'lg'}/>)
                }
                
              <div id="graph-info" >
                <h3>{this.props.project.projectName}</h3>

                <div id="graph-nav">
                <Whisper speaker={speaker} placement={'autoVerticalStart'} trigger={'active'}>
                <IconButton icon={<Icon icon={'task'}/>} >Add Task</IconButton>
                </Whisper> &nbsp;
                <IconButton onClick={()=>this.checkSavePermissions()} title={"Save Graph"} icon={<Icon icon={'save'}/>}>Save Graph</IconButton>                
                <Dropdown title={"Critical Path"} 
                  icon={<Icon icon={'charts-line'}/>}>
                    <Dropdown.Item icon={<Icon icon={'road'}/>} onSelect={(event)=>this.selectCriticalPath('graph')}>
                      Project Graph Critical Path
                    </Dropdown.Item>
                    <Dropdown.Item icon={<Icon icon={'refresh'}/>} onSelect={(event)=>this.selectCriticalPath('reset')}>
                      Reset Graph
                    </Dropdown.Item>
                  </Dropdown>
                
                  
                  </div>
              </div>


                <div id="graphbox">                     

                      {// return the modal
                      this.newTaskModal()}

                     <Graph key={JSON.stringify(graph)}
                  graph={this.state.currGraph}
                  options={options}
                  events={events}
                  getNetwork={network => {
                    //  if you want access to vis.js network api you can set the state in a parent component using this property
                    // console.log('net',network)
                    network.stabilize(2000);
                  }}
              />
                <GraphHelp text={message}/>

              </div>
              </div>
  
            )
          }
          else{
            return (<div>
              Something Wrong
            </div>)
          }
        
  }
}

GraphPath.propTypes = {
  // task:PropTypes.array,
  project:PropTypes.object.isRequired,
  api:PropTypes.string , 
  updateParent: PropTypes.func.isRequired
}

function mapStateToProps(state){
  return {
      loggedUser:state.loggedUser
  } ;
}


export default connect(mapStateToProps)(withRouter(GraphPath)) ;

  /* 
          */
        