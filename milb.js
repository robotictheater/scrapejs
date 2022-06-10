const scrape=require("./scrape");

(async function() {

    await scrape.browser.open();

    let pages = scrape.extract.list({
        "selector":"#clubsbyname > div > p > a",
        "type":"attr",
        "attr":"href"
    },await scrape.browser.load("https://www.milb.com/about/teams"));
    
    let dataToSave=[];

    for(let page of pages){
      dataToSave.push( await scrape.browser.exists("https://www.milb.com"+page, {"options":["/ballpark/front-office","/ballpark/front-office-staff","/team/front-office","/team/front-office-staff", "/team/directory", "/ballpark/frontoffice", "/ballpark/staffdirectory", "/team/frontoffice" ,"/fans/front-office","/ballpark/staff-directory"]}) ); 
    }

    scrape.browser.close();

    scrape.render.toJSON("/milb/pages.json",dataToSave);

})();