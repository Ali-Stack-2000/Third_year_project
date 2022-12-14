import React from 'react' ;
import {
    Button,
    Divider,
    Drawer
} from "rsuite";
import '../css/Profile.css'
import Logo from "../img/Logo3.png";
import PropTypes from "prop-types";
import RadarChart from "./RadarChart";
import Tooltip from "./Tooltip";
class Profile extends React.Component{
    constructor(props) {
        super(props);
        this.state ={
            show:false,
            disabled: true
        }
    }

    handleShow=()=>{
        this.setState({
            show:true
        })
    }

    handleClose=()=>{
        this.setState({
            show:false
        })
    }

    enableEdit = () => {
        this.setState({
            disabled: !this.state.disabled
        })
    }

    tooltipModalRef=(obj)=>{
        // console.log('ref0',obj) ;

        this.showTooltip = obj && obj.handleOpen;
    }

    showT=()=>{

        this.showTooltip();
    }

    render() {
        const picture = this.props.user.picture;
        const user = this.props.user;
        return(
            <>
                <Tooltip ref={this.tooltipModalRef} />
                <Drawer full placement={"top"} backdrop={"static"} show={this.state.show} onHide={this.handleClose}>
                    <Drawer.Header>
                        <Drawer.Title style={{textAlign:"center"}}>Profile</Drawer.Title>
                        <Divider/>
                    </Drawer.Header>
                    <Drawer.Body id="body-div">
                        <div id="picture-div">

                            <img src={picture} alt='user'/>
                            <Divider/>
                            <h6>{this.props.user.name}</h6>

                        </div>
                        <div id="div-form">
                            <form className="profileForm" onSubmit={this.onSubmit} >
                                <label>Username</label>
                                <input defaultValue={this.props.user.name}
                                       disabled = {!!(this.state.disabled)}
                                       onChange={this.change}
                                       type='text'    />


                                <label>Email</label>
                                <input value={user.email}
                                       disabled
                                       type='text'/>

                            </form>

                        </div>
                        <img id="logo-pics" src={Logo} alt='logo'/>
                        <Button id="tooltip-btn-profile" onClick={this.showT}>Tool Tips</Button>
                    </Drawer.Body>
                </Drawer>
            </>
        )
    }


}

RadarChart.propTypes = {
    user:PropTypes.object.isRequired,
}

export default Profile;