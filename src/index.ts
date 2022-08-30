import * as cheerio from "cheerio";
import {
  createMaster,
  createProvinceList,
  getDate,
  getFuels,
  saveTimeSeries,
} from "./utils";

const originalFetch = require("cross-fetch");
const fetch = require("fetch-retry")(originalFetch);

const main = async () => {
  const doc = await fetch("https://mypertamina.id/fuels-harga", {
    retries: 7,
    retryDelay: 500,
  }).then((resp) => resp.text());

  const $ = cheerio.load(doc);

  const date = getDate($);
  const fuels = getFuels($);
  createProvinceList(fuels);

  const data = { date, data: fuels };

  saveTimeSeries(data, date);
  createMaster();
};

main();
