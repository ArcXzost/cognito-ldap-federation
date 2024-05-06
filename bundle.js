(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// const { exec } = require('child_process').exec;

async function handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
  
    if (!code) {
        console.error('Authorization code not found');
        return;
    }
  
    const clientId = '424864705320-thcgnlh7cfchmvumtoi833qiqha61r19.apps.googleusercontent.com';
    const clientSecret = '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';
    const redirectUri = 'http://127.0.0.1:5500/logged.html';
    const tokenUrl = 'https://accounts.google.com/o/oauth2/token';
    const userInfoUrl = 'https://www.googleapis.com/oauth2/v1/userinfo';
    try {
        // Exchange authorization code for access token
        const tokenResponse = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                code: code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        });
  
        const tokenData = await tokenResponse.json();
        console.log('Token Data:', tokenData);
        const googleTokenDecoded = parseJwt(tokenData.id_token);
  
        // Output some details onto the browser console to show the token working
        console.log("ID: " + googleTokenDecoded.sub);
        console.log('Full Name: ' + googleTokenDecoded.name);
        console.log("Email: " + googleTokenDecoded.email);
        // Use the access token to fetch user details
        const userInfoResponse = await fetch(userInfoUrl, {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`
            }
        });
  
        const userInfo = await userInfoResponse.json();
        console.log('User Info:', userInfo);

        googleTokenDecoded.hd = userInfo.hd;
        googleTokenDecoded.name = userInfo.name;
        const uid = googleTokenDecoded.email;
        console.log('Organisation:', googleTokenDecoded.hd);
        // Process user information or store access token
        // console.log('User Info:', userInfo);
        if (googleTokenDecoded['sub']) {
    
            // We can't access anything in AWS with a google token...
            // ... so we need to exchange it using Cognito for AWS credentials
            console.log("Exchanging Google Token for AWS credentials...");
            AWS.config.region = 'ap-south-1'; 
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: 'ap-south-1:e1e91688-de51-4273-9371-cb75ced4c254', // MAKE SURE YOU REPLACE THIS
            Logins: {
                'accounts.google.com': tokenData.id_token
            }
            });

            // Now lets obtain the credentials we just swapped
            AWS.config.credentials.get(function(err) {
            if (!err) {
                console.log('Exchanged to Cognito Identity Id: ' + AWS.config.credentials.identityId);
                // if we are here, things are working as they should...
                // ... now lets call a function to access images, generate signed URL's and display
                accessImages(uid);
            } else {
                // if we are here, bad things have happened, so we should error.
                document.getElementById('output').innerHTML = "<b>YOU ARE NOT AUTHORISED TO QUERY AWS!</b>";
                console.log('ERROR: ' + err);
            }
            });

    } 
    else {
        console.log('User not logged in!');
    }
    } catch (error) {
        console.error('Error:', error);
    }
  }
  
  handleCallback();

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace('-', '+').replace('_', '/');
    var plain_token = JSON.parse(window.atob(base64));
    return plain_token;
};

async function accessImages(uid) {
  // Using the temp AWS Credentials, lets connect to S3
  console.log("Creating Session to S3...");
  var s3 = new AWS.S3();
  var params = {
      Bucket: "arcx1" // MAKE SURE YOU REPLACE THIS
  };

  try {
      // If we are here, things are going well, lets list all of the objects in the bucket
      const data = await s3.listObjects(params).promise();

      // Example usage
      const isAdmin = await checkIfUserIsAdmin(uid);

      // Get the container for slideshow images
      var slideshowImagesContainer = document.getElementById('slideshow-images');

      // Clear the existing content in the slideshow container
      slideshowImagesContainer.innerHTML = '';

      // for all of the images in the bucket, we need to generate a signedURL for the object
      data.Contents.forEach(function (photo, index) {
          var photoKey = photo.Key;
          console.log("Generating signedURL for : " + photoKey);
          var url = s3.getSignedUrl('getObject', {
              Bucket: params.Bucket,
              Key: photoKey
          });

          // Create image element for the slideshow
          var imgElement = document.createElement('img');
          imgElement.src = url;
          imgElement.alt = "This image can only be viewed by IIITG users"; // Alternative text for image
          imgElement.setAttribute("style", "text-align: center; font-size: 18px; color: red;"); // Applying styles

          // Add the image to the slideshow container based on user's role
          if (isAdmin) {
              slideshowImagesContainer.appendChild(imgElement);
          } else if (!isAdmin && index < 3) {
              slideshowImagesContainer.appendChild(imgElement);
          } else if (!isAdmin && index < 2) {
              slideshowImagesContainer.appendChild(imgElement);
          }
      });

      // Start slideshow
      startSlideshow();
  } catch (error) {
      // document.getElementById('output').innerHTML = "<b>YOU ARE NOT AUTHORISED TO QUERY AWS!</b>";
      console.error('Error:', error);
  }
}


function startSlideshow() {
  var images = document.querySelectorAll('#slideshow-images img');
  var currentImageIndex = 0;

  function showImage(index) {
    images.forEach(function(img) {
      img.style.display = 'none';
    });
    images[index].style.display = 'block';
    currentImageIndex = index;
  }

  function showNextImage() {
    var nextIndex = (currentImageIndex + 1) % images.length;
    showImage(nextIndex);
  }

  function showPreviousImage() {
    var prevIndex = (currentImageIndex - 1 + images.length) % images.length;
    showImage(prevIndex);
  }

  // Event listeners for previous and next buttons
  document.getElementById('prev-btn').addEventListener('click', function() {
    showPreviousImage();
  });

  document.getElementById('next-btn').addEventListener('click', function() {
    showNextImage();
  });

  // Show the first image initially
  showImage(0);
}


// A utility function to create HTML.
function getHtml(template) {
  return template.join('\n');
}

// A utility function to decode the google token
function parseJwt(token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace('-', '+').replace('_', '/');
  var plain_token = JSON.parse(window.atob(base64));
  return plain_token;
};

const { exec } = require('child_process').exec;

function checkIfUserIsAdmin(uid) {
    return new Promise((resolve, reject) => {
        const privateKeyPath = 'home/arcxzost/Downloads/Shield.pem';
        const instancePublicIp = '54.197.11.182'; // Replace this with your EC2 instance's public IP address
        const username = 'ubuntu'; // Replace this with your EC2 instance's username
        const ldapsearchCommand = `ldapsearch -x -LLL uid=${uid} -b "ou=Admin,dc=iiitg,dc=ac,dc=in" | grep 'dn'`;

        // SSH command to connect to the EC2 instance and run the LDAP search command
        const sshCommand = `ssh -i ${privateKeyPath} ${username}@${instancePublicIp} "${ldapsearchCommand}"`;

        // Execute the SSH command
        exec(sshCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                reject(error);
            } else if (stderr) {
                console.error(`STDERR: ${stderr}`);
                reject(stderr);
            } else {
                // If the LDAP search command is successful, check if the UID belongs to a student
                const isAdmin = stdout.includes('ou=Admin');
                if (isAdmin) {
                    console.log(`User with UID ${uid} is a student.`);
                } else {
                    console.log(`User with UID ${uid} is not a student.`);
                }
                resolve(isAdmin);
            }
        });
    });
}

},{"child_process":2}],2:[function(require,module,exports){

},{}]},{},[1]);
