const express = require("express")
//const sql = require("mssql")
const sql = require('mssql/msnodesqlv8')

const app = express()
const port = 3001
const cors = require('cors');
app.use(cors());
app.use(express.json())//middleware to parse incoming requests as json (for adding timesheet entry)

app.get("/", async (req, res)=>{
    res.send("hello")
})

//***FOR  SQL SERVER AUTHENTICATION */
const config = {
  user: 'sql_auth',
  password: 'FunkY1101',
  server: '192.168.18.14', 
  database: 'TimeCard',
  }

//Client route  
app.get('/api', async (req, res) => {
  try {
    
    await sql.connect(config)
    const result = await sql.query`select client_id, active, ClientName from clients WHERE active=1`
    
    console.dir(result)
    
    res.send(result.recordset)
  } catch (err) {
    
    console.log(err);
    res.send(err);
  }
});

app.get(`/api/projects/:clientId`, async (req, res)=>{
  try{
    await sql.connect(config)
    const clientId = req.params.clientId
    const clients= await sql.query`select ProjectName, project_id from projects WHERE client_id=${clientId} AND active=1`
    console.dir(clients)
    res.send(clients.recordset)
  }
  catch(err){
    console.log(err);
    res.send(err);
  }
})

//Recieving Timesheet Data for Infragistics Grid API Call
app.get(`/api/timesheet`, async(req,res)=>{
  try{
    await sql.connect(config)
    const timesheet =  await sql.query(`select t. timesheet_id, Date, c.ClientName, p.ProjectName, ref_num, Hours, t.Billable
                                        From TimeCard.dbo.timesheet t
                                        Join TimeCard.dbo.projects p on t.project_id = p.project_id
                                        Join TimeCard.dbo.clients c on p.client_id = c.client_id
                                        WHERE emp_id=187
                                        ORDER BY Date desc
                                      `)
    console.dir(timesheet)
    res.send(timesheet.recordset)
  }
  catch(err){
  console.log(err)
  res.send(err)
  }
})

//API call for reference number input
app.get(`/api/ClientProject`, async(req,res)=>{
  try{
    await sql.connect(config)
    const refNumber = req.query.refNumber
    const result = await sql.query `SELECT Distinct ProjectName, t.project_id, ClientName, c.client_id
                                         FROM TimeCard.dbo.timesheet t
                                         JOIN TimeCard.dbo.projects p on t.project_id = p.project_id
                                         JOIN TimeCard.dbo.clients c on p.client_id = c.client_id
                                         WHERE ref_num = ${refNumber}
    ` //NOT safe to use backticks- should not use
    console.dir(result)
    res.send(result.recordset)
  }
  catch(err){
    console.log("Error in /api/ClientProject:", err);
  res.status(500).send({ error: "Internal Server Error" });
  }
})


app.post('/api/sendtimesheet', async (req, res) =>{
  console.log("Incoming data:", req.body);
  try{
    await sql.connect(config)
    await sql.query`
                  INSERT INTO TimeCardTest.dbo.timesheet (emp_id, project_id, Date, Hours, Billable, Description)
                  VALUES(171, ${req.body.project_id.projectId}, ${req.body.Date}, ${req.body.Hours}, ${req.body.Billable}, ${req.body.Description})

    `;
    res.send({status:"Success"})
  }
  catch(err){console.log(err)}
})


//Row select API Call-poplating user input fields for updating/deleting when a row is clicked
app.get(`/api/timesheet/:timesheetId`, async(req, res)=>{
  try{
    await sql.connect(config)
    const timesheetId = req.params.timesheetId;
    const result = await sql.query`
          SELECT t.Date, c.ClientName, c.client_id, t.project_id, p.ProjectName, t.Hours, t.Billable, t.Description
          FROM TimeCard.dbo.timesheet t
          JOIN TimeCard.dbo.projects p on t.project_id = p.project_id
          JOIN TimeCard.dbo.clients c on p.client_id = c.client_id
          WHERE t.timesheet_id = ${timesheetId}
    `
    res.send(result.recordset);
  }
  catch(err){
    console.error("Error retrieving data for row select", err)
  }
})


app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`)
})




//***FOR WINDOWS AUTHENTICATION */
// // const config = {
// //     driver: 'msnodesqlv8',
// //     connectionString: 'Server=192.169.18.14;Database=TimeCard;Trusted_Connection=Yes;'
// //   };

//   const config = {
//     server: '192.169.18.14',
//     database: 'TimeCard',
//     options: {
//         trustedConnection: true,
//         useUTC: true,
//         enableArithAbort: true,
//         driver: "msnodesqlv8",
//     }
// };
  
//   sql.connect(config).then(() => {
//       console.log('Connected to SQL Server successfully');
//   }).catch((error) => {
//       console.error(`SQL error: ${error}`);
//   });