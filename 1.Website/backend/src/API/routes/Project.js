require('dotenv').config({path:'../../.env'})
const authentication = require('./Middleware/Authentication');
const authorisation =  require('./Middleware/Authorisation');
const express = require('express');
const mongoose = require('mongoose') ;
const router = express.Router();
const ObjectId = require('mongodb').ObjectID;
const ProjectManagerService = require('../../Services/ProjectManagerService');
const TaskManagerService = require('../../Services/TaskManagerService');
const kanbanBoard = require('../../Helpers/kanbanBoard');
const { param,body, validationResult } = require('express-validator');
const mailer = require('../../Helpers/SendMail');

const { auth, requiresAuth } = require('express-openid-connect');
const {projectCompletion} = require("../../Helpers/SendMail");
function makeProjectRoute(db) {


    router.get("/statistics/RadarGraph/:projectID",
        //authentication.authenticateToken,
        param("projectID").exists().notEmpty().isMongoId(),
        async (req,res)=>{
            const projectID = req.params.projectID;
            const responseObj = {
                projectName: "",
                numTasks: 0,
                labels : [],
                data: [],


            }
           await ProjectManagerService.getProjectByID(db,projectID)
               .then((project)=>{
                    responseObj.projectName = project.projectName;

                })
               .catch((err)=>{
                   res.send({
                       message: "Statistics,failed to get project by ID ",
                       data: err
                   })
               })

             TaskManagerService.getAllTasksByProject(db,projectID)
                .then((tasks)=>{
                    responseObj.numTasks = tasks.length;
                    for (let i = 0; i < tasks.length ; i++) {

                        let NodeLabel = tasks[i].title;
                        let NodeID =  tasks[i].nodeID;
                        let NodeTasks = tasks.filter(task => task.nodeID ===NodeID);
                        if(!responseObj.labels.includes( tasks[i].title)){
                            responseObj.labels.push(NodeLabel);
                            responseObj.data.push( NodeTasks.length);
                        }


                    }
                    res.send({
                        message: "successful",
                        data: responseObj
                    })

                })
                .catch((err)=>{
                    res.send({
                        message: "Statistics: radar Graph failed, failed to generate stats ",
                        data: []
                    })
                })



        })

    router.get("/statistics/donutChart/:projectID",
        //authentication.authenticateToken,
        param("projectID").exists().notEmpty().isMongoId(),
        async (req,res)=>{
            const projectID = req.params.projectID;
            const responseObj = {
                projectName: "",
            }
            await ProjectManagerService.getProjectByID(db,projectID)
                .then((project)=>{
                    responseObj.projectName = project.projectName;

                })
                .catch((err)=>{
                    res.send({
                        message: "Statistics donutChart,failed to get project by ID ",
                        data: err
                    })
                })

            TaskManagerService.getAllTasksByProject(db,projectID)
                .then((tasks)=>{
                    responseObj.numTasks = tasks.length;
                    let notStarted = [] ;
                    let inProgress = [] ;
                    let finished = [] ;


                    for (let i = 0; i < tasks.length ; i++) {

                        if(tasks[i].status ==="complete") {



                            finished.push( {
                                title: tasks[i].description,
                                tasksMembers: tasks[i].taskMembers,
                            });
                           }

                        else if(tasks[i].status ==="in progress") {
                            inProgress.push( {
                                title: tasks[i].description,
                                tasksMembers: tasks[i].taskMembers,
                            });

                        }

                        else if(tasks[i].status ==="not started") {
                            notStarted.push( {
                                title: tasks[i].description,
                                tasksMembers: tasks[i].taskMembers,
                            });
                        }

                    }
                    const total = notStarted.length + inProgress.length +finished.length;
                    let notStartedNum = (notStarted.length/total)*100;
                    let inProgressNum = (inProgress.length/total)*100;
                    let finishedNum   = (finished.length/total)*100;

                    responseObj.labels = ["not started","in-progress","complete"]
                    responseObj.data = [notStartedNum,inProgressNum,finishedNum]
                    responseObj.notStartedTasks = notStarted;
                    responseObj.inProgressTasks = inProgress;
                    responseObj.finishedTasks = finished;
                    res.send({
                        message: "successful",
                        data: responseObj,
                    })

                })
                .catch((err)=>{
                    res.send({
                        message: "Statistics: radar Graph failed, failed to generate stats ",
                        data: []
                    })
                })



        })


    router.get("/statistics/barchart/:projectID/:email",
        //authentication.authenticateToken,
        param("projectID").exists().notEmpty().isMongoId(),
        async (req,res)=>{
            const projectID = req.params.projectID;
            const userEmail = req.params.email;
            const responseObj = {
                projectName: "",
            }
            await ProjectManagerService.getProjectByID(db,projectID)
                .then((project)=>{
                    responseObj.projectName = project.projectName;

                })
                .catch((err)=>{
                    res.send({
                        message: "Statistics barchart,failed to get project by ID ",
                        data: err
                    })
                })

            TaskManagerService.getAllTasksByProject(db,projectID)
                .then((tasks)=>{
                    const userTasks = tasks.filter(task => task.taskMembers.includes(userEmail.toString()));
                    console.log(userTasks)
                    responseObj.numTasks = userTasks.length;
                    let notStarted = [] ;
                    let inProgress = [] ;
                    let finished = [] ;


                    for (let i = 0; i < userTasks.length ; i++) {

                        if(userTasks[i].status ==="complete") {



                            finished.push( {
                                title: userTasks[i].description,
                                tasksMembers: userTasks[i].taskMembers,
                            });
                        }

                        else if(userTasks[i].status ==="in progress") {
                            inProgress.push( {
                                title: userTasks[i].description,
                                tasksMembers: userTasks[i].taskMembers,
                            });

                        }

                        else if(userTasks[i].status ==="not started") {
                            notStarted.push( {
                                title: userTasks[i].description,
                                tasksMembers: userTasks[i].taskMembers,
                            });
                        }

                    }
                    const total = notStarted.length + inProgress.length +finished.length;
                    let notStartedNum = (notStarted.length/total)*100;
                    let inProgressNum = (inProgress.length/total)*100;
                    let finishedNum   = (finished.length/total)*100;

                    responseObj.labels = ["not started","in-progress","complete"]
                    responseObj.data = [notStartedNum,inProgressNum,finishedNum]
                    responseObj.notStartedTasks = notStarted;
                    responseObj.inProgressTasks = inProgress;
                    responseObj.finishedTasks = finished;
                    res.send({
                        message: "successful",
                        data: responseObj,
                    })

                })
                .catch((err)=>{
                    res.send({
                        message: "Statistics: barchart Graph failed, failed to generate stats ",
                        data: err
                    })
                })



        })

    router.get('/requestToken',

        (req,res)=>{
            // Authentication User

            authentication.generateToken(req,res,db)
                .then((token)=>{
                    res.send({
                        message3: token
                    })
                })
                .catch(err=>{
                    res.send({
                        message: "token creation failed"
                    })
                });


        })

    router.get("/sendMail",
        (req,res)=> {

        const projectOwner =  req.body.email;
        const email = req.body.email;
        const projectName = "test new project";
        const projectDueDate = "1998/10/25";
        const projectDescription = " this is the project and tells us what the project is about";
       // mailer.newAccount(email);
        //mailer.sendInvites("test Project 1", email);
        //mailer.newProject(projectName,projectOwner,projectDueDate,projectDescription)


    })

    /**
     * @api {get}  /project/convertToKanbanBoard
     * @apiName return as given project as datasourse for kanban
     * @apiDescription This endpoint creates a datasourse for a kanban board
     * @apiGroup Project
     * @apiParam {String} [email] Email used for the kanban
     * @apiSuccess (200) {object} datasourse for kanban
     */
    router.get('/convertToKanbanBoard/:email',
        //authentication.authenticateToken,
        //uthorisation.AuthoriseKanbanBoard,
        param('email').exists().notEmpty().isEmail(),
        //param('id').exists().notEmpty().isMongoId(),
        async (req, res) => {
            const failedValidation = validationResult(req);
            if (!failedValidation.isEmpty()) {
                res.status(420).send({
                    message: "Bad request , invalid parameters",
                    data: failedValidation
                })
            }

            const email = req.params.email;
            let responseObject = {
                message: "",
                data: []
            }
            let AllProjects =  await ProjectManagerService.getAllProjectsByUserEmail(db,email).then((projects) => {
                    return projects
                })
            console.log(AllProjects);

            for (let i = 0; i < AllProjects.length; i++) {

                let projectObj ={
                    projectName: AllProjects[i].projectName,
                }
                await TaskManagerService.getAllTasksByProject(db ,AllProjects[i]._id.toString())
                    .then((task)=>{

                        projectObj.tasks = task;
                        responseObject.data.push(projectObj)

                    })

            }

            res.send(
                responseObject
            )


        })



    /**
     * @api {get}  /project/getAllProjectsByUserEmail/:email
     * @apiName list projects owned by email
     * @apiDescription This endpoint returns a list of all Projects belonging to the user
     *                 mathing the passed in email
     * @apiGroup Project
     * @apiParam {String} [email] Email of the user the projects belong to
     * @apiSuccess (200) {List} list of Project objects
     */
    router.get('/getAllProjectsByUserEmail/:email',
        authentication.authenticateToken,
        param('email').exists().notEmpty().isEmail(),
        (req, res) => {
            const invalidFields = validationResult(req);
            if(!invalidFields.isEmpty()){
                res.status(420).send({
                    message: "Bad request , invalid id",
                    data: invalidFields
                })
            }

            let mail=req.params.email;
            ProjectManagerService.getAllProjectsByUserEmail(db,mail)
                .then(ans=>{

                if (ans ==="No matched projects")
                {
                    res.send({
                        message: "unsuccessful. "+ans+" for user: "+mail,
                        data: []
                    })
                }

                else{

                    res.send({
                        message: "successful",
                        data: ans
                    })
                }
            })
                .catch(err => {
                res.status(500).send({
                    message: "Server error. Could not retrieve projects.",
                    data: null

                });
            })

    })


    /**
     * @api {get}  /project/getProjectByID/:id
     * @apiName list projects owned by email
     * @apiDescription This endpoint returns a list of all Projects belonging to the user
     *                 matching the passed in ID
     * @apiGroup Project
     * @apiParam {String} [id] ID of the project being retrieved
     * @apiSuccess (200) {List} list of Project objects
     */
    router.get('/getProjectByID/:id',
        authentication.authenticateToken,
        param('id').exists().notEmpty().isMongoId(),
        (req,res)=>{
            const invalidFields = validationResult(req);
            if(!invalidFields.isEmpty()){
                res.status(420).send({
                    message: "Bad request , invalid id",
                    data: invalidFields
                })
            }

            const ID = req.params.id;
            ProjectManagerService.getProjectByID(db,ID)
                .then(ans=>{
                if(ans === "No project"){
                    res.send({
                        message: "No project with this ID"
                    })

                }else if(ans != null){
                    res.send({
                        message: "Project retrieved.",
                        data: ans
                    })
                }else{
                    res.send({
                        message: "Could not retrieve project."
                    })
                }

            })
                .catch(err=>{
                res.status(500).send({
                    message: "Server error: Could not retrieve the project, make sure your ID is valid and correct.",
                    err:err
                })
            })
    }) ;


    /**
     * @api {post} /project/newProject
     * @apiName Create a new project.
     * @apiDescription This endpoint creates a new project.
     * @apiGroup Project
     * @apiParam {String} [projectName] Name of the project
     * @apiParam {String} [description] Description of the project
     * @apiParam {Date} [startDate] Starting date of the project
     * @apiParam {Date} [dueDate] Ending date of the project
     * @apiParam {String} [email] Owner of the project's email
     * @apiSuccess (200) {object} message: "The Project has been created."
     */

    router.post('/newProject',
        body('projectName').exists().notEmpty().isString(),
        body('description').exists().notEmpty().isString(),
        body('startDate').exists().notEmpty().isDate(),
        body('dueDate').exists().notEmpty().isDate(),
        body('email').exists().notEmpty(),
        authentication.authenticateToken,
        (req, res,next) => {
            const invalidFields = validationResult(req);
            if(!invalidFields.isEmpty()){
                res.send({
                    message: "Bad request , invalid id",
                    data: invalidFields
                })
            }

            else {

                let ownerMemberObject = {
                    email:req.body.email,
                    permissions: ['owner']
                }

                let data ={
                    _id:  new mongoose.mongo.ObjectID(),
                    projectOwner: req.body.email,
                    projectName: req.body.projectName,
                    projectDescription: req.body.description,
                    startDate :req.body.startDate,
                    dueDate : req.body.dueDate,
                    status: "not started",
                    groupMembers :[ownerMemberObject],
                    graph: {},
                    lastAccessed: new Date().toString().split("GMT")[0],

                };

                console.log("attempting to add new project...")
                ProjectManagerService.insertProject(db,data)
                    .then(ans=>{

                        mailer.newProject(data.projectName,data.projectOwner,data.dueDate,data.projectDescription)
                        console.log("successfully added new project.");
                        console.log("attempting to update token...");
                        authentication.generateToken(req,res,db)
                            .then((token)=>{
                                console.log("successfully updated token...check your headers");
                                res.setHeader("authorization","Bearer "+token);
                                res.send({
                                    message:"The Project has been created.",
                                    newToken: token,
                                    data: ans,
                                })
                            })
                            .catch(err=>{

                                console.log("failed to failed to update token");
                                res.send({
                                    message: "failed to update token after project creation"
                                })
                            })

                })
                    .catch(err=>{
                    res.send({
                        message: "The project was not created."
                    })
                })

            }
    });


    /**
     * @api {post} /project/addToProjectGroupMembers
     * @apiName Add new group member to project
     * @apiDescription Adds a user to the project's list of members.
     * @apiGroup Project
     * @apiParam {String} [email] Email of the group member being added
     * @apiParam {String} [projectID] ID of the project the member is added to
     * @apiSuccess (200) message: "successfully added members."
     */

    router.post('/addToProjectGroupMembers',
        authentication.authenticateToken,
        authorisation.AuthoriseAddMembers,
        body('email').exists().notEmpty().isEmail(),
        body('projectID').exists().notEmpty().isMongoId(),
        (req, res)=>{

            const invalidFields = validationResult(req);
            if(!invalidFields.isEmpty()){
                res.status(420).send({
                    message: "Bad request , invalid id",
                    data: invalidFields
                })
            }
            let ID = req.body.projectID;
            let memberObjects = req.body.groupMembers;

            let MemberEmails = [];
            for (const memberKey in memberObjects) {

                MemberEmails.push(memberObjects[memberKey].email);
            }

            console.log("attempting to add new members...")
            ProjectManagerService.addNewProjectMember(db,ID,memberObjects)
                .then((project)=>{
                const projectName = project.projectName;
                const projectOwner =project.owner;
                const projectDueDate =project.dueDate;
                const recipients =MemberEmails ;
                mailer.sendInvites(projectName,projectOwner,projectDueDate,recipients);

                    //console.log("successfully added new members...")
                res.send({
                    message:"successfully added members"
                })
            })
                .catch(err=>{
                res.send({
                    message: "failed to add members",
                    data: err
                })
            })



    });

    /**
     * @api {delete} /project/deleteProject
     * @apiName Delete a project.
     * @apiDescription Gets rid of a project using the user's email and the projectID.
     * @apiGroup Project
     * @apiParam {String} [email] Email of the owner of the project
     * @apiParam {String} [projectID] ID of the project being deleted.
     * @apiSuccess (200) message: "Project was removed successfully"
     */
    //Is the email parameter necessary or used?
    router.delete('/deleteProject',
        body('email').exists().notEmpty().isEmail(),
        body('projectID').exists().notEmpty().isMongoId(),
        authentication.authenticateToken,
        authorisation.AuthoriseDeleteProject,
        (req,res)=>{
            const invalidFields = validationResult(req);
            if(!invalidFields.isEmpty()){
                res.send({
                    message: "Bad request , invalid id",
                    data: invalidFields
                })
            }

            let ID = req.body.projectID;
            ProjectManagerService.removeProjectByID(db,ID)
                .then(ans =>{
            if(ans === null){
                res.send({
                    message: "Couldn't remove project."
                });
            }else{
                res.send({
                    message: "Project was removed successfully."
                });
            }

        })
                .catch(err=>{
                    console.log('this why',err)
            res.send({
                message:"Could not remove project."
            })
        })
});

    /**
     * @api {patch} /project/updateProjectGraph
     * @apiName Update the graph of the current project.
     * @apiDescription Endpoint replaces the graph of the project with a newer version.
     * @apiGroup Project
     * @apiParam {String} [projectID] ID of the project's graph that is being updated
     * @apiParam {String} [email] Email of the user updating the graph
     * @apiParam {object} [graph] Graph that is being updated
     * @apiSuccess (200) message: "The graph was updated."
     */
    //Is the email being used? Is it necessary?
    router.patch('/updateProjectGraph',
        authentication.authenticateToken,
        authorisation.AuthoriseUpdateGraph,
        body('projectID').exists().notEmpty().isMongoId(),
        body('email').exists().notEmpty().isEmail(),
        body('graph').exists().notEmpty().isObject(),
        (req, res, )=>{

            const invalidFields = validationResult(req);
            if(!invalidFields.isEmpty()){
                res.status(420).send({
                    message: "Bad request , invalid id",
                    data: invalidFields
                })
            }
            let ID = req.body.projectID;
            let grph = req.body.graph;
            // let grph2 = JSON.parse(grph);

            ProjectManagerService.updateProjectGraph(db,ID,grph )
            .then(ans=>{
            if(ans.modifiedCount === 0){
                res.send({
                    message: "Could not update the graph."
                })
            }else{
                res.send({
                    message: "The graph was updated."
                })
            }
        })
            .catch((err)=>{
       res.status(500).send({
           message: "Could not update the project graph."
       })
     })
});

    /**
     * @api {patch} /project/removeProjectMember
     * @apiName Removes a member from a project
     * @apiDescription This endpoint removes a member from a project using the provided email and project ID
     * @apiGroup Project
     * @apiParam {String} [projectID] The ID of the project from which the member is being removed.
     * @apiParam {String} [email] The ID of the member that is being removed from the project.
     * @apiSuccess (200) message: "Member removed successfully."
     */

    router.patch('/removeProjectMember',
        authentication.authenticateToken,
        authorisation.AuthoriseRemoveMembers,
        body('projectID').exists().notEmpty().isMongoId(),
        body('email').exists().notEmpty().isEmail(),
        (req, res)=>{
            const invalidFields = validationResult(req);
            if(!invalidFields.isEmpty()){
                res.status(420).send({
                    message: "Bad request , invalid id",
                    data: invalidFields
                })
            }
            let ID = req.body.projectID;
            let mail = req.body.email;
            ProjectManagerService.removeProjectMember(db,ID, mail)
                .then(ans=>{
                if(ans.modifiedCount >0){
                    res.send({
                        message: "Member removed successfully."
                    })
                }else{
                    res.send({
                        message: "Could not remove member."
                    })
                }
            })
                .catch((err)=>{
                res.status(500).send({
                    message: "Server error: could not remove member.",
                    err: err
                })
            })
    });

    /**
     * @api {put} /project/updateEverythingProject
     * @apiName Updates all of the project details
     * @apiDescription This endpoint takes in all the details of a project and updates the existing one with the new information
     *                  using the project ID
     * @apiGroup Project
     * @apiParam {String} [projectID] ID of the project being updated.
     * @apiParam {String} [email] Email
     * @apiParam {String} [projectName] New name of the project
     * @apiParam {date} [dueDate] New due date of the project
     * @apiParam {date} [startDate] New start date of the project
     * @apiParam {object} [graph] New project graph
     * @apiSuccess (200) message: "The project was updated."
     */

    router.put('/updateEverythingProject',
        authentication.authenticateToken,
        authorisation.AuthoriseUpdateAllProject,
        body('projectID').exists().notEmpty().isMongoId(),
        body('email').exists().notEmpty().isEmail(),
        body('projectName').exists().notEmpty(),
        body('dueDate').exists().notEmpty().isDate(),
        body('startDate').exists().notEmpty().isDate(),
        body('graph').exists().notEmpty().isObject(),

        (req,res)=>{
            const invalidFields = validationResult(req);
            if(!invalidFields.isEmpty()){
                res.send({
                    message: "Bad request , invalid id",
                    data: invalidFields
                })
            }
            const ID = req.body.projectID;
            let pname = req.body.projectName;
            let ddate = req.body.dueDate;
            let sdate = req.body.startDate;
            let owner = req.body.owner;
            let graph = req.body.graph;
            let groupMembers = req.body.groupMembers;




            ProjectManagerService.updateEverythingProject(db,ID,pname,ddate,sdate,owner, graph, groupMembers)
            .then(ans=>{
            if(ans.modifiedCount > 0){
                res.send({
                    message: "The project was updated."
                })
            }else{
                res.send({
                    message: "The project was not updated."
                })
            }

        })
            .catch(err=>{
            res.send({
                message: "Server error: Could not update the project.",
                err: err
            })
        })
});




 return router;
}



module.exports = makeProjectRoute;
