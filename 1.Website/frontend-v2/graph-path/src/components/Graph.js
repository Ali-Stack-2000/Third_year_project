import {React,Component} from "react";
import Graph from 'react-graph-vis' ; 
import  PropTypes, { string }  from "prop-types";
import { Link , withRouter} from "react-router-dom";
import '../css/Graph.css' ;
import GraphManager from "./Helpers/GraphManager";
import { Popover,Whisper, Button,Form,FormGroup,FormControl,ControlLabel, Modal, Checkbox, IconButton, Icon, Loader} from 'rsuite' ;
import ModalHeader from "rsuite/lib/Modal/ModalHeader";
import axios from "axios";
import PopUpMessage from "./Reusable/PopUpMessage";
import Task from "./Task";

class GraphPath extends Component{
  graphManager = null ;
  
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
      nodeTasks:[]
    }
  }
  componentDidMount(){
    const {graph} = this.props
    const graphObj = JSON.parse(JSON.stringify(graph)) ;
    // const graphObj = {...graph}
    console.log('created',graphObj)

    if (graph !== undefined ){
      this.graphManager = new GraphManager(graphObj)
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
    let semiUpdate = this.props.project ;
    if (this.graphManager !== null){
        semiUpdate.graph = this.graphManager.getGraph() ;
        // this.setState({
         delete this.graphManager  
        // }) ;
    }
    //update parent
    this.props.updateParent(semiUpdate) ;
    console.log('update parent',semiUpdate)
    
  }
  viewAllTasksForProject = ()=>{
    if (this.props.project !== undefined){
        const projectId = this.props.project._id ;
        axios.get(`${this.props.api}/task/getAllTasksByProject/${projectId}`)
        .then((res)=>{
            console.log('Tasklist',res) ;
            if (res.data.data !== undefined){
                this.setState({
                    taskList:res.data.data ,
                    loading:false 
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
    }

}
  showNodeForm = ()=>{
    this.setState({
      showNode:!this.state.showNode
    }) ;
  }

  showTaskModal=(nodeId)=>{
    let filter = this.state.nodeTasks ;
    if (typeof nodeId === 'string' && this.props.project !== undefined){
      filter= this.state.taskList.filter((value)=>
      value.nodeID === `${this.props.project._id}_${nodeId}`) ;
      
    }

    this.setState({
      showTask:!this.state.showTask ,
      nodeTasks:filter 
    }) ;
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
  
  updateGraph=()=>{
    
    this.setState({
      currGraph: this.graphManager.getGraph() 
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
        this.graphManager.addNode(name) ;
        this.setState({
          currGraph: this.graphManager.getGraph() 
        },()=>  this.cleanUpAfterNodeAddition() )  ;
      
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
        this.setState({
          target:id
        }) ; 
        this.graphManager.setGraph(this.state.currGraph) ;
        let addedEdge = this.graphManager.addEdge(this.state.source,this.state.target) ;
        console.log('adding edge',addedEdge) ;

    if (addedEdge === 1){
      this.updateGraph() ;
      console.log('adding edge',this.graphManager.getGraph()) ;

    }
    else if (addedEdge === 0 ){
      // alert('Edge Makes graph Cyclic')
      PopUpMessage('Edge Makes graph Cyclic','error')

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
    let result = this.graphManager.removeNode(id) ;
    if (result){
      this.updateGraph() ;
    }
    else{
      //could not delete
    }
    return result ;
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
        let oldGSum = oldG.edges.length + oldG.nodes.length ;
        let newGSSum = newG.edges.length + newG.nodes.length ;
        if (oldGSum !== newGSSum){
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

    var saveGraph = this.validateGraphDifference(this.props.graph,this.state.currGraph)
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
                color:node.color
            }
        }) ;
        const minimalEdges = this.state.currGraph.edges.map((edge)=>{
            return {
                id: edge.id,
                from: edge.from,
                to: edge.to,
                label: edge.label,
                color: edge.color,
                size: edge.size,
            }
        })
        const minimalGraph = {
            nodes:minimalNodes,
            edges:minimalEdges
        }
        const data = { ...this.props.project}  ;
        data.graph = minimalGraph
            
        axios.put(`${this.props.api}/project/updateEverythingProject/${projectId}`,data)
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
            PopUpMessage(res.data.message,'info')
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
        console.log('Node Project',this.props, this.graphManager) ;
        alert('no change in graph')
    }

}



  render(){

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
            edges: {
              color: "#ff0000" , 
              physics:false 
            },
            physics:{
              enabled:false ,
              // forceAtlas2Based: {
              //   theta: 1,
              //   gravitationalConstant: -50,
              //   centralGravity: 0.01,
              //   springConstant: 0.08,
              //   springLength: 100,
              //   damping: 0.4,
              //   avoidOverlap: 0
              // }
            }
          };
          
          const events = {} ;
          events.select =  function(event) {
              var { nodes, edges } = event;
            }  ;

          events.externalRemoveNode = this.removeNode ;
          events.externalRemoveEdge = this.removeEdge ;
          events.externalCreateEdge = this.createEdgeBetweenNode
          events.viewTaskInfo = this.showTaskModal ;
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
              else if (event.event.srcEvent.ctrlKey){
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
              }
              
          }  
          // console.log(' eve',events)
          
          //start rendering
          if (this.graphManager !== null){
            const graph = this.state.currGraph;
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
        </Popover>)
            return (
              <div >
                {
                  this.state.loading && (<Loader backdrop speed={'fast'} size={'lg'}/>)
                }
                
               <Modal keyboard={true} show={this.state.showTask}
               overflow={true} backdrop={true} onHide={this.showTaskModal}>
                 <ModalHeader closeButton={false} >
                   <Modal.Title>
                     Provided tasks
                   </Modal.Title>
                 </ModalHeader>
                   <Modal.Body>
                     <Task nodeTasks={this.state.nodeTasks} sendTaskInfo={(task)=>console.log('Inside modal from task',task)}/>
                   </Modal.Body>
               </Modal>
               <h3>{this.props.project.projectName}</h3>
              <div id="graphbox">
                <div id="graph-nav">
                <Whisper speaker={speaker} placement={'leftStart'} trigger={'active'}>
                <Button >Add Node</Button>
              </Whisper>
              <IconButton onClick={()=>this.checkSavePermissions()} title={"Save Graph"} icon={<Icon icon={'save'}/>}/>
                </div>
              
              <Graph key={JSON.stringify(graph)}
                  graph={graph}
                  options={options}
                  events={events}
                  getNetwork={network => {
                    //  if you want access to vis.js network api you can set the state in a parent component using this property
                    // console.log('net',network)
                    network.stabilize(2000);
                  }}
              />
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

GraphPath.defaultProps = {
  api:'http://localhost:9001'
}

GraphPath.propTypes = {
  graph:PropTypes.object.isRequired , 
  // task:PropTypes.array,
  project:PropTypes.object,
  api:PropTypes.string , 
  updateParent: PropTypes.func.isRequired
}

export default withRouter(GraphPath) ;
// let graph2 = {
//             nodes: [
//               { id: 1, label: "Node 1", title: "node 1 tootip text" },
//               { id: 2, label: "Node 2", title: "node 2 tootip text" },
//               { id: 3, label: "Node 3", title: "node 3 tootip text" },
//               { id: 4, label: "Node 4", title: "node 4 tootip text" },
//               { id: 5, label: "Node 5", title: "node 5 tootip text" }
//             ],
//             edges: [
//               { from: 2, to: 4 },
//               { from: 2, to: 5 }
//             ]
//           };
  /* <Row>
              <Col>
                <Panel bordered bodyFill header="Task"/>
                </Col>
                <Col>
                <Panel bordered bodyFill header="Task"/>
                </Col>
                <Col>
                <Panel bordered bodyFill header="Task"/>
                </Col>
                <Col>
                <Panel bordered bodyFill header="Task"/>
                </Col>

              </Row> */
        