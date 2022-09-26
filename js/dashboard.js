// Set new default font family and font color to mimic Bootstrap's default styling
Chart.defaults.global.defaultFontFamily = 'Nunito', '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = '#858796';

let loadedData = {}

const DBLen = 48;
const accessToken = localStorage.getItem('accessToken');
const deviceID = localStorage.getItem('deviceID');

setStatus();
getSensorData();
setAreaChart();
document.getElementById("logOutBtn").addEventListener("click", logOut);

function logOut(){
    localStorage.removeItem("deviceID");
	localStorage.removeItem("accessToken");
	window.location.replace("login.html");
}

function setStatus() {
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
		let statusMsg = data.status;
		if (data.online) statusMsg += ", Online";
		else statusMsg += ", Not online";
		if (data.connected) statusMsg += ", Connected"
		else statusMsg += ", Not connected";
		makeMsg("Status: "+statusMsg, "success");
		makeStatusTable(data.name, data.last_handshake_at, data.last_heard, data.owner, data.last_ip_address);
	}).catch(err => {
		makeMsg(err, "danger");
	});
}

function makeMsg(msg, labelColor) {
	document.getElementById("statusCard").innerHTML = `<div class="alert alert-${labelColor}" role="alert">${msg}</div>`;
}

function makeStatusTable(name, handshake, heard, owner, ipAddress) {
	document.getElementById("statusTable").innerHTML = `<tbody>
	<tr>
	  <th scope="row">Name</th>
	  <td>${name}</td>
	</tr>
	<tr>
	  <th scope="row">Last handshake</th>
	  <td>${handshake}</td>
	</tr>
	<tr>
	  <th scope="row">Last heard</th>
	  <td>${heard}</td>
	</tr>
	<tr>
	  <th scope="row">Owner</th>
	  <td>${owner}</td>
	</tr>
	<tr>
	  <th scope="row">Ip address</th>
	  <td>${ipAddress}</td>
	</tr>
  </tbody>`
}

function setHeatIndex(temp, humi) {
	let hi = -8.78469475556+1.61139411*temp+2.33854883889*humi+(-0.14611605)*temp*humi+(-0.012308094)*temp*temp+(-0.0164248277778)*humi*humi+0.002211732*temp*temp*humi+0.00072546*temp*humi*humi+(-0.000003582)*temp*temp*humi*humi;
	document.getElementById("heatIndexVal").innerHTML = Math.round(hi);
	if (hi > 42) {
		setColor("#000000");
		document.getElementById("heatIndexVal").innerHTML += " Extreme danger";
	}
	else if (hi > 33) {
		setColor("#e74a3b");
	}
	else if (hi > 26) {
		setColor("#f6c23e");
	}
	else if (hi > 21) {
		setColor("#1cc88a");
	}
	else {
		setColor("#4e73df");
	}
	function setColor(color) {
		let hiColorClass  = document.querySelectorAll(".HI-color");
		for (const hiColor of hiColorClass) 
			hiColor.style.color = color;
	}
}

function updateSensorData() {
	document.getElementById("humidityVal").innerHTML = "0%";
	document.getElementById("humidityBar").style = "width: 0%";
	document.getElementById("soilMoistureVal").innerHTML = "0%";
	document.getElementById("soilMoistureBar").style = "width: 0%";
	document.getElementById("temperatureVal").innerHTML = `<img src="img/loading.gif" width="23px"/>`;
	document.getElementById("humidityVal").innerHTML = `<img src="img/loading.gif" width="23px"/>`;
	document.getElementById("soilMoistureVal").innerHTML = `<img src="img/loading.gif" width="23px"/>`;
	document.getElementById("heatIndexVal").innerHTML = `<img src="img/loading.gif" width="23px"/>`;


	fetch('https://api.particle.io/v1/devices/'+deviceID+'/setSenData?access_token='+accessToken, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		}
	}).then(()=>{
		getSensorData();
	})
	.catch((error) => {
		console.error('Error:', error);
	});
}

function getSensorData() {
	fetch('https://api.particle.io/v1/devices/'+deviceID+'/senData?access_token='+accessToken, {
	method: 'GET',
	headers: {
		'Content-Type': 'text/plain',
	}})
	.then(response => response.json())
	.then(data => {
		let dataSegment = data.result.split(";");
		setHeatIndex(dataSegment[0], dataSegment[1]);
		document.getElementById("temperatureVal").innerHTML = dataSegment[0]+"\xB0C";

		document.getElementById("humidityVal").innerHTML = dataSegment[1]+"%";
		document.getElementById("humidityBar").style = "width: " + dataSegment[1]+"%";

		document.getElementById("soilMoistureVal").innerHTML = dataSegment[2]+"%";
		let soilMoistureBar = document.getElementById("soilMoistureBar");
		soilMoistureBar.style = "width: " + dataSegment[2]+"%;";
		if (dataSegment[2] > 60) {
			soilMoistureBar.style.backgroundColor = "#4e73df";
		}
		else if (dataSegment[2] > 30) {
			soilMoistureBar.style.backgroundColor = "#1cc88a";
		}
		else if (dataSegment[2] > 20) {
			soilMoistureBar.style.backgroundColor = "#f6c23e";
		}
		else {
			soilMoistureBar.style.backgroundColor = "#e74a3b";
		}
	})
	.catch((error) => {
		console.error('Error:', error);
	});
}

function setAreaChart() {
	fetch('https://api.particle.io/v1/devices/'+deviceID+'/senDBstr?access_token='+accessToken, {
	method: 'GET',
	headers: {
		'Content-Type': 'text/plain',
	}})
	.then(response => response.json())
	.then(data => {
		let dataSegments = data.result.split("|");
		dataSegments.reverse();
		let tempData = [];
		let humidityData = [];
		let soilData = [];
		for (let i = 0; i < dataSegments.length; i++) {
			if (dataSegments[i]) {
				let data = dataSegments[i].split(";");
				tempData.push(data[0]);
				humidityData.push(data[1]);
				soilData.push(data[2]);
			}
			else {
				tempData.push(null);
				humidityData.push(null);
				soilData.push(null);
			}
		}
		loadedData = {
			tempData: tempData,
			humidityData: humidityData,
			soilData: soilData
		};
		refreshChart();
	})
	.catch((error) => {
		console.error('Error:', error);
	});
}

function refreshChart() {
	if (loadedData.tempData) {
		let tempData = loadedData.tempData;
		let humidityData = loadedData.humidityData;
		let soilData = loadedData.soilData;

		let d = new Date();
		let now = d.getHours();
		let labelsArray = [];
		labelsArray.push("Denne time");
		for (let i = 0; i < DBLen; i++) {
			d.setHours(now-i);
			let hours = ("0" + d.getHours()).slice(-2);
			labelsArray.push(hours+":00");
		}
		labelsArray.reverse();
		if (!document.getElementById("tempCheck").checked) {
			tempData = null;
		} 
		if (!document.getElementById("humidityCheck").checked) {
			humidityData = null;
		} 
		if (!document.getElementById("soilCheck").checked) {
			soilData = null;

		}
		printAreaChart(tempData, humidityData, soilData, labelsArray);
	}
}

let myLineChart;

function printAreaChart(tempData, humidityData, soilData, labelsArray) {
	if (myLineChart) 
		myLineChart.destroy();

	let ctx = document.getElementById("chartSoilMoisture");
	myLineChart = new Chart(ctx, {
	type: 'line',
	data: {
		labels: labelsArray,
		datasets: [{
			label: "Temperatur",
			lineTension: 0.3,
			backgroundColor: "rgba(252, 198, 3, 0.10)",
			borderColor: "#fcc603",
			textColor: "#fcc603",
			pointRadius: 3,
			pointBackgroundColor: "#fcc603",
			pointBorderColor: "#fcc603",
			pointHoverRadius: 3,
			pointHoverBackgroundColor: "#fcc603",
			pointHoverBorderColor: "#fcc603",
			pointHitRadius: 10,
			pointBorderWidth: 2,
			data: tempData,
		},
		{
			label: "Luftfugtighed",
			lineTension: 0.3,
			backgroundColor: "rgba(55, 185, 205, 0.10)",
			borderColor: "#36b9cc",
			textColor: "#36b9cc",
			pointRadius: 3,
			pointBackgroundColor: "#36b9cc",
			pointBorderColor: "#36b9cc",
			pointHoverRadius: 3,
			pointHoverBackgroundColor: "#36b9cc",
			pointHoverBorderColor: "#36b9cc",
			pointHitRadius: 10,
			pointBorderWidth: 2,
			data: humidityData,
		},
		{
			label: "Plante jordfugtighed",
			lineTension: 0.3,
			backgroundColor: "rgba(56, 171, 95, 0.10)",
			borderColor: "#38ab5f",
			textColor: "#38ab5f",
			pointRadius: 3,
			pointBackgroundColor: "#38ab5f",
			pointBorderColor: "#38ab5f",
			pointHoverRadius: 3,
			pointHoverBackgroundColor: "#38ab5f",
			pointHoverBorderColor: "#38ab5f",
			pointHitRadius: 10,
			pointBorderWidth: 2,
			data: soilData,
		}],
	},
	options: {
		maintainAspectRatio: false,
		layout: {
		padding: {
			left: 10,
			right: 25,
			top: 25,
			bottom: 0
		}
		},
		scales: {
			xAxes: [{
				time: {
				unit: 'date'
				},
				gridLines: {
				display: false,
				drawBorder: false
				},
				ticks: {
				maxTicksLimit: 12
				}
			}],
			yAxes: [{
				ticks: {
				maxTicksLimit: 5,
				padding: 10,
				// Include a dollar sign in the ticks
				callback: function(value, index, values) {
					return value;
				}
				},
				gridLines: {
				color: "rgb(234, 236, 244)",
				zeroLineColor: "rgb(234, 236, 244)",
				drawBorder: false,
				borderDash: [2],
				zeroLineBorderDash: [2]
				}
			}],
		},
		legend: {
		display: false
		},
		tooltips: {
			backgroundColor: "rgb(255,255,255)",
			bodyFontColor: "#36b9cc",
			titleMarginBottom: 10,
			titleFontColor: '#6e707e',
			titleFontSize: 14,
			borderColor: '#dddfeb',
			borderWidth: 1,
			xPadding: 15,
			yPadding: 15,
			displayColors: false,
			intersect: true,
			mode: 'index',
			caretPadding: 10,
			callbacks: {
				label: function(tooltipItem, chart) {
					let datasetLabel = chart.datasets[tooltipItem.datasetIndex].label || '';
					return datasetLabel + ': ' + tooltipItem.yLabel + ((tooltipItem.datasetIndex == 0) ? " \xB0C" : " %")
				},
				labelTextColor: function(tooltipItem, chart) {
					let color = chart.data.datasets[tooltipItem.datasetIndex].textColor;
					return color;
				}
			}
		}
	}
	});
}	

