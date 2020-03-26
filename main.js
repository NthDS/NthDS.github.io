"use strict";

let data = null;
let selectedState = null;
let dailyData = {};
let logarithmic = false;

let states = {
    "AL": "Alabama",
    "AK": "Alaska",
    "AS": "American Samoa",
    "AZ": "Arizona",
    "AR": "Arkansas",
    "CA": "California",
    "CO": "Colorado",
    "CT": "Connecticut",
    "DE": "Delaware",
    "DC": "District Of Columbia",
    "FM": "Federated States Of Micronesia",
    "FL": "Florida",
    "GA": "Georgia",
    "GU": "Guam",
    "HI": "Hawaii",
    "ID": "Idaho",
    "IL": "Illinois",
    "IN": "Indiana",
    "IA": "Iowa",
    "KS": "Kansas",
    "KY": "Kentucky",
    "LA": "Louisiana",
    "ME": "Maine",
    "MH": "Marshall Islands",
    "MD": "Maryland",
    "MA": "Massachusetts",
    "MI": "Michigan",
    "MN": "Minnesota",
    "MS": "Mississippi",
    "MO": "Missouri",
    "MT": "Montana",
    "NE": "Nebraska",
    "NV": "Nevada",
    "NH": "New Hampshire",
    "NJ": "New Jersey",
    "NM": "New Mexico",
    "NY": "New York",
    "NC": "North Carolina",
    "ND": "North Dakota",
    "MP": "Northern Mariana Islands",
    "OH": "Ohio",
    "OK": "Oklahoma",
    "OR": "Oregon",
    "PW": "Palau",
    "PA": "Pennsylvania",
    "PR": "Puerto Rico",
    "RI": "Rhode Island",
    "SC": "South Carolina",
    "SD": "South Dakota",
    "TN": "Tennessee",
    "TX": "Texas",
    "US": "Whole US",
    "UT": "Utah",
    "VT": "Vermont",
    "VI": "Virgin Islands",
    "VA": "Virginia",
    "WA": "Washington",
    "WV": "West Virginia",
    "WI": "Wisconsin",
    "WY": "Wyoming"
}

function changeState(){
    let stateSelect = document.querySelector("#state-select");
    selectedState = data.find(d => d.state === stateSelect.value);
    document.querySelectorAll(".state").forEach(e => e.innerHTML = formatNumber(states[stateSelect.value]));
    document.querySelector("#total").innerHTML = formatNumber(selectedState.positive + selectedState.negative);
    document.querySelectorAll("#positive").forEach(e => e.innerHTML = formatNumber(selectedState.positive));
    document.querySelector("#negative").innerHTML = formatNumber(selectedState.negative);
    document.querySelector("#rate").innerHTML = selectedState.positive !== undefined && selectedState.negative !== undefined
            ? ((selectedState.positive * 100) / (selectedState.positive + selectedState.negative)).toFixed(2) + "%"
            : "";
    document.querySelector("#hospitalized").innerHTML = formatNumber(selectedState.hospitalized);
    document.querySelector("#deaths").innerHTML = formatNumber(selectedState.death);
    getDaily(stateSelect.value);
}

function getData(){
    fetch("https://covidtracking.com/api/states").then(info => {
        info.json().then(value => {
            data = value;
            getWholeUSValue();
            populateDropdown();
        });
    });
}

function getWholeUSValue(){
    let props = ["death", "negative", "positive", "total", "hospitalized"];
    data.unshift({"state": "US"});
    for (let i = 0; i < props.length; i++){
        let sum = 0;
        for (let j = 0; j < data.length; j++){
            if (data[j][props[i]]){
                sum += data[j][props[i]];
            }
        }
        data[0][props[i]] = sum;
    }
}

function populateDropdown(){
    let stateSelect = document.querySelector("#state-select");
    while (stateSelect.firstChild){
        stateSelect.removeChild(stateSelect.lastChild);
    }
    for (let i = 0; i < data.length; i++){
        let element = document.createElement("option");
        element.value = data[i].state;
        element.innerHTML = states[data[i].state];
        stateSelect.append(element);
    }
    if (!selectedState){
        selectedState = "US";
        changeState();
    }
}

function getDaily(state){
    if (dailyData[state]){
        return drawDaily(state);
    }
    let url = `https://covidtracking.com/api/states/daily?state=${state}`;
    if (state == "US"){
        url = "https://covidtracking.com/api/us/daily";
    }
    fetch(url).then(info => {
        info.json().then(value => {
            dailyData[state] = value.reverse();
            drawDaily(state);
        });
    });
}

function drawDaily(state){
    let daily = dailyData[state];
    console.log(daily);
    let graphWrapper = document.querySelector("#graph-wrapper");
    while (graphWrapper.firstChild){
        graphWrapper.removeChild(graphWrapper.lastChild);
    }
    let graph = document.createElement("canvas");
    graphWrapper.append(graph);
    let ctx = graph.getContext("2d");
    let chart = new Chart(ctx, {
        // The type of chart we want to create
        type: 'line',

        // The data for our dataset
        data: {
            labels: daily.map(d => d.date.toString().replace(/(....)(..)(..)/, "$2/$3/$1")),
            datasets: [{
                label: 'Tested',
                borderColor: 'rgb(0, 0, 0)',
                data: daily.map(d => d.positive + d.negative)
            },{
                label: 'Cases',
                borderColor: 'rgb(0, 0, 255)',
                data: daily.map(d => d.positive)
            },{
                label: 'Hospitalized',
                borderColor: 'rgb(0, 255, 0)',
                data: daily.map(d => d.hospitalized)
            },{
                label: 'Deaths',
                borderColor: 'rgb(255, 0, 0)',
                data: daily.map(d => d.death)
            },]
        },

        options: {
            scales: {
                yAxes: [logarithmic ? ({
                    type: 'logarithmic',
                    position: 'left',
                    ticks: {
                         callback: function (value, index, values) {
                             if (value.toString()[0] != "1") return "";
                             return value.toString();
                         }
                    },
                }) : {}],
            },
        },
    });
}

function switchScale(){
    logarithmic = !logarithmic;
    console.log(logarithmic)
    document.querySelector("#log-button").innerHTML = logarithmic ? "Linear Scale" : "Logarithmic Scale";
    getDaily(selectedState.state);
}

function formatNumber(x){
    return x ? x.toLocaleString() : "";
}

getData();
