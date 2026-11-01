/** 保存结构化模拟记录，恢复时重新绘制，不再次抽卡或结算。 */
(function(){
    'use strict';
    const copy=value=>JSON.parse(JSON.stringify(value));
    function additions(results,gifts=[],allowAppend=false){
        const entries=[];let batch=[];
        const flush=()=>{if(batch.length)entries.push({kind:'batch',results:copy(batch),pullType:batch[0].pullType,allowAppend});batch=[];};
        for(const result of results){if(batch.length&&(batch[0].pullType!==result.pullType||batch.length===10))flush();batch.push(result);}
        flush();for(const gift of gifts)entries.push({kind:'gift',gift:copy(gift)});return entries;
    }
    function create(engine,entries,selections){return {version:1,engine:copy(engine),entries:copy(entries),selections:copy(selections)};}
    function valid(record){
        return record?.version===1&&SimulatorStart.valid(record.engine)&&Array.isArray(record.entries)&&
            record.selections&&typeof record.selections==='object'&&Object.values(record.selections).every(tier=>tier&&['up','std','spec'].every(k=>Array.isArray(tier[k])&&tier[k].every(name=>typeof name==='string')))&&
            record.entries.every(entry=>{
                if(entry?.kind==='batch')return Array.isArray(entry.results)&&entry.results.length>0&&entry.results.length<=10&&
                    ['paid','free_pity','free_nopity'].includes(entry.pullType)&&typeof entry.allowAppend==='boolean'&&entry.results.every(r=>r&&typeof r.name==='string'&&Number.isSafeInteger(r.total)&&r.total>=0&&r.pullType===entry.pullType);
                if(entry?.kind==='gift')return typeof entry.gift?.name==='string'&&Number.isSafeInteger(entry.gift.atTotal)&&entry.gift.atTotal>=0;
                return entry?.kind==='rotation'&&typeof entry.name==='string'&&Number.isSafeInteger(entry.pity)&&entry.pity>=0;
            });
    }
    window.SimulatorSession=Object.freeze({additions,create,valid});
})();
