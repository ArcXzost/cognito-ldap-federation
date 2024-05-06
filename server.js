// server-side Node.js code (e.g., index.js)
const express = require('express');
const { exec } = require('child_process'); // Only use on the server
const cors = require('cors'); // Add cors for CORS handling
const morgan = require('morgan');


const app = express();

app.use(morgan('dev'));
app.use(cors());
app.options('*',cors());
var allowCrossDomain = function(req,res,next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();  
}
app.use(allowCrossDomain);

const port = 3000; // Adjust as needed

// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//     next();
// });

app.get('/check-admin', (req, res) => {
  const uid = req.query.uid; // Replace with appropriate access method (e.g., session)
//   if (!isAuthorized(uid)) {
//     return res.status(401).send('Unauthorized');
//   }

  const privateKeyPath = '"Shield.pem"';
  const instancePublicIp = '44.202.139.79'; // Replace this with your EC2 instance's public IP address
  const ldapsearchCommand = `ldapsearch -x -LLL uid=${uid} -b "ou=Admin,dc=iiitg,dc=ac,dc=in" | grep 'dn'`;

  const sshCommand = `ssh -i ${privateKeyPath} ubuntu@${instancePublicIp} "${ldapsearchCommand}"`;

  console.log(sshCommand);

  exec(sshCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(error);
      return res.status(500).send('Internal Server Error');
    } else if (stderr) {
      console.error(stderr);
      return res.status(500).send('Internal Server Error');
    }

    const isAdmin = stdout.includes('ou=Admin');
    console.log(`User ${uid} is an admin: ${isAdmin}`);
    // res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.json({ isAdmin });
    // Uncomment the following line to log the output of the ssh command
    // console.log(stdout);
  });
});

app.listen(port, () => console.log(`Server listening on port ${port}`));
