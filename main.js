"use strict";

let data = null;
let selectedState = null;
let dailyData = {};
let logarithmic = false;

let states = {
    "AL": ["Alabama", 4903185],
    "AK": ["Alaska", 731545],
    "AS": ["American Samoa", 55641],
    "AZ": ["Arizona", 7278717],
    "AR": ["Arkansas", 3017825],
    "CA": ["California", 39512223],
    "CO": ["Colorado", 5758736],
    "CT": ["Connecticut", 3565287],
    "DE": ["Delaware", 973764],
    "DC": ["District Of Columbia", 705749],
    "FM": ["Federated States Of Micronesia", 105544],
    "FL": ["Florida", 21477737],
    "GA": ["Georgia", 10617423],
    "GU": ["Guam", 165718],
    "HI": ["Hawaii", 1415872],
    "ID": ["Idaho", 1787065],
    "IL": ["Illinois", 12671821],
    "IN": ["Indiana", 6732219],
    "IA": ["Iowa", 3155070],
    "KS": ["Kansas", 2913314],
    "KY": ["Kentucky", 4467673],
    "LA": ["Louisiana", 4648794],
    "ME": ["Maine", 1344212],
    "MH": ["Marshall Islands", 53127],
    "MD": ["Maryland", 6045680],
    "MA": ["Massachusetts", 6949503],
    "MI": ["Michigan", 9986857],
    "MN": ["Minnesota", 5639632],
    "MS": ["Mississippi", 2976149],
    "MO": ["Missouri", 6137428],
    "MT": ["Montana", 1068778],
    "NE": ["Nebraska", 1934408],
    "NV": ["Nevada", 3080156],
    "NH": ["New Hampshire", 1359711],
    "NJ": ["New Jersey", 8882190],
    "NM": ["New Mexico", 2096829],
    "NY": ["New York", 19453561],
    "NC": ["North Carolina", 10488084],
    "ND": ["North Dakota", 762062],
    "MP": ["Northern Mariana Islands", 55194],
    "OH": ["Ohio", 11689100],
    "OK": ["Oklahoma", 3956971],
    "OR": ["Oregon", 4217737],
    "PW": ["Palau", 21729],
    "PA": ["Pennsylvania", 12801989],
    "PR": ["Puerto Rico", 3193694],
    "RI": ["Rhode Island", 1059361],
    "SC": ["South Carolina", 5148714],
    "SD": ["South Dakota", 884659],
    "TN": ["Tennessee", 6833174],
    "TX": ["Texas", 28995881],
    "US": ["Whole US", 328239523],
    "UT": ["Utah", 3205958],
    "VT": ["Vermont", 623989],
    "VI": ["Virgin Islands", 104914],
    "VA": ["Virginia", 8535519],
    "WA": ["Washington", 7614893],
    "WV": ["West Virginia", 1792147],
    "WI": ["Wisconsin", 5822434],
    "WY": ["Wyoming", 578759],
}

function changeState(){
    let stateSelect = document.querySelector("#state-select");
    selectedState = data.find(d => d.state === stateSelect.value);
    document.querySelectorAll(".state").forEach(e => e.innerHTML = formatNumber(states[stateSelect.value][0]));
    document.querySelector("#total").innerHTML = formatNumber(selectedState.positive + selectedState.negative);
    document.querySelectorAll("#positive").forEach(e => e.innerHTML = formatNumber(selectedState.positive));
    document.querySelector("#negative").innerHTML = formatNumber(selectedState.negative);
    document.querySelector("#per-capita").innerHTML = formatNumber(Math.floor((selectedState.positive + selectedState.negative) / states[stateSelect.value][1] * 1000000));
    let national = data.find(d => d.state === "US");
    let nationalRate = ((national.positive * 100) / (national.positive + national.negative));
    let stateRate = selectedState.positive !== undefined && selectedState.negative !== undefined
            ? ((selectedState.positive * 100) / (selectedState.positive + selectedState.negative))
            : -1;
    document.querySelector("#rate").innerHTML = stateRate >= 0 ? `${stateRate.toFixed(2)}%` + (nationalRate && nationalRate != stateRate ? `<br><span class="${stateRate > nationalRate ? 'bad' : 'good'}-diff">${stateRate > nationalRate ? "+" : ""}${(stateRate - nationalRate).toFixed(2)}%</span>` : "") : "";
    document.querySelector("#rate-diff").className = stateRate > nationalRate ? "bad-diff" : "good-diff";
    document.querySelector("#rate-diff").style.display = nationalRate && nationalRate != stateRate ? "block" : "none";
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
        element.innerHTML = states[data[i].state][0];
        stateSelect.append(element);
    }
    if (!selectedState){
        selectedState = {"state": "US"};
    } else {
        stateSelect.value = selectedState.state;
    }
    changeState();
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
            dailyData[state] = value.reverse().filter(d => d.state == state || d.state === undefined);
            drawDaily(state);
        });
    });
}

function drawDaily(state){
    let daily = dailyData[state];
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
            title: {
                display: true,
                text: 'Click legend to filter data for ' + states[state][0],
                padding: 0,
                fontSize: 13,
                fontColor: "#000",
            },

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
    document.querySelector("#log-button").innerHTML = logarithmic ? "Change to Linear Scale" : "Change to Logarithmic Scale";
    getDaily(selectedState.state);
}

function formatNumber(x){
    return x ? x.toLocaleString() : "";
}

getData();
