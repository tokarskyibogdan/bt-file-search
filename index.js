#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2).reduce((acc, arg) => {
    let [k, v = true] = arg.split('=');
    acc[k.slice(2).toLowerCase().replace('-s', 'S')] = v;
    return acc
}, {});

console.log('test');
console.log('test');

let directory = args.dir,
    type = args.type,
    pattern = args.pattern,
    minSize = args.minSize,
    maxSize = args.maxSize;

if (!directory) throw new Error('--DIR is required param');

const typeCheck = (type, file) => {
    if (type === 'D') {
        return file.isDirectory
    } else if (type === 'F') {
        return !file.isDirectory
    } else {
        return true;
    }
};

const convertSize = size => {
    let sizeType = size.slice(-1);
    let sizeValue = size.substring(0, size.length - 1);
    switch (sizeType) {
        case 'K':
            return sizeValue * 1024;
        case 'M':
            return sizeValue * 1048576;
        case 'G':
            return sizeValue * 1073741824;
        default:
            return sizeValue
    }
};

let maxSizeCheck = (fileSize, maxSize) => {
    if (fileSize && maxSize) {
        return convertSize(maxSize) > fileSize;
    } else {
        return true;
    }
};

let minSizeCheck = (fileSize, minSize) => {
    if (fileSize && minSize) {
        return convertSize(minSize) < fileSize;
    } else {
        return true;
    }
};

let search = (directory, done) => {
    let results = [];
    fs.readdir(directory, (err, list) => {
        if (err) return done(err);
        let pending = list.length;
        if (!pending) return done(null, results);
        list.forEach(filePath => {
            let fileName = filePath;
            filePath = path.resolve(directory, filePath);
            fs.stat(filePath, (err, stat) => {
                if (stat && stat.isDirectory()) {
                    search(filePath, (err, res) => {
                        results.push({name: fileName, path: filePath, isDirectory: stat.isDirectory()});
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    });
                } else {
                    results.push({name: fileName, path: filePath, size: stat.size, isDirectory: stat.isDirectory()});
                    if (!--pending) done(null, results);
                }
            });
        });
    });
};

search(directory, function (err, results) {
    if (err) throw err;
    console.log(results.filter(file => file.name.match(pattern)
        && typeCheck(type, file) && minSizeCheck(file.size, minSize)
        && maxSizeCheck(file.size, maxSize)).map(file => file.path));
});
