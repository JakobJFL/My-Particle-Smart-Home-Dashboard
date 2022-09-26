document.getElementById("loginForm").addEventListener("submit", login);

checkLocalStorage();

function checkLocalStorage() { 
    let deviceID = localStorage.getItem('deviceID');
    let accessToken = localStorage.getItem('accessToken');
    if (deviceID && accessToken) {
        checkLogin(deviceID, accessToken).then(() => {
            window.location.replace("dashboard.html");
        }).catch(err => {
            document.getElementById("loginErrorText").innerHTML = err;
        });;
    }
}

function login(e){
    e.preventDefault();
    document.getElementById("loginErrorText").innerHTML = "";
    let deviceID = document.getElementById("inputID").value;
    let accessToken = document.getElementById("inputAccessToken").value;

    checkLogin(deviceID, accessToken).then(() => {
        if (document.getElementById("rememberCheck").checked)
            saveData(accessToken, deviceID);
        window.location.replace("dashboard.html");
    }).catch(err => {
        document.getElementById("loginErrorText").innerHTML = err;
    });
}

function checkLogin(deviceID, accessToken) {
    return new Promise((resolve, reject) => {
        fetch('https://api.particle.io/v1/devices/'+deviceID+'?access_token='+accessToken)
        .then((response) => {
            if (response.status === 200) 
                return response.json();
            else {
                return response.json()
                .then(data => {
                    throw new Error(data.error+ " - " +data.error_description)
                });
            }      
        }).then((data) => {
            resolve(data);
        }).catch(err => {
            reject(err);
        });
    });
}

function saveData(accessToken, deviceID) {
    localStorage.setItem('deviceID', deviceID); 
    localStorage.setItem('accessToken', accessToken); 
}