require('Common');
var system = require('System');

var readline = require('readline');
var fs = require('fs');
var dateFormat = require('dateformat');

var recordsStorage = system.home + '/.did/records.csv';
var durationChar = '+';
var durationMin = 10;

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
        RecordTable.scroll.top = 31;
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

// register key-commands
application.registerHotKey('q', 'cmd', function(){ window.destroy(); }); // quit
application.registerHotKey('v', 'cmd', function(){ application.paste(); }); // paste
application.registerHotKey('c', 'cmd', function(){ application.copy(); }); // copy
application.registerHotKey('x', 'cmd', function(){ application.cut(); }); // cut
application.registerHotKey('a', 'cmd', function(){ application.selectAll(); }); // select all

window.addEventListener('resize', function() {
    RecordTable.resize();
});

application.registerHotKey('\u007f', '', function() {
});

//window.addEventListener('focus', function(){
//    System.mouseDownAt(5,5);
//});

RecordTable.init();
RecordTable.resize();

var input = new TextInput();

window.appendChild(input);

input.textcolor = 'rgba(0,0,0,1);';
input.top = 3;
input.height = 25;
input.left = 3;
//input.middle = 0;
input.placeholder = 'I did';
input.right = 3;

input.focus();

input.addEventListener('inputend', function(e) {
    var title = input.value;

    if(title){
        Records.add(title, function(){
            window.destroy();
        });
    }
});
