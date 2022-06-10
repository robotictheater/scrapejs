const scrape=require("./scrape");

(async function() {

    await scrape.browser.open();
    await scrape.browser.load("https://www.nacsshow.com/Attendee-Directory?vw=location"); //
    let html=await scrape.browser.click("#p_lt_ctl07_pageplaceholder_p_lt_ctl05_AttendeeDirectory__imgButton2");
    scrape.render.toText("/nacs-click.html",html);
    
   
   /*let html=scrape.file("/nacs.html");
    let tableData = scrape.extract.tableToObjects({
        "selector":"table tr",
        "cols":[
            {
                "key":"name",
                "type":"text"
            },
            {
                "key":"company",
                "type":"text"
            },
            {
                "key":"title",
                "type":"text"
            },
            {
                "key":"location",
                "type":"text"
            }
        ]
    },html);
    
    scrape.helper.transform([
        {
            "field":"name",
            "type":"stringToFields",
            "separator":",",
            "map":["lastname","firstname"]
        },
        {
            "field":"location",
            "type":"stringToFields",
            "separator":",",
            "map":["city","state"]
        },
        {
            "field":"name",
            "type":"delete"
        },
        {
            "field":"location",
            "type":"delete"
        }
    ], tableData);

    scrape.render.toCSV("/nacs.csv",{
        cols:["company","city","state","firstname","lastname","title"]
    },tableData);
*/



    process.exit();
    
    //
    //scrape.load.click("#p_lt_ctl07_pageplaceholder_p_lt_ctl05_AttendeeDirectory__imgButton2");

    
    
    
    

})();