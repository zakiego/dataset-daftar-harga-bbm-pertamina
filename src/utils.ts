import * as cheerio from "cheerio";
import { DateTime } from "luxon";
import { Fuel, Price } from "./type";
import * as fs from "fs";
import { fulesDict } from "./fuelsDict";
import * as path from "path";

export const getDate = ($: cheerio.CheerioAPI) => {
  const raw = $(".col-12.col-lg-6").find("center").find("p").text();
  const removeDot = raw.replace(".", "");
  const split = removeDot.split(" ");
  const slice = split.slice(split.length - 3, split.length).join(" ");
  const date = DateTime.fromFormat(slice, "dd LLLL yyyy", {
    locale: "id",
  });
  return date.toFormat("d-L-yyyy");
};

export const getFuels = ($: cheerio.CheerioAPI) => {
  const fuels: Fuel[] = [];

  $(".card-body").each((i, elem) => {
    const fuelImage = $(elem).find("img").attr("src") as string;
    const fuelType = fulesDict.find((fuel) => fuel.image === fuelImage)!.type;

    const prices: Price[] = [];

    $(elem)
      .find(".d-flex.justify-content-between")
      .each((i, elem) => {
        const prov = $(elem).find(".text-sm.font-weight-bolder").text();
        const price = $(elem).find(".text-danger.font-weight-bolder").text();

        prices.push({ prov, price });
      });

    fuels.push({ fuelType, prices });
  });

  return fuels;
};

export const saveTimeSeries = (fuels: object, date: string) => {
  const fileName = `${date}.json`;
  const filePath = `./data-time-series/${fileName}`;
  const json = JSON.stringify(fuels, null, 2);
  fs.writeFileSync(filePath, json);
};

export const createMaster = () => {
  const jsonsInDir = fs
    .readdirSync("./data-time-series")
    .filter((file) => path.extname(file) === ".json");

  const bucket: { master: { date: string; data: Fuel[] }[] } = { master: [] };

  jsonsInDir.forEach((file) => {
    const fileData = fs.readFileSync(path.join("./data-time-series", file));
    const parseData = JSON.parse(fileData.toString());
    bucket.master.push(parseData);
  });

  const sortBucket = {
    master: bucket.master.sort((a, b) => {
      const aDate = DateTime.fromFormat(a.date, "d-L-yyyy");
      const bDate = DateTime.fromFormat(b.date, "d-L-yyyy");
      return aDate.diff(bDate).milliseconds;
    }),
  };

  fs.writeFileSync("./data-master.json", JSON.stringify(sortBucket, null, 2));

  masterJsonToCsv(sortBucket.master);
};

const masterJsonToCsv = (master: { date: string; data: Fuel[] }[]) => {
  const csv = master
    .map((m) => {
      const { date, data } = m;
      const csv = data
        .map((f) => {
          const { fuelType, prices } = f;
          const csv = prices
            .map((p) => {
              const { prov, price } = p;
              return `${date},${fuelType},${prov},${price}`;
            })
            .join("\n");
          return csv;
        })
        .join("\n");
      return csv;
    })
    .join("\n");

  const addHeader = "date,fuelType,prov,price";
  const csvWithHeader = `${addHeader}\n${csv}`;

  fs.writeFileSync("./data-master.csv", csvWithHeader);
};

export const createProvinceList = (data: Fuel[]) => {
  const provinces: string[] = [];
  data.forEach((f) => {
    f.prices.forEach((p) => {
      const { prov } = p;
      if (!provinces.includes(prov)) {
        provinces.push(prov);
      }
    });
  });
  fs.writeFileSync(
    "./province.json",
    JSON.stringify({ provinces: provinces }, null, 2),
  );
  return provinces;
};
