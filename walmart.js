const scrape=require("./scrape");

(async function() {

    await scrape.browser.open();
    let data=await scrape.file("/walmart.txt");
    
    let row=0;
    let cell=0;
    let output=[];

    let obj={};
    let cellLimit=5;
    data.split("\r\n").forEach((d,i)=>{

        if(cell>cellLimit){
            output.push(obj);
            row++;
            cell=0;
        }

        if(cell===0){
            obj={
                "store_num":"",
                "manager":"",
                "address":"",
                "city":"",
                "state":"",
                "zip":"",
                "phone":""
            }
        }

        if(d.length>0){
            switch(cell){
                case 0:
                    obj.store_num=d;
                break;
                case 1:
                    obj.manager=d;
                break;
                case 2:
                    obj.address=d;
                break;
                case 3:
                    obj.city=d;
                break;
                case 4:
                    obj.state=d;
                break;
                case 5:
                    obj.zip=d;
                    if(d.length<5){
                        cellLimit=6;
                    }else{
                        let dParts=d.split(" ");
                        if(dParts[0]){
                            obj.zip = dParts[0].trim()
                        }
                        if(dParts[1]){
                            obj.phone = dParts[1].trim()
                        }                                            

                        cellLimit=5;
                    }
                    if(obj.zip.length===4){
                        obj.zip="0"+obj.zip;
                    }

                    obj.zip = obj.zip.toString();
                break;
                case 6:
                    obj.phone=d;
                break;
            }
    
            cell++;
        }

        
    })

   
    
    scrape.render.toCSV("/walmart.csv",{},output);

    console.log(output);

    process.exit();
    
 
    

})();