import React from 'react';
import axios from "axios";
import {Button, Dropdown, FlexboxGrid, List} from "rsuite";
import {Radar} from 'react-chartjs-2';
import Logo from "../img/Logo4.png";
import PropTypes from "prop-types";

class RadarChart extends React.Component{
    constructor(props){
        super(props) ;
        this.state = {
            currentProject:{},
            projects:[],
            nodes:[],
            showChart: false
        }
    }

    componentDidMount(){
        this.getAllProjects() ;

    }

    getProjectChart=(projId)=>{
        if(this.state.projects.length > 0 ) {
            this.setState({
                showChart:true
            })
            // console.log("get proj id", this.state.projId)


            axios.get(`${this.props.api}/project/statistics/RadarGraph/`+projId, {
                headers: {
                    authorization: this.props.user.token
                }
            }).then((res) => {
                // console.log('Stats Success', res.data.data);
                if (res.data.data !== undefined) {
                    this.setState({
                        nodes: res.data.data,
                        // loading:false

                    });
                }
            })
                .catch((err) => {
                    console.log('Error or Rejected', err)
                })
        }
    }

    getAllProjects=()=>{

        axios.get(`${this.props.api}/project/getAllProjectsByUserEmail/${this.props.user.email}`,{
            headers:{
                authorization: this.props.user.token
            }
        })
            .then((res)=>{
                // console.log('Success',res) ;
                if (res.data.data !== undefined){
                    this.setState({
                        projects :res.data.data ,
                        // loading:false

                    }) ;
                    // if(this.state.projects > 0){
                    // this.getProjectChart();
                    // }

                }
                else{
                    // this.setState({
                    //     loading:false
                    // }) ;
                    alert('No projects')
                }

            })
            .catch((err)=>{

                // this.setState({
                //     loading:false
                // }) ;
                console.log('Error or Rejected',err)
            })
    }


    render() {
        // console.log('stats proj',this.state.projects.length)
        if(this.state.projects.length > 0){
            // console.log('stats proj',this.state.projId)
            // const data = {
            //     labels
            // }

        }
        // console.log("nodes",this.state.nodes)


        return(
            <>

                <div>
                    <h3>Project Tasks Statistics</h3>
                    <Dropdown  title={"Select Project"}>
                        <Dropdown.Item style={{minWidth:"30vw",marginRight:"10%"}}>
                            <List hover>
                                {this.state.projects.map((item,index)=>
                                    item.projectOwner === this.props.user.email || item.permissions.includes("view statistics")?
                                    <List.Item key={index} index={index}>
                                        <FlexboxGrid>
                                            <FlexboxGrid.Item
                                                colspan={6}
                                            >
                                                <div>{item.projectName}</div>
                                            </FlexboxGrid.Item>
                                            <FlexboxGrid.Item
                                                colspan={6}

                                            >

                                            </FlexboxGrid.Item>
                                            <FlexboxGrid.Item
                                                // colspan={6}
                                                style={{

                                                }}
                                            >
                                                <Button onClick={()=>this.getProjectChart(item._id)}>View</Button>
                                            </FlexboxGrid.Item>
                                        </FlexboxGrid>
                                    </List.Item>
                                        :
                                        <>
                                            {/*<h6>No Projects</h6>*/}
                                        </>
                                )}
                            </List>
                        </Dropdown.Item>
                    </Dropdown>
                </div>

                {

                    this.state.projects.length > 0 && this.state.showChart?
                        <>
                            {/*<h1>Projects</h1>*/}


                            <Radar
                                data={{
                                    labels: this.state.nodes.labels,
                                    datasets: [{
                                        label:this.state.nodes.projectName,
                                        data:this.state.nodes.data,
                                        fill: true,
                                        backgroundColor: 'rgba(255,99,132,0.2)',
                                        borderColor: 'rgb(255,99,132)',
                                        pointBackgroundColor: 'rgb(255, 99, 132)',
                                        pointBorderColor: '#fff',
                                        pointHoverBackgroundColor: '#fff',
                                        pointHoverBorderColor: 'rgb(255, 99, 132)'
                                    }],


                                }}

                                height={400}
                                width={600}
                                options={{
                                    maintainAspectRatio: false,
                                    elements:{
                                        line: {
                                            borderWidth: 3
                                        }
                                    },
                                    scales:{
                                        r:{
                                            angleLines:{
                                                display: false
                                            },
                                            grid:{
                                                color: "#c4b2b2"
                                            },
                                            pointLabels:{
                                                color: "#34c3ff",
                                                font:{
                                                    size:15
                                                }
                                            }
                                        }
                                    },
                                    plugins:{
                                        legend:{
                                            labels:{
                                                font:{
                                                    size:15
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                        </>
                        :
                        <>
                            <h4>
                                Select Project you want to view the Tasks stats for.
                            </h4>
                            <img alt="graph logo" id="logoPic" src={Logo}/>
                        </>
                }
            </>
        )
    }
}

RadarChart.propTypes = {
    user:PropTypes.object.isRequired,
    api:PropTypes.string ,
}

export default RadarChart;

