var sys = require('sys');
var http = require('http');
var url = require('url');
var Buffer = require('buffer').Buffer;

var jspack = require('./jspack').jspack;
var dataset = require('./dataset').dataset;

var MAP = {
    'int16'  : 'i',  // packed in 4 bytes
    'uint16' : 'I',  // packed in 4 bytes
    'int32'  : 'i',
    'uint32' : 'I',
    'int'    : 'i',
    'uint'   : 'I',
    'float32': 'f',
    'float64': 'd'
}

StopIteration = function () {};
StopIteration.prototype = new Error();
StopIteration.name = 'StopIteration';
StopIteration.message = 'StopIteration';

function dds (dataset) {
    var output = "Dataset {\n  Sequence {\n";
    for (var name in dataset.vars) {
        output += "    " + dataset.vars[name].type + " " + name + ";\n";
    }
    output += "  } " + dataset.sequence + ";\n} " + dataset.name + ";\n\n";
    return output;
}

function das (dataset) {
    var output = "Attributes {\n  " + dataset.sequence + " {\n";
    for (var name in dataset.vars) {
        output += "    " + name + " {\n";
        for (var k in dataset.vars[name].attributes) {
            var v = dataset.vars[name].attributes[k];
            output += "      " + getType(v) + " " + k + " " + encodeAtom(v) + ";\n";
        }
        output += "    }\n";
    }
    output += "  }\n}\n\n";
    return output;
}

function getType (v) { 
    if (typeof(v) == 'string') {
        return "String";
    } else if (typeof(v) == 'number') {
        if (String(v).indexOf('.') == -1) {
            return "Int32";
        } else {
            return "Float64";
        }
    } else {
        return getType(v[0]); 
    }
}

function encodeAtom (v) {
    return JSON.stringify(v).replace(/^\[/, '').replace(/\]$/, '');
}

function constrain (dataset, search) {
    search = (search === undefined) ? '' : search.replace(/^\?/, '');  // remove '?' from request

    // work with a copy
    var filtered = {
        name: dataset.name,
        sequence: dataset.sequence,
        vars: {}
        // data will be replaced by an iterable
    }

    // parse projection and selection
    var order = [];
    for (var name in dataset.vars) {
        order.push(name);
    }
    var projection = order.slice(0);  // copy order
    var selection = search.split('&');
    if ((selection != '') && (!selection[0].match(/<=|>=|!=|=~|>|<|=/))) {
        projection = selection.splice(0, 1)[0].split(',');
    }
    // check for direct sequence request
    for (var i=0; i<projection.length; i++) {
        if (projection[i] == dataset.sequence) {
            projection = order.slice(0);
            break;
        }
    }

    // get order of requested variables
    var name, indexes = [];
    for (var i=0; i<projection.length; i++) {
        name = projection[i];
        if (name.indexOf('.') != -1) name = name.split('.')[1];
        filtered.vars[name] = dataset.vars[name];
        indexes.push( order.indexOf(name) );
    }

    // build filter from selection
    var filters = [];
    for (var i=0; i<selection.length; i++) {
        if (selection[i].match(/<=|>=|!=|=~|>|<|=/)) {
            filters.push( buildFilter(selection[i], dataset.vars) );
        }
    }

    // return an iterable
    var i = 0, skip, row;
    filtered.data = {
        'next': function () {
            while (i < dataset.data.length) {
                skip = false;
                for (var j=0; j<filters.length; j++) {
                    if (!filters[j](dataset.data[i])) {
                        i++;
                        skip = true;
                        break;
                    }
                }
                if (!skip) {
                    row = [];
                    // reorder data 
                    for (var j=0; j<indexes.length; j++) {
                        row.push( dataset.data[i][ indexes[j] ]);
                    }
                    i++;
                    return row;
                }
            }
            throw StopIteration;
        }
    };

    return filtered;
}

function buildFilter (cond, vars) {
    // assume first token is var, third is constant
    var tokens = cond.split(/(<=|>=|!=|=~|>|<|=)/);
    var a = tokens[0], op = tokens[1], b = tokens[2];

    if (a.indexOf('.') != -1) a = a.split('.')[1];  // remove sequence name from id
    var index = 0;
    for (var name in vars) {
        if (a == name) break;
        index++;
    }
    b = eval(b);

    switch (op) {
        case '<=': return function (row) { return row[index] <= b };
        case '>=': return function (row) { return row[index] >= b };
        case '!=': return function (row) { return row[index] != b };
        case '=' : return function (row) { return row[index] == b };
        case '=~': return function (row) { return row[index].match( RegExp(b) ) };
        case '>' : return function (row) { return row[index] > b };
        case '<' : return function (row) { return row[index] < b };
    }
}

http.createServer(function (req, res) {
    var filtered = constrain(dataset, url.parse(req.url).search);

    switch (url.parse(req.url).pathname) {
        case '/.das':
            res.writeHead(200, {
                'Content-description': 'dods_das',
                'Content-type': 'text/plain'});
            res.end(das(dataset));  // use the unfiltered dataset
            break;
        case '/.dds':
            res.writeHead(200, {
                'Content-description': 'dods_dds',
                'Content-type': 'text/plain'});
            res.end(dds(filtered));
            break;
        case '/.dods':
            res.writeHead(200, {
                'Content-description': 'dods_data',
                'Content-type': 'application/octet-stream'});
            res.write(dds(filtered));
            res.write('Data:\n');
            fmt = '>';  // big endian
            for (var name in filtered.vars) {
                fmt += MAP[filtered.vars[name].type.toLowerCase()];
            }
            try {
                while (true) {
                    var row = filtered.data.next();
                    res.write("\x5a\x00\x00\x00", 'binary');  // start of sequence
                    octets = jspack.Pack(fmt, row);
                    res.write(new Buffer(octets), 'binary');
                }
            } catch (e) {
                if (e != StopIteration) {
                    throw e;
                }
            }
            res.end("\xa5\x00\x00\x00", 'binary');  // end of sequence
            break;
        default:
            res.writeHead(404, {'Content-type': 'text/plain'});
            res.end('Page not found.');
    }

}).listen(8002);
sys.puts('Server running at http://127.0.0.1:8002/');