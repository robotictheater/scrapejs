const fs = require('fs');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');


module.exports={
    file:(filePath)=>{
        return fs.readFileSync(process.cwd()+filePath,{encoding:'utf8', flag:'r'});
    },
    browser:{
        obj:null,
        page:null,
        open:async function(){
            this.obj = await puppeteer.launch();
            this.page = await this.obj.newPage();
            this.page.setDefaultNavigationTimeout(60000);
        },
        load:async function(url, params){
            await this.page.goto(url,{"waitUntil" : ((params && params.waitUntil) ? params.waitUntil : ["load"])}); //"load"|"domcontentloaded"|"networkidle0"|"networkidle2"

            if(params && params.waitForFunction){
                await this.page.waitForFunction(params.waitForFunction);
            }
            return await this.page.content();
        },
        exists:async function(url, params){
            if(!params){ params={}; }           

            if(!params.options){ params.options=[""]; }
            let dataToReturn = ((params.options.length===1) ? "" : [false,url]);

            for(let optionPage of params.options){
                try{
                    let response = await this.page.goto(url+optionPage,{"waitUntil" : ((params && params.waitUntil) ? params.waitUntil : ["load"])}) //"load"|"domcontentloaded"|"networkidle0"|"networkidle2"
                    if(response.status()===200){
                        if(params.options.length===1){
                            dataToReturn = url+optionPage;
                        }else{
                            dataToReturn = [true, url+optionPage];
                        }                        
                        break;
                    }
                }catch(e){ }
            }

            return dataToReturn;             
        },

        click:async function(el){
            

            console.log("clicking", await this.page.click(el));
            await this.page.waitForSelector("#p_lt_ctl07_pageplaceholder_p_lt_ctl05_AttendeeDirectory__grdResults");
            return await this.page.content();
            
        },

        close:async function(){
            await this.obj.close();
        }

    },  
    extract:{
        /*---------------------------------------
            LIST
            Extract DOM elements that appear in a list

            PARAMS
                - selector 
                - type (text | attr | text)
                - attr 
        ----------------------------------------*/
        list:(param, data)=>{
            const $ = cheerio.load(data);
            let output=[];
        
            $(param.selector).each((i, item)=>{
                switch(param.type){
                    case "text":
                        if($(item).text()){
                            output.push($(item).text());
                        }                    
                    break;
                    case "attr":
                        if($(item).attr(param.attr)){
                            output.push($(item).attr(param.attr));
                        }                    
                    break;
                    default:
                        if($(item).html()){
                            output.push($(item).html());
                        }                    
                    break;
                }
                
            });
            return output;
        },
        htmlToObject:(params, data)=>{
            let output=[];
            if(typeof data==="string"){ data=[data]; }
            data.forEach((d,i)=>{
                const $ = cheerio.load(d);
                let row={};
                params.selectors.forEach(selector=>{
                                    
                    switch(selector.type){
                        case "static":
                            row[selector.field]=selector.value;
                        break;
                        case "text":
                            if($(selector.selector).length>1){
                                let content=[];
                                $(selector.selector).each((i, c)=>{

                                    if(selector.condition){
                                        if(selector.condition.test($(c).text().trim())){
                                            content.push($(c).text().trim());
                                        }
                                    }else{
                                        content.push($(c).text().trim());
                                    }

                                    
                                });
                               
                                row[selector.field]=((typeof selector.element==="number") ? content[selector.element] : content);
                                

                                
                            }else if($(selector.selector).length===1){

                                if(selector.condition){
                                    if(selector.condition.test($(selector.selector).text().trim())){
                                        row[selector.field]=$(selector.selector).text().trim();
                                    }else if(selector.allow_empty){
                                        row[selector.field]="";
                                    }   
                                }else{
                                    row[selector.field]=$(selector.selector).text().trim();
                                }
                                
                            }else if(selector.allow_empty){
                                row[selector.field]="";
                            }                        
                        break;
        
                        case "attr":
                            
                            if($(selector.selector).length>1){
                                let content=[];
                                $(selector.selector).each((i, c)=>{
                                    if(selector.condition){
                                        if(selector.condition.test($(c).attr(selector.attr).trim())){
                                            content.push($(c).attr(selector.attr).trim());
                                        }else if(selector.allow_empty){
                                            row[selector.field]="";
                                        }   
                                    }else{
                                        content.push($(c).attr(selector.attr).trim());
                                    }
                                    
                                });                                
                                row[selector.field]=content;
                            }else if($(selector.selector).length===1){
                                if(selector.condition){
                                    if(selector.condition.test($(selector.selector).attr(selector.attr).trim())){
                                        row[selector.field]=$(selector.selector).attr(selector.attr).trim();
                                    }else if(selector.allow_empty){
                                        row[selector.field]="";
                                    }   
                                }else{
                                    row[selector.field]=$(selector.selector).attr(selector.attr).trim();
                                }
                                
                            }else if(selector.allow_empty){
                                row[selector.field]="";
                            }                              
                        break;
                       

                        default:                        
                            if($(selector.selector).html()){
                                if($(selector.selector).length>1){
                                    let content=[];
                                    $(selector.selector).each((i, c)=>{
                                        content.push($(c).html().trim());
                                    });

                                    row[selector.field]=content;
                                }else{
                                    row[selector.field]=$(selector.selector).html().trim();
                                }
                                
                            }                        
                        break;
                    }
                    
                });
                output.push(row);
            });
            return ((output.length===1) ? output[0] : output);
        },
        text:(str, selector)=>{
            const $ = cheerio.load(str);
            if(selector){
                return $(selector).text().trim();
            }else{
                return $.text().trim();
            }
        },
        html:(str, selector)=>{
            const $ = cheerio.load(str);
            if(selector){
                return $(selector).html().trim();
            }else{
                return $.html().trim();
            }
        },
        addressFromString:(params, str)=>{
            let result={};
            str.split(params.separator).forEach(part=>{
                                
                //Street
                if(part.trim().match(/^[a-z0-9-]{1,}\s[0-9a-z\s]+/i)){
                    result.street = part.trim();
                }

                //Suite
                if(part.trim().toLowerCase().indexOf("suite")===0 
                || part.trim().toLowerCase().indexOf("ste")===0
                || part.trim().toLowerCase().indexOf("unit")===0
                || part.trim().toLowerCase().indexOf("#")===0){
                    result.suite = part.trim();
                }

                //City, State Zip Section
                if(part.trim().match(/^[a-z\s]+,+.+[0-9-]{5,}$/i)){
                    if(part.match(/^[a-z\s]+,/i)){
                        result.city = part.match(/^[a-z\s]+,/i)[0].trim().replace(",","");
                    }                                                            
                    if(part.match(/\s[a-z]+\s/i)){
                        result.state = part.match(/\s[a-z]+\s/i)[0].trim();
                    }  
                    if(part.match(/\s[0-9-]{1,}$/)){
                        result.zip = part.match(/\s[0-9-]{1,}$/)[0].trim();
                    }                                                              
                    
                }else if(part.trim().match(/^[a-z]+\s+.+[0-9-]{5,}$/i)){
                    if(part.match(/^[a-z]+\s/i)){
                        result.city = part.match(/^[a-z]+\s/i)[0].trim();
                    }                                                            
                    if(part.match(/\s[a-z]+\s/i)){
                        result.state = part.match(/\s[a-z]+\s/i)[0].trim();
                    }  
                    if(part.match(/\s[0-9-]{1,}$/)){
                        result.zip = part.match(/\s[0-9-]{1,}$/)[0].trim();
                    }  
                }

                if(part.trim().match(/\(*[0-9]{3}\)*[-\s\.]?[0-9]{3}[-\s\.][0-9]{4}/)){
                    if(part.toLowerCase().trim().indexOf("fax")>=0){
                        result.fax = part.trim().match(/\(*[0-9]{3}\)*[-\s\.]?[0-9]{3}[-\s\.][0-9]{4}/)[0];
                    }else if(part.toLowerCase().trim().indexOf("cell")>=0){
                        result.cell = part.trim().match(/\(*[0-9]{3}\)*[-\s\.]?[0-9]{3}[-\s\.][0-9]{4}/)[0];
                    }else if(typeof result.phone!=="undefined"){
                        result.phone_2 = part.trim().match(/\(*[0-9]{3}\)*[-\s\.]?[0-9]{3}[-\s\.][0-9]{4}/)[0];
                    }else{
                        result.phone = part.trim().match(/\(*[0-9]{3}\)*[-\s\.]?[0-9]{3}[-\s\.][0-9]{4}/)[0];
                    }
                }

            });

            return result;
        },
        tableToObjects:(params, data)=>{
            const $ = cheerio.load(data);
            let tableData=[];
            
            $(params.selector).each(function(r, row){
                let rowData={};
                params.cols.forEach((col,c)=>{

                    switch(col.type){
                        case "html":
                            rowData[col.key] = $(row).find(`td:eq(${c})`).html();                            
                        break;
                        default:
                            rowData[col.key] = $(row).find(`td:eq(${c})`).text();
                        break;
                    }                    
                    if(rowData[col.key]){
                        rowData[col.key] = rowData[col.key].trim();
                    }

                });
                tableData.push(rowData);
            });

            return tableData;
        }
    },
    render:{
        toJSON:(file, data)=>{
            fs.writeFileSync(process.cwd()+file, JSON.stringify(data));
        },
        toCSV:(file, params, data)=>{
            let output="";
            
            let dataCols=[];
            data.forEach(d=>{
                Object.keys(d).forEach(key=>{
                    if(!dataCols.includes(key)){
                        dataCols.push(key);
                    }
                });
            });

            let cols=((params && typeof params.cols==="object") ? params.cols : dataCols);

            data.forEach((row,i)=>{
                output+="\n";
                cols.forEach((col, colI)=>{
                    if(colI>0){
                        output+=",";
                    }
                    if(typeof row[col]==="string"){
                        output+=`"${row[col].replace(/"/g,'\\"')}"`;
                    }else if(row[col]===undefined || row[col]===null){
                        output+=`""`;
                    }else{
                        output+=`${row[col]}`;
                    }
                    
                });            
            });

            output=`"`+cols.join(`","`)+`"`+output;
            
            fs.writeFileSync(process.cwd()+file, output);
        },
        toText:(file, data)=>{
            fs.writeFileSync(process.cwd()+file, data);
        }
    },
    helper:{
        subset:(indexes, data)=>{
            if(!indexes){
                return data;
            }else{
                return data.filter((o,i)=>{
                    return indexes.indexOf(i) !== -1
                });
            }            
        },
        transform:(params, data)=>{
            let cast=(data, type)=>{
                switch(type){
                    case "number":
                        return Number(data);
                    break;
                }
            };
          
    
            data.forEach((d,i)=>{
                params.forEach(transform=>{ 
                    switch(transform.type){
                        case "cast":
                            data[i][transform.field]=cast(data[i][transform.field], transform.to)
                        break;
                        case "delete":
                            if(typeof transform.field!=="undefined"){
                                delete data[i][transform.field];
                            }else if(typeof transform.fields!=="undefined"){
                                transform.fields.forEach(field=>{
                                    delete data[i][field];
                                });
                            }
                            
                        break;
                        case "htmlDecode":
                            data[i][transform.field] = cheerio.load(data[i][transform.field]).text();                         
                        break;
                        case "stringToFields":
                            try{
                                if(typeof data[i][transform.field]==="string"){

                                    if(typeof transform.separator==="object"){
                                        transform.separator.some((sep)=>{
                                            if(data[i][transform.field].indexOf(sep)>=0){
                                                transform.separator=sep;
                                                return true;
                                            }
                                        })
                                    }

                                    let parts = data[i][transform.field].split(transform.separator);
                                    if(transform.map.length>0){
                                        transform.map.forEach((mapItem, mapIndex)=>{
                                            data[i][mapItem]=((parts[mapIndex]) ? parts[mapIndex].trim() : null);
                                        });
                                    }else{
                                        let map=((transform.map[parts.length]) ? transform.map[parts.length] : []);
                                        map.forEach((mapItem, mapIndex)=>{
                                            data[i][mapItem]=((parts[mapIndex]) ? parts[mapIndex].trim() : null);
                                        });
                                    }      
                                }
                            }catch(e){
                                console.log(e);
                                console.log(data[i][transform.field]);
                            }
                                             
                        break;
                        case "stringToAddress":
                            data[i][transform.field].split(transform.separator).forEach(part=>{
                                
                                //Street
                                if(part.trim().match(/^[0-9-]{1,}\s[a-z]+/i)){
                                    data[i].street = part.trim();
                                }
    
                                //Suite
                                if(part.trim().toLowerCase().indexOf("suite")===0 
                                || part.trim().toLowerCase().indexOf("unit")===0
                                || part.trim().toLowerCase().indexOf("#")===0){
                                    data[i].suite = part.trim();
                                }
    
                                //City, State, Zip Section
                                if(part.trim().match(/^[a-z]+,+.+[0-9-]{5,}$/i)){
                                    if(part.match(/^[a-z]+,/i)){
                                        data[i].city = part.match(/^[a-z]+,/i)[0].trim().replace(",","");
                                    }                                                            
                                    if(part.match(/\s[a-z]+\s/i)){
                                        data[i].state = part.match(/\s[a-z]+\s/i)[0].trim();
                                    }  
                                    if(part.match(/\s[0-9-]{1,}$/)){
                                        data[i].zip = part.match(/\s[0-9-]{1,}$/)[0].trim();
                                    }                                                              
                                    
                                }
    
                                if(part.trim().match(/\(*[0-9]{3}\)*[-\s\.]?[0-9]{3}[-\s\.][0-9]{4}/)){
                                    if(part.toLowerCase().trim().indexOf("fax")>=0){
                                        data[i].fax = part.trim().match(/\(*[0-9]{3}\)*[-\s\.]?[0-9]{3}[-\s\.][0-9]{4}/)[0];
                                    }else if(typeof data[i].phone!=="undefined"){
                                        data[i].phone_2 = part.trim().match(/\(*[0-9]{3}\)*[-\s\.]?[0-9]{3}[-\s\.][0-9]{4}/)[0];
                                    }else{
                                        data[i].phone = part.trim().match(/\(*[0-9]{3}\)*[-\s\.]?[0-9]{3}[-\s\.][0-9]{4}/)[0];
                                    }
                                }
    
    
                            });
                        break;
                        case "replace":
                            if(typeof data[i][transform.field]!=="undefined"){
                                data[i][transform.field] = data[i][transform.field].replace(transform.search, transform.replace).trim();
                            }else{
                                data[i][transform.field]="";
                            }                            
                        break;
                        case "function":                                         
                            require(transform.file)(data, i);
                        break;
                    }                
                });            
            });
            return data;
        }
    }
};

