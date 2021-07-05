import React from 'react';
import './css/App.css';
import './css/Login.css'
import Header from './components/Header' ; 
/*Changed this to class type*/
class App extends React.Component {

  constructor(props){
    super(props) ; 
    this.state = {
      logged: false ,
      dash:false
    }
  }

  logInValid = () =>{
    // console.log('App must login') ;
    this.setState({
      logged: true
    }) ; 
  }

  logOffValid = () =>{
    console.log('App must logout') ;
    this.setState({
      logged: false
    }) ; 
  }

  // dashboardViewToogle = () =>{
  //   this.setState({
  //     dash:!this.state.dash
  //   }) ; 
  // }



  render(){
    if (this.state.logged){
     
      return (
        <div className="App">
        <Header
        logOut={this.logOffValid} />
      </div>
      ) ; 
    }
    else{

      return (
          <div className="App">
            <Header logInValid={this.logInValid} />
          <div>
            <img src="#" alt="img1" webkitallowfullscreen="1" />
          </div>
        </div>
      );
  }
}

}

export default App;

// **************************************************//


    // else if (this.state.dash && this.state.logged){
    //   return (
    //     <div className="App">
    //     <Header log={this.state.logged} logOut={this.logoff} dashboard={this.state.dash} dashboardView={this.dashboardViewToogle} />
    //     <Dashboard toogleDash={this.dashboardViewToogle} />
    //   </div>
    //   ) ;
    // }