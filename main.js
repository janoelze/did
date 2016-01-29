require('Common');
var system = require('System');

var readline = require('readline');
var fs = require('fs');
var dateFormat = require('dateformat');

var configFile = system.home + '/.did/conf.json';
var config = {};

fs.exists(configFile, function(exists){
    if(exists){
        config = require(configFile);

        Main.init();
    };
});

var recordsStorage = system.home + '/.did/records.csv';
var durationChar = '+';
var durationMin = 10;

function saveConfig(){
    fs.writeFile(configFile, JSON.stringify(config), {
        flags: 'wx'
    });
}

var Records = {
    getAll: function(cb){
        var recs = [];

        fs.exists(recordsStorage, function (exists) {
            if(exists){
                var lineReader = readline.createInterface({
                  input: fs.createReadStream(recordsStorage)
                });

                lineReader.on('line', function (line) {
                    recs.push(line.split(','));
                });

                lineReader.on('close', function(){
                    //recs.sort(function(a, b){
                    //    return a[1] < b[1];
                    //});
                    cb(recs.reverse());
                });
            }else{
                cb([]); // return empty records list
            }
        });
    },
    delete: function(selectedIndexes){

    },
    clearTitle: function(title){
        return title.split(durationChar).join('');
    },
    getDate: function(){
        return Math.floor(Date.now() / 1000);
    },
    parseDuration: function(title){
        return (title.split(durationChar).length - 1);
    },
    add: function(title, cb){
        var date = Records.getDate();

        var newLine = [title, date].join(',') + "\n";

        fs.appendFile(recordsStorage, newLine, function (err) {
            if (err) throw err;
            cb(true);
        });
    },
    store: function(records){
        fs.writeFile("records.json", JSON.stringify(records), function(err) {
            return true;
        });
    }
};

var RecordTable = {
    object: false,
    scroll: false,
    clear: function(cb){
        for (var i = 0; i < RecordTable.numberOfRows; i++) {
            RecordTable.removeRow(i);
        };

        cb();
    },
    resize: function(){
        RecordTable.object.setColumnWidth('Date', 160);
        RecordTable.object.setColumnWidth('Duration', 85);
        RecordTable.object.setColumnWidth('Title', (window.width - 160 - 85 - 5));
    },
    load: function(){
        RecordTable.clear(function(){
            Records.getAll(function(recs){
                for (var i = 0; i < recs.length; i++) {
                    RecordTable.object.addRow();

                    var durationChars = Records.parseDuration(recs[i][0]);
                    var date = dateFormat(parseInt(recs[i][1]) * 1000, "dd-mm-yyyy HH:MM");
                    var title = Records.clearTitle(recs[i][0]);

                    var durationString = '< ' + durationMin + ' min';

                    if(durationChars){
                        durationString = (durationChars * durationMin) + ' min';
                    }

                    RecordTable.object.setValueAt('Date', i, date);
                    RecordTable.object.setValueAt('Duration', i, durationString);
                    RecordTable.object.setValueAt('Title', i, title);
                };
            });
        });
    },
    init: function(){
        RecordTable.object = new Table();
        RecordTable.scroll = new Scroll();

        window.appendChild(RecordTable.scroll);

        RecordTable.scroll.setChild(RecordTable.object);

        RecordTable.scroll.left = RecordTable.scroll.right = RecordTable.scroll.bottom = 0;
        RecordTable.scroll.top = 43;
        RecordTable.scroll.bottom = 27;
        RecordTable.scroll.hortizontal = false;

        RecordTable.object.alternatingColors = true;

        RecordTable.object.addColumn('Date');
        RecordTable.object.addColumn('Title');
        RecordTable.object.addColumn('Duration');

        RecordTable.load();
    }
};

var window = new Window();

window.visible = true;
window.width = 600;
window.textured = true;

window.maximizeButton = false;
window.minimizeButton = false;
window.closeButton = false;

window.title = "";

application.exitAfterWindowsClose = true; // If no windows are open, exit.

window.addEventListener('resize', function() {
    RecordTable.resize();
});

var Main = {
    initHotKeys: function(){
        // register key-commands
        application.registerHotKey('q', 'cmd', function(){ window.destroy(); }); // quit
        application.registerHotKey('v', 'cmd', function(){ application.paste(); }); // paste
        application.registerHotKey('c', 'cmd', function(){ application.copy(); }); // copy
        application.registerHotKey('x', 'cmd', function(){ application.cut(); }); // cut
        application.registerHotKey('a', 'cmd', function(){ application.selectAll(); }); // select all

        application.registerHotKey('\u007f', '', function() {
            var selectedIndexes = RecordTable.object.selectedRows;

            if (selectedIndexes.length) {
                var confirmationBox = new Dialog();

                confirmationBox.title = 'Are you sure you want to delete this entry?';
                confirmationBox.message = 'This cannot be undone.';
                confirmationBox.open();

                confirmationBox.addEventListener('click', function(){
                    Records.delete(selectedIndexes);
                });
            };
        });
    },
    init: function(){
        Main.initHotKeys();

        RecordTable.init();
        RecordTable.resize();

        var input = new TextInput();

        window.appendChild(input);

        var inputMargin = 10;

        input.textcolor = 'rgba(0,0,0,1);';
        input.top = inputMargin;
        input.height = 25;
        input.left = inputMargin;
        //input.middle = 0;
        input.placeholder = 'I did';
        input.right = inputMargin;

        input.focus();

        input.addEventListener('inputend', function(e) {
            var title = input.value;

            if(title){
                Records.add(title, function(){
                    if (config.quitOnDataEntry) {
                        window.destroy();
                    }else{
                        input.value = '';
                        RecordTable.load();
                    };
                });
            }
        });

        var button = new Button();

        button.title = 'Quit app on data entry';
        button.border = false;
        button.type = 'checkbox';
        button.left = 10;
        button.bottom = 3;

        console.log(config.quitOnDataEntry);

        if (config.quitOnDataEntry) {
            button.state = true;
        }else{
            button.state = false;
        };

        button.addEventListener('click', function(){
            config.quitOnDataEntry = button.state;
            saveConfig();
        });

        window.appendChild(button);
    }
};


