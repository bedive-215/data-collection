export function jsonToToon(data) {
    if (!data) {
        return 'SurveyStructure{}: \n No data available';
    }
    
    if (typeof data === 'object' && !Array.isArray(data)) {
        return convertObjectToToon(data);
    }
    
    if (Array.isArray(data)) {
        if (data.length === 0) {
            return 'SurveyStructure{}: \n No data available';
        }
        return convertArrayToToon(data);
    }
    
    return 'SurveyStructure{}: \n Invalid data format';
}

function convertObjectToToon(obj) {
    let toonString = 'SurveyStructure{\n';
    
    for (const [key, value] of Object.entries(obj)) {
        if (key === 'questions' && Array.isArray(value)) {
            toonString += `  ${key}: [\n`;
            value.forEach((q, idx) => {
                toonString += `    Q${idx + 1}: "${q.question_content}" (${q.type}) - ${q.total_responses} responses\n`;
                if (q.options) {
                    q.options.forEach(opt => {
                        toonString += `      - ${opt.label}: ${opt.count} (${opt.percent}%)\n`;
                    });
                }
                if (q.cleaned_answers) {
                    toonString += `      Top answers:\n`;
                    q.cleaned_answers.slice(0, 3).forEach(ans => {
                        toonString += `        • ${ans.text} (${ans.count})\n`;
                    });
                }
            });
            toonString += `  ]\n`;
        } else if (typeof value !== 'object') {
            toonString += `  ${key}: ${value}\n`;
        }
    }
    
    toonString += '}\n';
    return toonString;
}

function convertArrayToToon(data) {
    const firstItem = data[0];
    if (!firstItem || typeof firstItem !== 'object') {
        return 'SurveyStructure{}: \n Invalid data format';
    }
    
    const headers = Object.keys(firstItem);
    let toonString = `SurveyStructure{${headers.join(',')}}:\n`;
    
    data.forEach(item => {
        if (!item) return;
        const row = headers.map(key => {
            const value = item[key] !== undefined && item[key] !== null ? item[key] : '';
            return String(value).replace(/\n/g, ' ');
        });
        toonString += row.join('|') + '\n';
    });
    
    return toonString.trim();
}