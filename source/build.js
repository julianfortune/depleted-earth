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

function createBulb() {
    return {type: "bulb",
            isBulb: true}
}

function createYearArray(start, stop, step) {
    roundedStart = Math.floor(start/step) * step

    years = []
    for (year = roundedStart + step; year <= stop; year += step) {
        years.push(year)
    }
    return years
}

// Add boolean properties to the events based on the `type`
// property to make templating easier
function classify(dataItems) {
    return dataItems.map((item) => {
        item["isResource"] = item["type"] && item["type"].toLowerCase() === "resource"
        item["isParagraph"] = item["type"] && item.type.toLowerCase() === "paragraph"
        item["isHeader"] = item["type"] && item.type.toLowerCase() === "header"
        item["isYear"] = item["type"] && item.type.toLowerCase() === "year"

        item["isText"] = item["isParagraph"] || item["isHeader"]

        return item
    })
}

let dataFileName = "source/data.json"

console.log(`Building from '${dataFileName}' ...`)

events = []

// Initialize a list of year marker events in the right range
for (year of createYearArray(2021, 2100, 5)) {
    events.push(createYear(year))
}

// Load events from the data file
let dataFile = fs.readFileSync(dataFileName)
let json = JSON.parse(dataFile)

// Sort into events and notes based on if a `year` is set
userEvents = []
userNotes  = []

for (item of json["events"]) {
    if ("year" in item) {
        userEvents.push(item)
    } else {
        userNotes.push(item)
    }
}

// Put the user-created events at the end of the list so they
// are sorted after the year markers
events = events.concat(userEvents)

// Sort the events by the year
events = events.sort((a, b) => {
    return Number(a["year"]) - Number(b["year"])
})

events = classify(events)
userNotes = classify(userNotes)

timeline = []

// Insert connecting lines and spacers as needed
events.forEach((item, index, array) => {
    if (index > 0) {
        let priorItem = array[index - 1]
        if (item.isText && !priorItem.isYear && !priorItem.isText) {
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

    if (index < (events.length - 1)) {
        if (item.isText && array[index + 1].isResource) {
            timeline.push(createSpacer())
        }
        if (item.isText && array[index + 1].isResource) {
            timeline.push(createSpacer())
        }
        if (item.isResource && array[index + 1].isResource) {
            timeline.push(createSeparator())
        }
    } else {
        // If the final thing isn't a year push a space
        if (!item.isYear) {
            timeline.push(createSeparator())
        }
    }
})

// End the timeline
timeline.push(createBulb())
timeline.push(createSpacer())

// Any paragraphs/header without years go here in order found in dataFile
userNotes.forEach((item, index, array) => {
    timeline.push(item)
})

// Put the timeline back into the JSON data
json["timeline"] = timeline

// Do the ✨ Handlebars magic ✨
let templateFile = fs.readFileSync('source/template.hbs', "utf-8")
let template = Handlebars.compile(templateFile)
let html = template(json)

// Output
let htmlFile = "index.html"
fs.writeFile(htmlFile, html, err => {
    if (err) {
        console.log(err)
    } else {
        console.log(`HTML written to '${htmlFile}'`)
    }
})
