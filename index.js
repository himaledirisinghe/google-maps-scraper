import puppeteer from "puppeteer";
import xlsx from "xlsx";

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set the navigation timeout value
  page.setDefaultNavigationTimeout(60000);

  await page.goto("https://www.google.lk/maps/@7.857685,80.70625,7z?entry=ttu");

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });

  // Type into search box
  await page.type("#searchboxinput", "hotels+in+Sri+Lanka");

  // Wait and click on first result
  const searchResultSelector = ".mL3xi";
  await page.waitForSelector(searchResultSelector);
  await page.click(searchResultSelector);

  await page.waitForSelector(".hfpxzc");
  const places = [];

  for (let i = 0; i < 25; i++) {
    console.log(i);

    const element = await page.evaluateHandle(
      (index) => document.querySelectorAll(".hfpxzc")[index],
      i
    );

    if (element) {
      try {
        await element.click();
        await page.waitForNavigation();
        await page.waitForSelector(".CsEnBe");
        await page.waitForTimeout(1500);

        const placeName = await page.evaluate(
          () => document.querySelectorAll(".DUwDvf")[0].innerText
        );

        const existingPlace = places.find((place) => place.name === placeName);

        if (!existingPlace) {
          const items = await page.evaluate(
            () => document.querySelectorAll(".CsEnBe").length
          );

          const info = {};

          info["Name"] = placeName;

          for (let i = 0; i < items; i++) {
            const innerText = await page.evaluate(
              (index) => document.querySelectorAll(".CsEnBe")[index].innerText,
              i
            );

            const tooltip = await page.evaluate(
              (index) =>
                document.querySelectorAll(".CsEnBe")[index].dataset.tooltip,
              i
            );
            // Wait for 1 second before proceeding iteration
            await page.waitForTimeout(1000);
            if (tooltip == "Copy address") {
              info["Address"] = innerText;
            } else if (tooltip == "Open website") {
              info["Website"] = `https://www.${innerText}`;
            } else if (tooltip == "Copy phone number") {
              info["Phone Number"] = innerText;
            } else if (tooltip == "Copy plus code") {
              info["Plus Code"] = innerText;
            } else if (
              tooltip == "Open menu link" ||
              tooltip == "Place an order" ||
              tooltip == "Open reservation link" ||
              tooltip == undefined
            ) {
            } else {
              info[tooltip] = innerText;
            }
          }

          places.push(info);
        }
      } catch (error) {
        console.log(error);
      }

      await page.evaluate(() => {
        const scrollElement = document.querySelectorAll(".ecceSd")[1];
        scrollElement.scrollBy(0, 300);
      });
    } else {
      break;
    }
  }
  console.log(places);
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(places);
  xlsx.utils.book_append_sheet(wb, ws, "Hotels");
  xlsx.writeFile(wb, "Places.xlsx");

  await browser.close();
})();
