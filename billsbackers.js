const scrape=require("./scrape");

(async function() {

    let output=[];

    await scrape.browser.open();
    let html=await scrape.file("/bills.html"); //


    for(let x=3; x<=54; x++){
        let stateHtml=scrape.extract.html(html, "#fsRow4516893-"+x);

        let entry=[];
        stateHtml.split("</p>").forEach((stateLine,i)=>{
            if(stateLine.indexOf("<strong>")>0){ if(entry.length>1){ output.push(entry); } entry=[]; }
            entry.push(scrape.extract.text(stateLine));
        });

        output.push(entry);
    }

    scrape.render.arrayToCSV("/bills.csv",output);
    
    console.log(output);

    process.exit();
    
 
    

})();