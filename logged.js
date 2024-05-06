// const { exec } = require('child_process').exec;
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

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
        const org = googleTokenDecoded.hd;
        googleTokenDecoded.name = userInfo.name;
        const uid = googleTokenDecoded.email.substring(0, googleTokenDecoded.email.indexOf('@'));
        console.log('Organisation:', googleTokenDecoded.hd);
        // Process user information or store access token
        // console.log('User Info:', userInfo);
        await delay(3000);
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
                accessImages(uid,org);
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

async function accessImages(uid,org) {
  // Using the temp AWS Credentials, lets connect to S3
  console.log("Creating Session to S3...");
  var s3 = new AWS.S3();
  var params = {
      Bucket: "arcx1" // MAKE SURE YOU REPLACE THIS
  };

  try {
      // If we are here, things are going well, lets list all of the objects in the bucket
      const data = await s3.listObjects(params).promise();
      let isAdmin = false;
      let isIIITGUser = false;
      // Example usage
      if( org === 'iiitg.ac.in') {
        isAdmin = await checkIfUserIsAdmin(uid);
        isIIITGUser = true;
      }

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
            console.log("isAdmin: " + isAdmin);
            slideshowImagesContainer.appendChild(imgElement);
          } else if (!isAdmin && isIIITGUser && index < 3) {
              console.log("isAdmin: " + isAdmin);
              slideshowImagesContainer.appendChild(imgElement);
          } else if (!isAdmin && !isIIITGUser && index < 2) {
              console.log("isAdmin: " + isAdmin);
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

async function checkIfUserIsAdmin(uid) {
    try {
      const url = 'http://localhost:3000/check-admin?uid=' + uid;
      console.log(url);
      const response = await fetch(url);
      const data = await response.json();
      return data.isAdmin;
    } catch (error) {
      console.error(error);
      // Handle errors appropriately (e.g., display a message to the user)
    }
  }
  
