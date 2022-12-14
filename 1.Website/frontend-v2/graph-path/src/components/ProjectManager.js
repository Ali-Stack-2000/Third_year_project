import {React,Component} from "react";
import PropTypes from 'prop-types' ;
import {Icon, SelectPicker, Loader,Input,InputGroup, IconButton} from 'rsuite' ;
import "../css/ProjectManager.css"
import { Route ,Switch, withRouter} from "react-router-dom";
import axios from 'axios' ;
import { connect} from 'react-redux' ;
import PopUpMessage from './Reusable/PopUpMessage';
import Project from "./Project";
import ProjectCard from './Reusable/ProjectCard' ;
import NewProject from "./NewProject";
import ExampleProject from './Reusable/ExampleProject';

/**
*   A component that will make async request to peer server for all projects of the logged user, provided in the props   
*  	It aims to make a list of projects organised in a recently accessed order. When the project opened
*   by default it opens the graph in the specified project. When the project is opened, it should show the graph that will 
*   take up most of the screen.
*   Project Manager lists all the projects and requests the peer server for meta data about the projects.
*   It provides a function for the child component to save the project changes including the graph
*	@component ProjectManager
*	@returns {JSX} <ProjectManager />
*
*/

class ProjectManager extends Component {
	/**
	ProjectManager has a private state.
	@constructs state
	@memberof state#
	*/

    constructor(props){
        super(props) ;
        this.state = {
            sortValue:'recent',
            loading:false,
            currentProject:{},
            projects:[],
            allProjects:[],
            filterValue: 'all',
            filteredProjects:{}
        }
    }

    componentDidMount(){
        var filtV = localStorage.getItem('filtV') ;
        var sortV = localStorage.getItem('sortV') ;
        
        if (filtV !== null){    
            let filtVs = ['myOwn','shared','all'] ;
            if (filtVs.indexOf(filtV)<0){
               filtV = 'all' ;
            }
        }
        
        if (sortV === null){
            
        }
        else{
            let sortVs=['recent','alpha','date']
            let sortQ = sortVs.indexOf(sortV) ;

            if (sortQ < 0){
                sortV = 'recent' 
            }
        }        

        this.setState({
            filterValue:filtV ,
            sortValue:sortV
        }, ()=>this.viewProjectsFromAPI(true)) ;
    }
 /**
A method that requests for all the projects of the logged user and sets the result to Project Manager state.projects.
When the request fails to retrieve any projects it alerts them.
* @returns {void} The method updates the state of Project

*/
    viewProjectsFromAPI=(filt)=>{
        this.setState({
            loading:true 
        }) ;

        axios.get(`${this.props.api}/project/getAllProjectsByUserEmail/${this.props.loggedUser.email}`,{
            headers:{
                authorization: this.props.loggedUser.token 
            }
        })
        .then((res)=>{
            console.log('Success',res) ;
            if (res.data.data !== undefined){
                this.setState({
                    projects :res.data.data ,
                    allProjects: res.data.data ,
                    loading:false
                        
                },()=>{
                    this.sortProjects() ; 
                    this.filterProjects()}) ; 
            }
            else{
                this.setState({
                    loading:false                    
                }) ;
                alert('No projects')
            }

        })
        .catch((err)=>{
            
            this.setState({
                loading:false                                        
            }) ;
            console.log('Error or Rejected',err)
        })
    }

    selectCurrentProject=(project)=>{
        this.setState({
            currentProject:project
        })//,()=>this.updateLastAcessed(project)) ;
        
    }

    updateLastAcessed = (project)=>{
       //check if date on project is not over minutes .
       //if it is update the project. If not ? don't update.
       let accessedProject = {
           lastDateAccessed : new Date().toJSON().slice(0,19) ,
           projId: project["_id"] 
       } 
       console.log('B4 update',accessedProject)
       axios.put(`${this.props.api}/project/updateProjectAccessDate`,accessedProject)
       .then((res)=>{
           console.log('comms for accessdate',res) ;
           if (res.data.data){
               this.viewProjectsFromAPI() ;
           }
           else{
               console.log('Did not update access date successfully') ;
           }
       })
       .catch((err)=>{
           console.log('Comm Error',err) ;
       }) ;


       
    }

/**
A function that makes a request to delete the seletected project.
If the user does not have the right permissions the project will not be deleted.
The neccesary information for the request to go through follows:
@param {Object} project - The project object should contain projectID , email and permissions.
@param {string} project[].email - The email of requesting user.
@param {string} project[].projectID - the unique id of the project.
@returns {void} The method updates the state of Project
*/


    deleteProject=(project)=>{
    //make request for deleting project.
        if(project === undefined){
            alert('Can\'t delete Project. Project Invalid') ;
        }
        else{

            let deleteAns = window.confirm('Are you sure you want to delete project ['+project.projectName+'] ?') ;
            if (deleteAns){
           
                this.setState({
                    loading:true,
                    // linkNumber:-1
                }) ;
                console.log('B4 del',project)
                axios.delete(`${this.props.api}/project/deleteProject`,{
                    headers:{
                        authorization:this.props.loggedUser.token
                    } ,
                    data:{
                        email:this.props.loggedUser.email,
                        projectID:project._id
                    }
                })
                .then((res)=>{
                    if (res.status >=400){
                        throw res ;
                    }
                    if(res.data.message === undefined){
                        alert('Network Error') ;
                        this.setState({
                            loading:false
                        }) ;
                    }
                    else{
                        this.setState({
                            answer:res.data.message
                        })//,()=>this.showPopUP()) ;
                        ;
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
            else{
                PopUpMessage('Project not deleted','info')
            }
        
        }
    }

    handleSortChange =(value)=>{
        // console.log('value',value )
        this.setState({
            sortValue:value
        },()=>this.sortProjects()) ;
    }

    handleFilterChange = (value)=>{
        this.setState({
            filterValue:value
        }, ()=> this.filterProjects());
    }

    sortProjects = ()=>{
        //if recent? newest last aceess date comes first
        //if alphabetical ? project name is used to sort alphabetically
        //if date ? oldest project first
        // console.log('sorting...') ;
        if (this.state.sortValue === 'recent'){
            let newArray = this.state.projects.sort((v1,v2,)=>{
                let date1=v1.lastAccessed.toLowerCase();
                let date2 = v2.lastAccessed.toLowerCase();

                if(date1<date2){
                    //date1 came first, put last
                    return 1 ;
                }
                if (date1>date2){
                    return -1 ;
                }
                return 0 ;
            }) ;
            this.setState({
                projects:newArray ,
            }) ;
        }
        else if (this.state.sortValue === 'alpha'){
            let sortedArray = this.state.projects.sort((v1,v2)=>{
                let date1 = v1.projectName.toLowerCase() ;
                let date2 = v2.projectName.toLowerCase() ;

                if (date1<date2){
                    return -1 ;
                }
                else if (date1>date2){
                    return 1 ;
                }
                return 0 ;
            })
            this.setState({
                projects:sortedArray
            }) ;
        }
        else{
            let newArray = this.state.projects.sort((v1,v2,)=>{
                let date1=v1.dueDate.toLowerCase();
                let date2 = v2.dueDate.toLowerCase();

                if(date1<date2){
                    return -1 ;
                }
                if (date1>date2){
                    //date1 came first, put last

                    return 1 ;
                }
                return 0 ;
            }) ;
            this.setState({
                projects:newArray ,
            }) ;
            

        }

        localStorage.setItem('sortV',this.state.sortValue) ;
    }

    //Filter Projects
    filterProjects = ()=>{
        //console.log('email: ', this.props.loggedUser.email)
        if(this.state.filterValue === 'myOwn') {

            let projectsByEmail1 = this.state.allProjects.filter((myProjects1)=>{
                    return myProjects1.projectOwner === this.props.loggedUser.email;
            });
            this.setState({
                projects:projectsByEmail1
            })
        }
        else if(this.state.filterValue === 'shared'){
            let projectsByEmail2 = this.state.allProjects.filter((myProjects2)=>{
                    return myProjects2.projectOwner !== this.props.loggedUser.email;
            });
            this.setState({
                projects:projectsByEmail2
            })
        }
        else{
            console.log('all')
            this.setState({
                projects: this.state.allProjects
            })
        }

        localStorage.setItem('filtV',this.state.filterValue) ;
    }
    newProjectModalRef=(obj)=>{
        this.showModal = obj && obj.handleShow;
    }

    showM=()=>{
        this.showModal();
    }
    /**
	@param {Object} project object together with request identity
    */

    sendProjectInfo=(project)=>{

        project.email = this.props.loggedUser.email ;

        console.log('b4 api',project) ;

        axios.post(`${this.props.api}/project/newProject`,project,{
            headers:{
                authorization:this.props.loggedUser.token,
                'Content-Type': 'application/json;charset=UTF-8',
                "Access-Control-Allow-Origin": "*",
            }
            
        })
        .then((res)=>{
        console.log('api',res) ;
            if(res.headers.authorization){
                PopUpMessage('Project created','success')
                this.props.updateUserToken(res.headers.authorization)
                this.viewProjectsFromAPI() ;
            }
            else{
                PopUpMessage(`${res.data.message}`,'warning')
            }
        },(reject)=>console.log('rejected',reject))
        .catch((err)=>{
            for (let key of Object.keys(err)){
                console.log(key,': ',err[key])

            }
            console.log('err',err)
        })
    }

    searchProjects=(word)=>{
        if (word){
            word = word.toLowerCase() ; 
            let filter = this.state.allProjects.filter((proj)=>proj.projectName.toLowerCase().indexOf(word)>= 0 ) ; 
            this.setState({
                projects:filter 
            })
        }
        else{
            this.setState({
                projects:this.state.allProjects 
            })
        }
    } 
    
    render(){
        let fullProject = ExampleProject() ;
        fullProject. groupMembers = [{
            email:this.props.loggedUser.email,
            label:this.props.loggedUser.name === undefined ?this.props.loggedUser.email :this.props.loggedUser.name,
            permissions:[
                "owner"
            ]
        }]
        
        // console.log('mgr',this.props)


        const options = [{
            label:'Recently Accessed',value:'recent'},{label:'Alphabetical',value:'alpha'},{label:'Due Date',value:'date'}] ;
        const filterOptions=[{label:'All Projects', value:'all'},{label:'Own Project', value:'myOwn'},{label:'Shared Project', value:'shared'}];

        const filterSelected = filterOptions.find((val)=>val.value === this.state.filterValue) ;
        let filterPlaceholder = 'Filter: ' ;
        if (filterSelected){
            filterPlaceholder = 'Filter: '+filterSelected.label ;
        }

        const sortSelected = options.find(val=>val.value === this.state.sortValue) ;
        let sortPlaceholder = 'Sort: ' ;
        if (sortSelected){
            sortPlaceholder = 'Sort: '+sortSelected.label ;
        }

        const {match} = this.props ;
        if (this.state.loading){
            return <Loader backdrop={false} speed={'slow'} size={'lg'} />
        }
        else{
            return( 
                <div data-testid="tidProjectManager" id="projectManager">
                    <NewProject  ref={this.newProjectModalRef} sendProjectInfo={this.sendProjectInfo} api={this.props.api} />
                      <Switch>
                        <Route path={`${match.path}/project`} render={()=>{
                                return <Project api={this.props.api} user={this.props.loggedUser} project={this.state.currentProject}
                                selectProject={this.selectCurrentProject}/>
                        }}/>
                        <Route >
                            <div>
                            <IconButton id="newProj" onClick={this.showM}
                              icon={ <Icon icon={'plus-circle'} title={"New Project"}/> } >New Project
                            </IconButton>

                                <SelectPicker id="filter" placeholder={`${filterPlaceholder}`} searchable={false} data={filterOptions} onChange={this.handleFilterChange}/>
                            <SelectPicker id="sort" placeholder={`${sortPlaceholder}`} searchable={false} data={options}  onChange={this.handleSortChange}/>
                            <div id="search-div" >
                                <InputGroup id="search-bar" inside >
                                    <Input onChange={this.searchProjects}/>
                                    <InputGroup.Button>
                                        <Icon icon="search" />
                                    </InputGroup.Button>
                                </InputGroup>
                            </div>
                            <div data-testid="tidProjList" id="projects-list">
                                {
                                this.state.projects.length > 0?
                                this.state.projects.map((project,index)=>{
                                return <ProjectCard key={`${index+1}${project.projectName}`} 
                                project={project} 
                                link={`${match.url}/project`} 
                                selectProject={this.selectCurrentProject}
                                deleteProject={this.deleteProject} />    
                                })
                                :<div>
                                    <h1>No projects found please create new projects </h1>
                                    <ProjectCard project={fullProject}
                                     link={`${match.url}/project`} 
                                     selectProject={this.selectCurrentProject}
                                    
                                    />
                                    <h6>Take a tour through the example project and start creating managing new projects</h6>
                                </div>                
                            }
                                </div>
                    
                            </div>
                        </Route>
                    </Switch>
        
                    
                </div>)
        }
        
    }
}

ProjectManager.propTypes = {
    loggedUser :PropTypes.object,
    api:PropTypes.string

}

function updateUserToken(token){
    return {
      type:'UPDATE_TOKEN' ,
      payload: {
        token:token
      }
    }
  }

function mapStateToProps(state){
    return {
        loggedUser:state.loggedUser
    } ;
  }
  

const mapDispatchToProps = {
    updateUserToken,
  }

export default connect(mapStateToProps,mapDispatchToProps)(withRouter(ProjectManager)) ; 
