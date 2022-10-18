const express = require('express')
const { exec } = require("child_process");
const fs = require('fs')
const cors = require('cors')
const fileUpload = require('express-fileupload');
const app = express()
const port = 3000

app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
}));
app.use(cors())

app.post('/upload', function(req, res) {
    let sampleFile;
    let uploadPath;

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    sampleFile = req.files.file;
    uploadPath = __dirname + '/tmp/temp';

    if (/[\\\/\:\*\?\"\<\>\|]/.test(sampleFile.name)) {
        return res.status(400).send('Invalid filename');
    }

    sampleFile.mv(uploadPath, function(err) {
        if (err)
            return res.status(500).send(err);
        
        exec(`./trid "tmp/temp"`, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                res.send('Error occured');
            } else if (stderr) {
                console.log(`stderr: ${stderr}`);
                res.send('Error occured');
            } else {
                if(stdout.split('\n')[7].startsWith('Warning:')) {
                    res.send({
                        'msg': 'File is in plain text',
                    });
                } else {
                    let result = {}
                    let lines = stdout.split('\n').slice(5, -1);
                    result.name = lines[0].split(': ')[1].split('/')[1];
                    result.probabilities = lines.slice(1).map(line => {
                        let [probability, name] = line.trim().split('% ');
                        return { name, probability: probability + '%' };
                    });
                    res.send(result);
                }
            }
            fs.unlinkSync(uploadPath);
        });
    });
    
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})