const { default: axios } = require("axios");

class Schedule {
  constructor(cookie) {
    this.cookie = cookie;
    this.name = "";
    this.schedule = [];
  }
  async getData() {
    let respon = await axios.get(
      "http://qldt.actvn.edu.vn/CMCSoft.IU.Web.Info/Reports/Form/StudentTimeTable.aspx",
      {
        headers: {
          Cookie: this.cookie,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36 Edg/97.0.1072.55",
        },
      }
    );
    const regexName = /<span id="lblStudent">(?<username>.*?)<\/span>/gm;
    let name = regexName.exec(respon.data);
    if (name == null) {
      console.log("Cookie không hợp lệ");
    } else {
      this.name = name.groups.username;

      let cssListItem = this.getArrayMatch(
        /<tr class="cssListItem" style="height:20px;">(?<cssListItem>.*?)<\/tr>/gms,
        respon.data
      );
      let cssListAlternativeItem = this.getArrayMatch(
        /<tr class="cssListAlternativeItem" style="height:20px;">(?<cssListAlternativeItem>.*?)<\/tr>/gms,
        respon.data
      );
      this.ConvertData(cssListItem);
      this.ConvertData(cssListAlternativeItem);
      return this.schedule;
    }
  }
  getArrayMatch(regex, input) {
    let arrayResult = [];
    const regexs = regex;
    let m;
    while ((m = regexs.exec(input)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      arrayResult.push(m[0]);
    }
    return arrayResult;
  }
  ConvertData(input) {
    for (const item of input) {
      const regex =
        /<td align="center">\d{0,3}<\/td><td style="font-weight:bold;">(?<Name>.*?)<\/td><td>/gms;
      let m = regex.exec(item);
      const regexname = /[^\t|\r\n]+/gms;
      let subjectName = regexname.exec(m.groups.Name)[0];
      const regexDetails =
        /(Từ(?<Start>.*?)đến(?<End>.*?):) <b>\((?<NumberAddress>\d{0,4})\)<\/b><br>(?<Detail>&nbsp;&nbsp;&nbsp;<b>Thứ \d tiết [\d|,]+ [\(LT\)|\(TH\)]+<\/b><br>){0,4}/gms;
      let Detailshtml = this.getArrayMatch(regexDetails, item); // data thô trùng khớp
      let timeLearn = [];

      for (const itemDetail of Detailshtml) {
        const regexStartEnd = /Từ (?<start>.*?) đến (?<end>.*?):/gm;
        //get thời gian bắt đầu đến kết thúc
        let mm = regexStartEnd.exec(itemDetail);
        let timeEndSplit = mm.groups.end.split("/");
        let timeStartSplit = mm.groups.start.split("/");
        let timeStart = new Date(
          timeStartSplit[2],
          timeStartSplit[1] - 1,
          timeStartSplit[0]
        ).getTime();
        let timeEnd = new Date(
          timeEndSplit[2],
          timeEndSplit[1] - 1,
          timeEndSplit[0]
        ).getTime();

        const regexdataLearn = /Thứ \d tiết [\d|,]+/gm;
        let dataLearn = this.getArrayMatch(regexdataLearn, itemDetail); // lấy ra tất cả ngày phải học

        for (const itemdataLearn of dataLearn) {
          // duyệt qua tuần học
          const regexNgayTiet = /Thứ (?<Thu>\d) tiết (?<Tiet>[\d|,]+)/gm;
          let hmm = regexNgayTiet.exec(itemdataLearn);
          let thu = hmm.groups.Thu;
          let tiet = hmm.groups.Tiet;

          // console.log(timeEnd-timeStart)
          let time = 0;

          for (let k = timeStart; k <= timeEnd; k += 86400000) {
            let timeCheck = new Date(k).getDay();

            if (thu == timeCheck + 1) {
              let timeRes = new Date(k).getTime();
              let ngayhoc = {
                time: timeRes,
                tietHoc: tiet,
              };

              timeLearn.push(ngayhoc);
            }
          }
        }
      }
      let subject = {
        name: subjectName,
        time: timeLearn,
      };
      this.schedule.push(subject);
    }
  }
  async ShowDataFind(year, month, day) {
    let date = new Date(year, month - 1, day).getTime();
    let result = {
      name: "",
      data: [],
    };
    await this.getData();
    if (this.name == "") {
    } else {
      result.name = this.name;
      this.schedule.map((subject) => {
        let name = subject.name;

        subject.time.map((item) => {
          if (date == item.time) {
            let subj = {
              name: name,
              details: item,
            };
            result.data.push(subj);
          }
        });
      });
    }
    return result;
  }
}
module.exports = Schedule;
