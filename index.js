const axios = require("axios");
var prompt = require("prompt");
const Schedule = require("./Schedule");
var fs = require("fs");
let filejson;
let filename = fs.readdirSync("../Schedule");
let dataInput;

try {
  if (!process.argv[2]) {
    dataInput = [
      new Date().getDay,
      new Date().getMonth,
      new Date().getFullYear,
    ];
  }
  dataInput = process.argv[2].split("/");
} catch (error) {}

if (dataInput.length == 3) {
  filename.map((item) => {
    if (item.indexOf("qldt") != -1) {
      filejson = item;
    }
  });
  if (filejson == null) {
    console.log("File json not found");
  } else {
    let rawdata = fs.readFileSync(filejson);
    let newjson = JSON.parse(rawdata);
    let { url, cookies } = newjson;
    let cookie = `${cookies[0].name}=${cookies[0].value}; ${cookies[1].name}=${cookies[1].value}`;
    const scheduleData = new Schedule(cookie);
    async function Find(year, month, day) {
      let result = await scheduleData.ShowDataFind(year, month, day);
      let { name, data } = result;
      if (data.length == 0) {
        console.log("Hom nay khong co lich hoc");
      } else {
        console.log("\n");
        console.log(name);
        console.log("\n");
        data.map((item) => {
          console.log(item.name, " =======>Tiet hoc:", item.details.tietHoc);
          console.log("\n");
        });
      }
    }
    Find(dataInput[2], dataInput[1], dataInput[0]);
  }
} else {
  console.log("Date sai format");
}
try {
} catch (error) {
  console.log("Hay Nhap Ngay");
}
