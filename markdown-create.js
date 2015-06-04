var fs = require('fs');

var md = function(title){
  this.data = '';
  this.heading(title, 1);
}

md.prototype.append = function(text, newLine){
  this.data += text;

  if(typeof newLine !== 'undefined'){
    while(newLine > 0){
      this.data+= '\n';
      newLine--;
    }
  }
}

md.prototype.newLine = function(){
  this.append('\n');
}

md.prototype.doubleNewLine = function(){
  this.append('\n\n');
}

md.prototype.heading = function(text, level){
  var suffix = '';
  while(level > 0){
    suffix+= '#';
    level--;
  }
  suffix+= ' ';
  this.append(suffix + text, 2);
}

md.prototype.quote = function(text){
  text.replace('\n', '\n> ');
  this.append('> ' + text, 2);
}

md.prototype.text = function(){
  return this.data;
}

md.prototype.save = function(filename, callback){
  if(fs.existsSync(filename)) {
    callback(new Error(filename + ' already exists'));
    return;
  }
  fs.writeFile(filename, this.data, function(err) {
    if(err) callback(err);

    callback(null);
  });
}

module.exports = md;
