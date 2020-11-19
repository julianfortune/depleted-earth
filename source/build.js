//
// build.js
// Created November 18, 2020
//

const { time } = require('console');
var fs = require('fs');
var Handlebars = require("handlebars");

function createYear(year) {
    return {"type": "year", "year": String(year)}
}

function createSeparator() {
    return {type: "separator",
            isSeparator: true}
}

function createSpacer() {
    return {type: "spacer",
            isSpacer: true}
}

function createYearArray(start, stop, step) {
    roundedStart = Math.floor(start/step) * step
    console.log(roundedStart)
    years = []
    for (year = roundedStart + step; year <= stop; year += step) {
        years.push(year)
    }
    return years
}

events = []

for (year of createYearArray(2021, 2200, 5)) {
    events.push(createYear(year))
}

let dataFileName = "source/data.json"
let dataFile = fs.readFileSync(dataFileName)
let json = JSON.parse(dataFile)

events = events.concat(json["contents"])

events = events.sort((a, b) => {
    return Number(a["year"]) - Number(b["year"])
})

events = events.map((item) => {
    item["isResource"] = item["type"] && item["type"].toLowerCase() === "resource"
    item["isParagraph"] = item["type"] && item.type.toLowerCase() === "paragraph"
    item["isYear"] = item["type"] && item.type.toLowerCase() === "year"
    item["isSeparator"] = item["type"] && item.type.toLowerCase() === "separator"
    // Add other types here ...

    return item
})

timeline = []

events.forEach((item, index, array) => {
    if (index > 0) {
        let priorItem = array[index - 1]
        if (item.isParagraph && !priorItem.isYear && !priorItem.isParagraph) {
            timeline.push(createSpacer())
        }
        if (item.isYear && !priorItem.isYear) {
            timeline.push(createSeparator())
        }
    }

    timeline.push(item)

    if (item.isYear) {
        timeline.push(createSeparator())
    }
    if (item.isParagraph && index < events.length && array[index + 1].isResource) {
        timeline.push(createSpacer())
    }
})

json["timeline"] = timeline

console.log(`Building from '${dataFileName}' ...`)

var templateFile = fs.readFileSync('source/template.hbs', "utf-8")
var template = Handlebars.compile(templateFile)

var html = template(json)

fs.writeFile("index.html", html, err => {
    if (err) {
        console.log(err)
    } else {
        console.log("File written successfully")
    }
})
