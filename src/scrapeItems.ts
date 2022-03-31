import * as puppeteer from "puppeteer";
import * as fs from "fs";
import * as interfaces from "./interfaces";

(async () => {
    const browser: puppeteer.Browser = await puppeteer.launch({
        headless: true
    });
    const page: puppeteer.Page = await browser.newPage();
    await page.goto("https://dankmemer.lol/items");
    page.on('console', async (msg: puppeteer.ConsoleMessage): Promise<void> => {
        const msgArgs = msg.args();
        for (let i: number = 0; i < msgArgs.length; ++i) {
            if(await msgArgs[i].jsonValue() === "console.clear") {
                console.clear();
            } else {
                console.log(await msgArgs[i].jsonValue());
            }
        }
    });
    const items = await page.evaluate(async (): Promise<interfaces.item[]> => {
        const items: NodeList = document.querySelectorAll(".gap-4.content-start.mt-4 > div.max-h-24.w-24.h-24.flex.items-center.justify-center.rounded-md.cursor-pointer.bg-light-500.border-4");
        let itemsArr: interfaces.item[] = [];

        for(let i: number = 0; i < items.length; i++) {
            const element: HTMLElement = items[i] as HTMLElement;
            const sidebar: HTMLElement = document.querySelector("#__next > div.flex.flex-col.h-screen.justify-between > div.flex.justify-center.mx-8 > div > div.my-20.flex.flex-col.space-y-4 > div.flex.justify-between.space-x-0.relative.flex-col-reverse > div.flex-1.h-full.rounded-md.p-8.align-top.sticky.top-0");

            element.click();

            await new Promise((resolve, reject): NodeJS.Timeout => setTimeout(() => resolve(true), 10));

            const textContent: string = sidebar.innerText || "";
            const info: interfaces.item = Object.assign({},
                ...Object.entries(
                    Object.assign({}, ...textContent
                        .replace(/Buy Price[\s\S]+/, "")
                        .replace(/Craftable From[\s\S]+/, "")
                        .split(/\n/)
                        .map((v: string, i: number): Object => ({
                            [v.split(":")[1] ? v.split(":")[0].toLowerCase() : i ? i === 4 ? "description" : "" : "name"]: (v.split(":")[1] || v.split(":")[0]).trim()
                        }))
                    )
                ).filter((v: [string, Object]): boolean => !!v[1]).map((v: [string, Object]): Object => ({ [v[0]]: v[1]})),
                ...textContent
                    .replace(/[\s\S]+Buy Price/, "Buy Price")
                    .split(/(?=sell\b)/i)
                    .map((v: string): Object => ({
                        [v.split(/\s*price\s*/i)[0]]: v
                            .split(/\s*price\s*/i)[1]
                            ?.replace(/[^\da-zA-Z\s]/g, "")
                            ?.trim() || "Couldn't find"
                        })
                    )
                );

            itemsArr.push(info);

            const length = 100;
            console.clear();
            console.log(`|${"-".repeat(Math.round(i / (items.length / length)))}${"\\|/-\\|/-"[i % 8]}${"-".repeat(Math.round((items.length - i) / (items.length / length)))}|`);
        }

        return itemsArr;
    });

    browser.close();

    const itemsByName = Object.assign({}, ...items.map((v: interfaces.item): Object => ({ [v.id]: Object.assign({}, ...Object.entries(v).filter((v: [string, Object]): boolean => v[0] !== "id").map((v: [string, Object]): Object => ({ [v[0]]: v[1]}))) })));

    const file = "./lib/items.json";

    fs.writeFile(file, JSON.stringify(itemsByName, null, 4), () => {});
})();